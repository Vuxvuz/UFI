// src/components/ChatIcon.jsx
import React, { useState } from "react";
import ChatPopup from "./ChatPopup";
import { FaComments } from "react-icons/fa";

export default function ChatIcon() {
	const [open, setOpen] = useState(false);
	return (
		<>
			{open && <ChatPopup onClose={() => setOpen(false)} />}
			<button
				className="btn btn-primary position-fixed"
				style={{ bottom: "20px", right: "20px", borderRadius: "50%" }}
				onClick={() => setOpen(true)}
			>
				<FaComments size={24} />
			</button>
		</>
	);
}
