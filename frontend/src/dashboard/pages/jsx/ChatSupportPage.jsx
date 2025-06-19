// src/dashboard/pages/ChatSupportPage.jsx

import React, { useState, useEffect, useRef } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import moderatorService from "../../services/moderatorService";
import useAuth from "../../auth/hooks/useAuth";

export default function ChatSupportPage() {
	const [pendingChats, setPendingChats] = useState([]);
	const [activeChats, setActiveChats] = useState([]);
	const [selectedChat, setSelectedChat] = useState(null);
	const [messages, setMessages] = useState([]);
	const [input, setInput] = useState("");
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const { user } = useAuth();
	const clientRef = useRef(null);
	const messagesEndRef = useRef(null);

	// Load pending and active chats
	useEffect(() => {
		const fetchChats = async () => {
			try {
				setLoading(true);
				// Get pending chats
				const pendingRes = await moderatorService.getPendingChatSupport();
				setPendingChats(pendingRes.data.data || []);

				// Get active chats assigned to this moderator
				const activeRes = await moderatorService.getActiveChatSupport();
				setActiveChats(activeRes.data.data || []);

				setLoading(false);
			} catch (err) {
				console.error("Error fetching chats:", err);
				setError("Failed to load chat sessions");
				setLoading(false);
			}
		};

		fetchChats();

		// Set up interval to refresh chats
		const interval = setInterval(fetchChats, 30000); // Refresh every 30 seconds

		return () => clearInterval(interval);
	}, []);

	// Set up WebSocket connection
	useEffect(() => {
		if (!user) return;

		const client = new Client({
			webSocketFactory: () => new SockJS("http://localhost:8080/ws-message"),
			reconnectDelay: 5000,
			heartbeatIncoming: 4000,
			heartbeatOutgoing: 4000,
			onConnect: () => {
				console.log("Connected to chat support websocket as moderator");

				// Subscribe to personal queue for chat messages
				client.subscribe(`/user/queue/support`, (message) => {
					const chatData = JSON.parse(message.body);
					console.log("Received chat support data:", chatData);

					// Update active chats if needed
					if (chatData.moderatorId === user.id) {
						// Check if this is a new chat or an update to an existing one
						setActiveChats((prevChats) => {
							const existingChatIndex = prevChats.findIndex(
								(c) => c.id === chatData.id,
							);

							if (existingChatIndex >= 0) {
								// Update existing chat
								const updatedChats = [...prevChats];
								updatedChats[existingChatIndex] = chatData;
								return updatedChats;
							} else {
								// Add new chat
								return [...prevChats, chatData];
							}
						});

						// Remove from pending if it was there
						setPendingChats((prevChats) =>
							prevChats.filter((c) => c.id !== chatData.id),
						);

						// If this is the currently selected chat, update messages
						if (selectedChat && selectedChat.id === chatData.id) {
							setMessages((prevMessages) => [
								...prevMessages,
								{
									sender: chatData.userId === user.id ? "MODERATOR" : "USER",
									content: chatData.message,
									timestamp: chatData.timestamp,
								},
							]);
						}
					}
				});
			},
			onStompError: (frame) => {
				console.error("Broker reported error: " + frame.headers["message"]);
				console.error("Additional details: " + frame.body);
				setError("WebSocket connection error");
			},
		});

		client.activate();
		clientRef.current = client;

		return () => {
			if (clientRef.current) {
				clientRef.current.deactivate();
			}
		};
	}, [user, selectedChat]);

	// Scroll to bottom of messages
	useEffect(() => {
		if (messagesEndRef.current) {
			messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
		}
	}, [messages]);

	const handleAcceptChat = async (chatId) => {
		try {
			await moderatorService.acceptChatSupport(chatId);

			// Optimistically update UI
			const acceptedChat = pendingChats.find((c) => c.id === chatId);
			if (acceptedChat) {
				setPendingChats((prevChats) =>
					prevChats.filter((c) => c.id !== chatId),
				);
				setActiveChats((prevChats) => [
					...prevChats,
					{
						...acceptedChat,
						moderatorId: user.id,
						moderatorName: user.username,
						status: "ACTIVE",
					},
				]);
			}
		} catch (err) {
			console.error("Error accepting chat:", err);
			setError("Failed to accept chat");
		}
	};

	const handleCloseChat = async (chatId) => {
		try {
			await moderatorService.closeChatSupport(chatId);

			// Optimistically update UI
			setActiveChats((prevChats) => prevChats.filter((c) => c.id !== chatId));

			// If this was the selected chat, clear it
			if (selectedChat && selectedChat.id === chatId) {
				setSelectedChat(null);
				setMessages([]);
			}
		} catch (err) {
			console.error("Error closing chat:", err);
			setError("Failed to close chat");
		}
	};

	const handleSelectChat = (chat) => {
		setSelectedChat(chat);

		// Simulate loading chat history
		setMessages([
			{
				sender: "SYSTEM",
				content: `Chat session started with ${chat.username}`,
				timestamp: chat.timestamp,
			},
			{
				sender: "USER",
				content: chat.message || "Hello, I need help with something.",
				timestamp: chat.timestamp,
			},
		]);
	};

	const handleSendMessage = () => {
		if (!input.trim() || !selectedChat || !clientRef.current?.connected) return;

		// Send message via WebSocket
		clientRef.current.publish({
			destination: "/app/support.send",
			body: JSON.stringify({ content: input }),
		});

		// Optimistically add to UI
		setMessages((prev) => [
			...prev,
			{
				sender: "MODERATOR",
				content: input,
				timestamp: new Date().toISOString(),
			},
		]);

		setInput("");
	};

	if (loading)
		return <div className="text-center p-5">Loading chat sessions...</div>;

	return (
		<div className="container-fluid">
			<h2 className="mb-4">Chat Support</h2>

			{error && (
				<div className="alert alert-danger">
					{error}
					<button
						className="btn-close float-end"
						onClick={() => setError(null)}
					></button>
				</div>
			)}

			<div className="row">
				{/* Left sidebar - chat list */}
				<div className="col-md-4">
					<div className="card mb-4">
						<div className="card-header bg-warning text-white">
							<h5 className="mb-0">Pending Chats ({pendingChats.length})</h5>
						</div>
						<div
							className="card-body p-0"
							style={{ maxHeight: "300px", overflowY: "auto" }}
						>
							{pendingChats.length === 0 ? (
								<p className="text-center p-3">No pending chats</p>
							) : (
								<ul className="list-group list-group-flush">
									{pendingChats.map((chat) => (
										<li
											key={chat.id}
											className="list-group-item d-flex justify-content-between align-items-center"
										>
											<div>
												<strong>{chat.username}</strong>
												<br />
												<small className="text-muted">
													{new Date(chat.timestamp).toLocaleTimeString()}
												</small>
											</div>
											<button
												className="btn btn-sm btn-success"
												onClick={() => handleAcceptChat(chat.id)}
											>
												Accept
											</button>
										</li>
									))}
								</ul>
							)}
						</div>
					</div>

					<div className="card">
						<div className="card-header bg-primary text-white">
							<h5 className="mb-0">Active Chats ({activeChats.length})</h5>
						</div>
						<div
							className="card-body p-0"
							style={{ maxHeight: "300px", overflowY: "auto" }}
						>
							{activeChats.length === 0 ? (
								<p className="text-center p-3">No active chats</p>
							) : (
								<ul className="list-group list-group-flush">
									{activeChats.map((chat) => (
										<li
											key={chat.id}
											className={`list-group-item d-flex justify-content-between align-items-center
                                ${selectedChat && selectedChat.id === chat.id ? "active" : ""}`}
											style={{ cursor: "pointer" }}
											onClick={() => handleSelectChat(chat)}
										>
											<div>
												<strong>{chat.username}</strong>
												<br />
												<small className="text-muted">
													{new Date(chat.timestamp).toLocaleTimeString()}
												</small>
											</div>
											<button
												className="btn btn-sm btn-danger"
												onClick={(e) => {
													e.stopPropagation();
													handleCloseChat(chat.id);
												}}
											>
												Close
											</button>
										</li>
									))}
								</ul>
							)}
						</div>
					</div>
				</div>

				{/* Right side - chat window */}
				<div className="col-md-8">
					{selectedChat ? (
						<div className="card" style={{ height: "600px" }}>
							<div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
								<div>
									<strong>Chat with {selectedChat.username}</strong>
								</div>
								<button
									className="btn btn-sm btn-danger"
									onClick={() => handleCloseChat(selectedChat.id)}
								>
									Close Chat
								</button>
							</div>

							<div
								className="card-body overflow-auto p-3"
								style={{ flexGrow: 1 }}
							>
								{messages.map((msg, idx) => (
									<div
										key={idx}
										className={`mb-3 ${msg.sender === "MODERATOR" ? "text-end" : ""}`}
									>
										{msg.sender === "SYSTEM" && (
											<div className="text-center my-3">
												<span className="badge bg-info text-white px-3 py-2">
													{msg.content}
												</span>
											</div>
										)}

										{msg.sender === "USER" && (
											<div className="d-flex">
												<div className="d-flex flex-column">
													<span
														className="badge bg-secondary text-white px-3 py-2"
														style={{
															maxWidth: "80%",
															borderRadius: "16px 16px 16px 0",
														}}
													>
														{msg.content}
													</span>
													<small className="text-muted mt-1">
														{selectedChat.username} •{" "}
														{new Date(msg.timestamp).toLocaleTimeString()}
													</small>
												</div>
											</div>
										)}

										{msg.sender === "MODERATOR" && (
											<div className="d-flex flex-column align-items-end">
												<span
													className="badge bg-primary text-white px-3 py-2"
													style={{
														maxWidth: "80%",
														borderRadius: "16px 16px 0 16px",
													}}
												>
													{msg.content}
												</span>
												<small className="text-muted mt-1">
													You • {new Date(msg.timestamp).toLocaleTimeString()}
												</small>
											</div>
										)}
									</div>
								))}
								<div ref={messagesEndRef} />
							</div>

							<div className="card-footer d-flex bg-white">
								<input
									className="form-control me-2"
									value={input}
									onChange={(e) => setInput(e.target.value)}
									onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
									placeholder="Type your message..."
								/>
								<button className="btn btn-primary" onClick={handleSendMessage}>
									<i className="bi bi-send"></i>
								</button>
							</div>
						</div>
					) : (
						<div className="card text-center p-5">
							<p className="text-muted">Select a chat to start messaging</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
