// src/components/ChatPopup.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import chatSupportService from "../services/chatSupportService";
import useAuth from "../auth/hooks/useAuth";

export default function ChatPopup({ onClose }) {
	const [messages, setMessages] = useState([]);
	const [input, setInput] = useState("");
	const [chatId, setChatId] = useState(null);
	const [chatStatus, setChatStatus] = useState("CONNECTING"); // CONNECTING, ACTIVE, CLOSED, ERROR
	const [connectionAttempts, setConnectionAttempts] = useState(0);
	const bottomRef = useRef();
	const clientRef = useRef(null);
	const { user } = useAuth();

	// Ngắt kết nối WebSocket
	const disconnectWebSocket = useCallback(() => {
		if (clientRef.current) {
			try {
				clientRef.current.deactivate();
				clientRef.current = null;
			} catch (e) {
				console.error("Error deactivating WebSocket:", e);
			}
		}
	}, []);

	// Hàm xử lý tin nhắn nhận được từ server
	const handleIncomingMessage = useCallback(
		(chatData) => {
			console.log("Processing chat data:", chatData);

			if (!chatData) return;

			// Cập nhật chatId nếu có
			if (chatData.id) {
				setChatId(chatData.id);
			}

			// Cập nhật trạng thái chat nếu có
			if (chatData.status) {
				setChatStatus(chatData.status);
			}

			// Xử lý tin nhắn nếu có
			if (chatData.message) {
				const isFromModerator =
					chatData.moderatorId !== null &&
					user &&
					user.id !== chatData.moderatorId;

				setMessages((prevMessages) => [
					...prevMessages,
					{
						sender: isFromModerator ? "MODERATOR" : "USER",
						content: chatData.message,
						timestamp: chatData.timestamp,
					},
				]);
			}
		},
		[user],
	);

	// Tách hàm kết nối WebSocket ra riêng để dễ quản lý
	const connectWebSocket = useCallback(() => {
		if (clientRef.current?.connected) {
			disconnectWebSocket();
		}

		try {
			// Lấy token
			const token = localStorage.getItem("token");
			if (!token) {
				console.error("No authentication token found");
				setChatStatus("ERROR");
				setMessages((prevMessages) => [
					...prevMessages,
					{
						sender: "SYSTEM",
						content: "Authentication error. Please login again.",
					},
				]);
				return;
			}

			// Xác định URL WebSocket
			const currentOrigin = window.location.origin;
			const sockjsUrl =
				process.env.NODE_ENV === "development"
					? "http://localhost:8080/ws-message"
					: `${currentOrigin}/ws-message`;

			console.log(`Creating SockJS connection to ${sockjsUrl}`);
			console.log("Using token for WebSocket:", token.substring(0, 10) + "...");

			// Tạo client STOMP
			const client = new Client({
				webSocketFactory: () => new SockJS(sockjsUrl),
				connectHeaders: {
					Authorization: `Bearer ${token}`,
				},
				reconnectDelay: 5000,
				heartbeatIncoming: 4000,
				heartbeatOutgoing: 4000,
				debug: function (str) {
					console.log(`STOMP: ${str}`);
				},
			});

			// Xử lý kết nối thành công
			client.onConnect = () => {
				console.log("Connected to chat support websocket");
				setChatStatus((prevStatus) =>
					prevStatus === "CONNECTING" ? "CONNECTING" : "ACTIVE",
				);
				setConnectionAttempts(0);

				// Subscribe to personal queue for chat messages
				client.subscribe(`/user/queue/support`, (message) => {
					try {
						console.log("Raw message received:", message);
						const chatData = JSON.parse(message.body);
						console.log("Received chat support data:", chatData);

						// Xử lý tin nhắn nhận được
						handleIncomingMessage(chatData);
					} catch (error) {
						console.error("Error processing message:", error);
					}
				});

				// Start chat session if no active one found
				if (chatStatus === "CONNECTING") {
					console.log("Starting new chat session...");
					client.publish({
						destination: "/app/support.start",
						headers: { Authorization: `Bearer ${token}` },
						body: JSON.stringify({ sender: user.username }),
					});

					setMessages((prevMessages) => [
						...prevMessages,
						{ sender: "SYSTEM", content: "Connecting to a support agent..." },
					]);
				}
			};

			// Xử lý lỗi STOMP
			client.onStompError = (frame) => {
				console.error("Broker reported error: " + frame.headers["message"]);
				console.error("Additional details: " + frame.body);
				setChatStatus("ERROR");
				setMessages((prevMessages) => [
					...prevMessages,
					{
						sender: "SYSTEM",
						content: "Connection error. Please try again later.",
					},
				]);
			};

			// Xử lý lỗi WebSocket
			client.onWebSocketError = (error) => {
				console.error("WebSocket error:", error);
				setChatStatus("ERROR");
				setMessages((prevMessages) => [
					...prevMessages,
					{
						sender: "SYSTEM",
						content:
							"WebSocket connection error. Please check your network connection.",
					},
				]);
			};

			// Xử lý đóng kết nối WebSocket
			client.onWebSocketClose = () => {
				console.log("WebSocket connection closed");
				// Only set error if we're not intentionally closing
				if (chatStatus === "CONNECTING" || chatStatus === "ACTIVE") {
					setChatStatus("ERROR");
					setMessages((prevMessages) => [
						...prevMessages,
						{
							sender: "SYSTEM",
							content: "Connection to server lost. Attempting to reconnect...",
						},
					]);
				}
			};

			// Kích hoạt kết nối
			client.activate();
			clientRef.current = client;
		} catch (error) {
			console.error("Error connecting to WebSocket:", error);
			setChatStatus("ERROR");
			setMessages((prevMessages) => [
				...prevMessages,
				{
					sender: "SYSTEM",
					content:
						"WebSocket connection error. Please check your network connection.",
				},
			]);
		}
	}, [chatStatus, handleIncomingMessage, user, disconnectWebSocket]);

	useEffect(() => {
		if (!user) return;

		// Check if user has existing chat sessions
		chatSupportService
			.getUserChats()
			.then((response) => {
				const chats = response.data.data;
				console.log("User chats:", chats);
				if (chats && chats.length > 0) {
					const activeChat = chats.find((chat) => chat.status === "ACTIVE");
					if (activeChat) {
						console.log("Found active chat:", activeChat);
						setChatId(activeChat.id);
						setChatStatus("ACTIVE");
						setMessages((prevMessages) => [
							...prevMessages,
							{
								sender: "SYSTEM",
								content: "Resuming previous chat with moderator.",
							},
						]);

						// Xử lý tin nhắn hiện có
						if (activeChat.message) {
							handleIncomingMessage(activeChat);
						}
					}
				}
			})
			.catch((error) => {
				console.error("Error checking existing chats:", error);
				setChatStatus("ERROR");
			});

		// Kết nối WebSocket
		connectWebSocket();

		return () => {
			disconnectWebSocket();
		};
	}, [user, handleIncomingMessage, connectWebSocket, disconnectWebSocket]);

	// Thêm useEffect riêng để xử lý kết nối lại khi có lỗi
	useEffect(() => {
		if (chatStatus === "ERROR" && connectionAttempts < 3) {
			const reconnectTimer = setTimeout(() => {
				console.log(`Attempting to reconnect (${connectionAttempts + 1}/3)...`);
				setConnectionAttempts((prev) => prev + 1);
				connectWebSocket();
			}, 3000);

			return () => clearTimeout(reconnectTimer);
		}
	}, [chatStatus, connectionAttempts, connectWebSocket]);

	useEffect(() => {
		if (bottomRef.current) {
			bottomRef.current.scrollIntoView({ behavior: "smooth" });
		}
	}, [messages]);

	const sendMsg = () => {
		if (
			input.trim() &&
			clientRef.current?.connected &&
			chatStatus === "ACTIVE"
		) {
			const token = localStorage.getItem("token");

			console.log("Sending message:", input);
			clientRef.current.publish({
				destination: "/app/support.send",
				headers: { Authorization: `Bearer ${token}` },
				body: JSON.stringify({ content: input }),
			});

			// Optimistically add message to UI
			setMessages((prevMessages) => [
				...prevMessages,
				{ sender: "USER", content: input, timestamp: new Date().toISOString() },
			]);

			setInput("");
		} else if (chatStatus !== "ACTIVE") {
			setMessages((prevMessages) => [
				...prevMessages,
				{ sender: "SYSTEM", content: "Waiting for a moderator to join..." },
			]);
		} else if (!clientRef.current?.connected) {
			setMessages((prevMessages) => [
				...prevMessages,
				{
					sender: "SYSTEM",
					content: "Connection lost. Attempting to reconnect...",
				},
			]);
			connectWebSocket();
		}
	};

	const handleCloseChat = () => {
		if (chatId && chatStatus === "ACTIVE") {
			chatSupportService
				.closeChat(chatId)
				.then(() => {
					setChatStatus("CLOSED");
					setMessages((prevMessages) => [
						...prevMessages,
						{ sender: "SYSTEM", content: "Chat session ended." },
					]);
				})
				.catch((error) => {
					console.error("Error closing chat:", error);
				});
		}
		disconnectWebSocket();
		onClose();
	};

	return (
		<div
			className="card position-fixed"
			style={{
				bottom: "80px",
				right: "20px",
				width: "350px",
				height: "450px",
				zIndex: 1000,
			}}
		>
			<div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
				<div>
					<strong>Chat Support</strong>
					{chatStatus === "CONNECTING" && (
						<span className="badge bg-warning ms-2">Connecting...</span>
					)}
					{chatStatus === "ACTIVE" && (
						<span className="badge bg-success ms-2">Connected</span>
					)}
					{chatStatus === "CLOSED" && (
						<span className="badge bg-secondary ms-2">Closed</span>
					)}
					{chatStatus === "ERROR" && (
						<span className="badge bg-danger ms-2">Error</span>
					)}
				</div>
				<button
					type="button"
					className="btn-close btn-close-white"
					onClick={handleCloseChat}
				></button>
			</div>
			<div className="card-body overflow-auto p-3 bg-light">
				{messages.map((m, i) => (
					<div
						key={i}
						className={`mb-2 ${m.sender === "USER" ? "text-end" : ""}`}
					>
						{m.sender === "SYSTEM" && (
							<div className="text-center">
								<span className="badge bg-info text-white px-3 py-2">
									{m.content}
								</span>
							</div>
						)}
						{m.sender === "USER" && (
							<div className="d-flex flex-column align-items-end">
								<span
									className="badge bg-primary text-white px-3 py-2"
									style={{ maxWidth: "80%", borderRadius: "16px 16px 0 16px" }}
								>
									{m.content}
								</span>
								{m.timestamp && (
									<small className="text-muted mt-1">
										{new Date(m.timestamp).toLocaleTimeString([], {
											hour: "2-digit",
											minute: "2-digit",
										})}
									</small>
								)}
							</div>
						)}
						{m.sender === "MODERATOR" && (
							<div className="d-flex flex-column align-items-start">
								<span
									className="badge bg-secondary text-white px-3 py-2"
									style={{ maxWidth: "80%", borderRadius: "16px 16px 16px 0" }}
								>
									{m.content}
								</span>
								{m.timestamp && (
									<small className="text-muted mt-1">
										{new Date(m.timestamp).toLocaleTimeString([], {
											hour: "2-digit",
											minute: "2-digit",
										})}
									</small>
								)}
							</div>
						)}
					</div>
				))}
				<div ref={bottomRef} />
			</div>
			<div className="card-footer bg-light">
				<div className="input-group">
					<input
						type="text"
						className="form-control"
						placeholder={
							chatStatus === "CONNECTING"
								? "Connecting..."
								: chatStatus === "ACTIVE"
									? "Type your message..."
									: chatStatus === "CLOSED"
										? "Chat ended"
										: "Connection error"
						}
						value={input}
						onChange={(e) => setInput(e.target.value)}
						onKeyPress={(e) => e.key === "Enter" && sendMsg()}
						disabled={chatStatus !== "ACTIVE"}
					/>
					<button
						type="button"
						className="btn btn-primary"
						onClick={sendMsg}
						disabled={!input.trim() || chatStatus !== "ACTIVE"}
					>
						<i className="fas fa-paper-plane"></i>
					</button>
				</div>
			</div>
		</div>
	);
}
