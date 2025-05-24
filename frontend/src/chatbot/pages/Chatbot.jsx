import React, { useState, useRef, useEffect } from "react";
import { sendMessage, savePlan } from "../../services/ChatBotService";

export default function Chatbot() {
  const [msgs, setMsgs] = useState([]); // { from, text, plan?, saved? }
  const [input, setInput] = useState("");
  const [previewMode, setPreviewMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  useEffect(() => {
    // Add this to debug
    console.log("Token:", localStorage.getItem("token"));
  }, []);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    
    // Add user message to chat
    setMsgs((prev) => [...prev, { from: "You", text: input }]);
    setInput("");
    setLoading(true);

    try {
      // Send message to API
      const response = await sendMessage(input, previewMode);
      console.log("AI Response:", response.data); // Debug response structure
      
      // Extract content from response
      if (response.data && response.data.data) {
        // If we're in preview mode, treat the data as a plan
        if (previewMode) {
          setMsgs((prev) => [
            ...prev,
            { 
              from: "Bot", 
              text: response.data.data, 
              plan: response.data.data,
              saved: false 
            },
          ]);
        } else {
          // Regular message mode
          setMsgs((prev) => [
            ...prev,
            { 
              from: "Bot", 
              text: response.data.data, 
              plan: null,
              saved: false 
            },
          ]);
        }
      } else {
        // Handle unexpected response format
        console.error("Unexpected response format:", response.data);
        setMsgs((prev) => [
          ...prev,
          { 
            from: "Bot", 
            text: "Sorry, I received an unexpected response format. Please try again.", 
            plan: null,
            saved: false 
          },
        ]);
      }
    } catch (e) {
      console.error("Chatbot error:", e);
      const errorMsg = e.response?.data?.message || "Connection error. Please try again.";
      setMsgs((prev) => [...prev, { from: "Bot", text: errorMsg }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (plan, msgIndex) => {
    try {
      const res = await savePlan(plan);
      const planId = res.data.id;
      setMsgs((prev) =>
        prev.map((m, i) =>
          i === msgIndex ? { ...m, saved: true, saveId: planId } : m
        )
      );
    } catch (e) {
      console.error("Save plan error:", e.response?.status, e.response?.data);
      alert("Could not save plan. Please try again later.");
    }
  };

  return (
    <div className="card mx-auto my-4" style={{ maxWidth: 800 }}>
      <div className="card-header d-flex justify-content-between align-items-center">
        <span>AI Chatbot Support</span>
        <div className="form-check form-switch">
          <input
            className="form-check-input"
            type="checkbox"
            id="previewSwitch"
            checked={previewMode}
            onChange={() => setPreviewMode((prev) => !prev)}
          />
          <label className="form-check-label" htmlFor="previewSwitch">
            Preview Plan
          </label>
        </div>
      </div>

      <div className="card-body" style={{ height: 500, overflowY: "auto" }}>
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
                    : "bg-secondary text-white"
                }`}
                style={{ maxWidth: "80%" }}
              >
                <strong>{m.from}:</strong>
                <div style={{ whiteSpace: "pre-wrap" }}>{m.text}</div>

                {m.plan && (
                  <div className="mt-2">
                    <pre className="p-2 bg-light text-dark" style={{ overflow: "auto", maxHeight: "200px" }}>
                      {JSON.stringify(m.plan, null, 2)}
                    </pre>
                    {m.saved ? (
                      <small className="text-success">
                        Saved (ID: {m.saveId})
                      </small>
                    ) : (
                      <button
                        className="btn btn-sm btn-outline-light mt-2"
                        onClick={() => handleSave(m.plan, i)}
                      >
                        Save Plan
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="d-flex justify-content-start mb-3">
            <div className="p-3 rounded bg-secondary text-white">
              <div className="spinner-border spinner-border-sm text-light" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <span className="ms-2">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="card-footer d-flex">
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
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              <span className="visually-hidden">Loading...</span>
            </>
          ) : previewMode ? "Preview" : "Send"}
        </button>
      </div>
    </div>
  );
}
