import React, { useState, useRef, useEffect } from "react";
import { sendMessage, savePlan } from "../../services/ChatBotService";
import { useNavigate } from "react-router-dom";
import "./Chatbot.css";

export default function Chatbot() {
	const [msgs, setMsgs] = useState([]); // { from, text, plan?, saved? }
	const [input, setInput] = useState("");
	const [loading, setLoading] = useState(false);
	const [showPlanModal, setShowPlanModal] = useState(false);
	const [currentPlan, setCurrentPlan] = useState(null);
	const [currentMsgIndex, setCurrentMsgIndex] = useState(null);
	const bottomRef = useRef();
	const navigate = useNavigate();

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [msgs]);

	useEffect(() => {
		// Add welcome message when component mounts
		setMsgs([
			{
				from: "Bot",
				text: "Hello! I'm your fitness assistant. I can help you create personalized workout plans or answer health and fitness questions. Try asking me to create a workout plan for your specific needs!",
			},
		]);
	}, []);

	const handleSend = async () => {
		if (!input.trim() || loading) return;

		// Add user message to chat
		setMsgs((prev) => [...prev, { from: "You", text: input }]);
		setInput("");
		setLoading(true);

		try {
			// Send message to API
			const response = await sendMessage(input, false);
			console.log("AI Response:", response.data); // Debug response structure

			// Extract content from response
			if (response.data && response.data.data) {
				// Regular message mode
				const botResponse = response.data.data;
				setMsgs((prev) => [
					...prev,
					{
						from: "Bot",
						text: botResponse,
						plan: detectWorkoutPlan(botResponse),
						saved: false,
					},
				]);
			} else {
				// Handle unexpected response format
				console.error("Unexpected response format:", response.data);
				setMsgs((prev) => [
					...prev,
					{
						from: "Bot",
						text: "Sorry, I received an unexpected response format. Please try again.",
						plan: null,
						saved: false,
					},
				]);
			}
		} catch (e) {
			console.error("Chatbot error:", e);
			let errorMsg = "Connection error. Please try again.";

			// Check for specific error types
			if (
				e.response?.status === 503 &&
				e.response?.data?.message?.includes("OpenAI API key")
			) {
				errorMsg =
					"The AI service is currently unavailable. The server administrator needs to update the OpenAI API key. You can continue using other features of the application.";
			} else if (e.response?.data?.message) {
				errorMsg = e.response.data.message;
			}

			setMsgs((prev) => [
				...prev,
				{
					from: "Bot",
					text: errorMsg,
					isError: true,
				},
			]);
		} finally {
			setLoading(false);
		}
	};

	// Function to handle preview plan request
	const handlePreviewPlan = async () => {
		if (!input.trim() || loading) return;

		// Add user message to chat
		setMsgs((prev) => [...prev, { from: "You", text: input }]);
		setInput("");
		setLoading(true);

		try {
			// Send message to API with preview flag set to true
			const response = await sendMessage(input, true);

			// Extract content from response
			if (response.data && response.data.data) {
				setMsgs((prev) => [
					...prev,
					{
						from: "Bot",
						text: "Here's a preview of your workout plan:",
						plan: response.data.data,
						saved: false,
					},
				]);
			} else {
				// Handle unexpected response format
				console.error("Unexpected plan format:", response.data);
				setMsgs((prev) => [
					...prev,
					{
						from: "Bot",
						text: "Sorry, I couldn't generate a workout plan preview. Please try again with more specific fitness goals.",
						plan: null,
						saved: false,
					},
				]);
			}
		} catch (e) {
			console.error("Plan preview error:", e);
			let errorMsg = "Connection error. Please try again.";

			// Check for specific error types
			if (
				e.response?.status === 503 &&
				e.response?.data?.message?.includes("OpenAI API key")
			) {
				errorMsg =
					"The AI service is currently unavailable. The server administrator needs to update the OpenAI API key. You can continue using other features of the application.";
			} else if (e.response?.data?.message) {
				errorMsg = e.response.data.message;
			}

			setMsgs((prev) => [
				...prev,
				{
					from: "Bot",
					text: errorMsg,
					isError: true,
				},
			]);
		} finally {
			setLoading(false);
		}
	};

	// Function to detect if a message contains a workout plan
	const detectWorkoutPlan = (text) => {
		// Check if the message contains workout-related keywords and structure
		const hasWorkoutKeywords =
			/workout|exercise|training|routine|plan|fitness|sets|reps/i.test(text);
		const hasStructure = /day \d|week \d|session \d|exercise \d/i.test(text);

		if (hasWorkoutKeywords && hasStructure) {
			try {
				// Extract plan details
				const lines = text.split("\n").filter((line) => line.trim() !== "");

				// Find a title - usually one of the first lines
				let title = "Workout Plan";
				for (let i = 0; i < Math.min(3, lines.length); i++) {
					if (
						lines[i].length < 50 &&
						/plan|workout|routine|program/i.test(lines[i])
					) {
						title = lines[i].trim();
						break;
					}
				}

				// Try to extract YouTube video URLs from the text
				const youtubeRegex =
					/(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/g;
				const youtubeMatches = [...text.matchAll(youtubeRegex)];

				const media = youtubeMatches.map((match, index) => {
					const videoId = match[4];
					const surroundingText = text.substring(
						Math.max(0, match.index - 50),
						Math.min(text.length, match.index + 50),
					);

					// Try to extract exercise name from surrounding text
					const exerciseNameMatch = surroundingText.match(
						/for\s+([a-zA-Z\s]+)(?:\.|,|\s|$)/i,
					);
					const exerciseName = exerciseNameMatch
						? exerciseNameMatch[1].trim()
						: `Exercise ${index + 1}`;

					return {
						type: "youtube",
						url: `https://www.youtube.com/watch?v=${videoId}`,
						title: `How to perform ${exerciseName} correctly`,
						exerciseName,
					};
				});

				// Create a structured plan
				return {
					title: title,
					details: lines,
					media: media,
					description: "Generated from chatbot conversation",
					difficulty: "Intermediate",
					targetMuscleGroups: "",
					estimatedDurationMinutes: 60,
				};
			} catch (e) {
				console.error("Error parsing workout plan:", e);
				return null;
			}
		}

		return null;
	};

	const handleSave = async (plan, msgIndex) => {
		try {
			const res = await savePlan(plan);
			const planId = res.data.id;
			setMsgs((prev) =>
				prev.map((m, i) =>
					i === msgIndex ? { ...m, saved: true, saveId: planId } : m,
				),
			);

			// Show confirmation and offer to navigate to the plan
			alert("Plan saved successfully! You can view it in My Plans.");
		} catch (e) {
			console.error("Save plan error:", e.response?.status, e.response?.data);
			alert("Could not save plan. Please try again later.");
		}
	};

	const openPlanModal = (plan, index) => {
		setCurrentPlan(plan);
		setCurrentMsgIndex(index);
		setShowPlanModal(true);
	};

	const handleConvertToPlan = (msgIndex) => {
		const message = msgs[msgIndex];
		if (!message || !message.text) return;

		// Try to extract a plan from the message
		const plan = detectWorkoutPlan(message.text);

		if (plan) {
			// Update the message to include the detected plan
			setMsgs((prev) =>
				prev.map((m, i) => (i === msgIndex ? { ...m, plan } : m)),
			);
		} else {
			alert("Couldn't detect a workout plan structure in this message.");
		}
	};

	const goToPlans = () => {
		navigate("/plans");
	};

	return (
		<div className="container my-4">
			<div className="card mx-auto" style={{ maxWidth: 800 }}>
				<div className="card-header d-flex justify-content-between align-items-center">
					<span className="fw-bold">AI Fitness Assistant</span>
					<div>
						<button
							className="btn btn-outline-primary btn-sm"
							onClick={goToPlans}
						>
							My Plans
						</button>
					</div>
				</div>

				<div
					className="card-body chat-container"
					style={{ height: 500, overflowY: "auto" }}
				>
					{msgs.length === 0 ? (
						<div className="text-center text-muted my-5">
							<p>Start a conversation with the fitness AI assistant!</p>
						</div>
					) : (
						msgs.map((m, i) => (
							<div
								key={i}
								className={`mb-3 d-flex ${
									m.from === "You" ? "justify-content-end" : ""
								}`}
							>
								<div
									className={`p-3 rounded ${
										m.from === "You"
											? "bg-primary text-white"
											: m.isError
												? "bg-danger text-white"
												: "bg-secondary text-white"
									}`}
									style={{ maxWidth: "80%" }}
								>
									<strong>{m.from}:</strong>
									<div style={{ whiteSpace: "pre-wrap" }}>{m.text}</div>

									{m.plan && (
										<div className="mt-2 plan-preview">
											<div className="plan-header d-flex justify-content-between align-items-center">
												<h6 className="mb-1">Workout Plan Detected</h6>
												<button
													className="btn btn-sm btn-info"
													onClick={() => openPlanModal(m.plan, i)}
												>
													View
												</button>
											</div>
											<div className="plan-title">{m.plan.title}</div>
											{m.saved ? (
												<div className="text-success mt-1">
													<small>✓ Saved to My Plans</small>
												</div>
											) : (
												<button
													className="btn btn-sm btn-outline-light mt-2"
													onClick={() => handleSave(m.plan, i)}
												>
													Save to My Plans
												</button>
											)}
										</div>
									)}

									{m.from === "Bot" && !m.plan && !m.isError && (
										<div className="mt-2">
											<button
												className="btn btn-sm btn-outline-light"
												onClick={() => handleConvertToPlan(i)}
											>
												Convert to Plan
											</button>
										</div>
									)}
								</div>
							</div>
						))
					)}
					{loading && (
						<div className="d-flex justify-content-start mb-3">
							<div className="p-3 rounded bg-secondary text-white">
								<div
									className="spinner-border spinner-border-sm text-light"
									role="status"
								>
									<span className="visually-hidden">Loading...</span>
								</div>
								<span className="ms-2">Thinking...</span>
							</div>
						</div>
					)}
					<div ref={bottomRef} />
				</div>

				<div className="card-footer">
					<div className="d-flex mb-2">
						<input
							className="form-control me-2"
							placeholder="Type your message..."
							value={input}
							onChange={(e) => setInput(e.target.value)}
							onKeyDown={(e) => e.key === "Enter" && handleSend()}
							disabled={loading}
						/>
						<button
							className="btn btn-success"
							onClick={handleSend}
							disabled={loading}
						>
							{loading ? (
								<>
									<span
										className="spinner-border spinner-border-sm"
										role="status"
										aria-hidden="true"
									></span>
									<span className="visually-hidden">Loading...</span>
								</>
							) : (
								"Send"
							)}
						</button>
					</div>
					<div className="d-flex justify-content-end">
						<button
							className="btn btn-outline-primary btn-sm"
							onClick={handlePreviewPlan}
							disabled={loading || !input.trim()}
						>
							Preview Plan
						</button>
					</div>
				</div>
			</div>

			{/* Plan Modal */}
			{showPlanModal && currentPlan && (
				<div
					className="modal fade show"
					style={{ display: "block" }}
					tabIndex="-1"
				>
					<div className="modal-dialog modal-lg">
						<div className="modal-content">
							<div className="modal-header">
								<h5 className="modal-title">{currentPlan.title}</h5>
								<button
									type="button"
									className="btn-close"
									onClick={() => setShowPlanModal(false)}
								></button>
							</div>
							<div className="modal-body">
								<div className="plan-details">
									{currentPlan.details.map((detail, idx) => (
										<div key={idx} className="plan-detail-item">
											{detail}
										</div>
									))}
								</div>
							</div>
							<div className="modal-footer">
								{!msgs[currentMsgIndex]?.saved && (
									<button
										className="btn btn-primary"
										onClick={() => {
											handleSave(currentPlan, currentMsgIndex);
											setShowPlanModal(false);
										}}
									>
										Save to My Plans
									</button>
								)}
								<button
									className="btn btn-secondary"
									onClick={() => setShowPlanModal(false)}
								>
									Close
								</button>
							</div>
						</div>
					</div>
					<div className="modal-backdrop fade show"></div>
				</div>
			)}
		</div>
	);
}
