import React from "react";
import ReactDOM from "react-dom/client"; // nếu React 18+
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App";
import "./index.css"; // nếu bạn có
import "./components/NavBar.css"; // CSS cho navbar
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

// Đảm bảo Bootstrap được khởi tạo đúng cách
document.addEventListener("DOMContentLoaded", function () {
	// Khởi tạo tất cả các dropdown trên toàn bộ trang
	const initBootstrap = () => {
		if (typeof window !== "undefined" && window.bootstrap) {
			// Khởi tạo tất cả các dropdown
			const dropdownTriggerList = [].slice.call(
				document.querySelectorAll('[data-bs-toggle="dropdown"]'),
			);
			dropdownTriggerList.map(function (dropdownTriggerEl) {
				return new window.bootstrap.Dropdown(dropdownTriggerEl);
			});
		}
	};

	// Khởi tạo ngay lập tức
	initBootstrap();

	// Khởi tạo lại sau 500ms để đảm bảo DOM đã được render đầy đủ
	setTimeout(initBootstrap, 500);
});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
	<GoogleOAuthProvider clientId="436915109343-75aqli2lfjeh55fqsn5n6khlrqvqnl6m.apps.googleusercontent.com">
		<App />
	</GoogleOAuthProvider>,
);
