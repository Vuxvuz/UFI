// src/components/ChatPopup.jsx
import React, { useState, useEffect, useRef } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";


export default function ChatPopup({ onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef();
  const clientRef = useRef(null);

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS("http://localhost:8080/ws-message"),
      onConnect: () => {
        client.subscribe("/topic/chat", msg => {
          setMessages(prev => [...prev, JSON.parse(msg.body)]);
        });
      },
    });
    client.activate();
    clientRef.current = client;
    return () => client.deactivate();
  }, []);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const sendMsg = () => {
    if (input.trim() && clientRef.current?.connected) {
      clientRef.current.publish({
        destination: "/app/chat.send",
        body: JSON.stringify({ sender: "USER", content: input }),
      });
      setInput("");
    }
  };

  return (
    <div className="card position-fixed" style={{
      bottom: "80px", right: "20px", width: "300px", height: "400px", zIndex: 1000
    }}>
      <div className="card-header d-flex justify-content-between">
        Chat Support
        <button className="btn-close" onClick={onClose}></button>
      </div>
      <div className="card-body overflow-auto">
        {messages.map((m,i) => (
          <div key={i} className={`mb-2 ${m.sender==="USER"?"text-end":""}`}>
            <span className={`badge ${m.sender==="USER"?"bg-primary":"bg-secondary"}`}>
              {m.content}
            </span>
          </div>
        ))}
        <div ref={bottomRef}/>
      </div>
      <div className="card-footer d-flex">
        <input
          className="form-control me-2"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key==="Enter" && sendMsg()}
        />
        <button className="btn btn-primary" onClick={sendMsg}>Send</button>
      </div>
    </div>
  );
}
