import React, { useState, useRef, useEffect } from "react";
import { sendMessage, savePlan } from "../../services/ChatBotService";

export default function Chatbot() {
  const [msgs, setMsgs] = useState([]); // { from, text, plan?, saved? }
  const [input, setInput] = useState("");
  const [previewMode, setPreviewMode] = useState(false);
  const bottomRef = useRef();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  const handleSend = async () => {
    if (!input.trim()) return;
    // Hiển thị ngay tin của user
    setMsgs((prev) => [...prev, { from: "You", text: input }]);
    setInput("");

    try {
      // Gửi kèm previewMode thay vì tự parse /plan
      const res = await sendMessage(input, previewMode);
      const { message, plan } = res.data;
      setMsgs((prev) => [
        ...prev,
        { from: "Bot", text: message, plan, saved: false },
      ]);
    } catch (e) {
      const errorMsg = e.response?.data?.message || "Lỗi kết nối.";
      console.error("Chatbot error:", e.response?.status, errorMsg);
      setMsgs((prev) => [...prev, { from: "Bot", text: errorMsg }]);
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
      alert("Không lưu được kế hoạch, thử lại sau.");
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
            onChange={() => setPreviewMode((v) => !v)}
          />
          <label className="form-check-label" htmlFor="previewSwitch">
            Preview Plan
          </label>
        </div>
      </div>

      <div className="card-body" style={{ height: 500, overflowY: "auto" }}>
        {msgs.map((m, i) => (
          <div
            key={i}
            className={`mb-3 d-flex ${
              m.from === "You" ? "justify-content-end" : ""
            }`}
          >
            <div
              className={`p-2 rounded ${
                m.from === "You"
                  ? "bg-primary text-white"
                  : "bg-secondary text-white"
              }`}
            >
              <strong>{m.from}:</strong>
              <div style={{ whiteSpace: "pre-wrap" }}>{m.text}</div>

              {m.plan && (
                <div className="mt-2">
                  <pre className="p-2 bg-light text-dark">
                    {JSON.stringify(m.plan, null, 2)}
                  </pre>
                  {m.saved ? (
                    <small className="text-success">
                      Đã lưu (ID: {m.saveId})
                    </small>
                  ) : (
                    !previewMode && (
                      <button
                        className="btn btn-sm btn-outline-success"
                        onClick={() => handleSave(m.plan, i)}
                      >
                        Save Plan
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="card-footer d-flex">
        <input
          className="form-control me-2"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button className="btn btn-success" onClick={handleSend}>
          {previewMode ? "Preview" : "Send"}
        </button>
      </div>
    </div>
  );
}
