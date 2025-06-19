import { useState, useEffect } from "react";

function useDarkMode() {
	// Khởi tạo state từ localStorage hoặc false nếu không có
	const [darkMode, setDarkMode] = useState(() => {
		const savedMode = localStorage.getItem("darkMode");
		return savedMode === "true";
	});

	// Cập nhật localStorage và class trên body khi darkMode thay đổi
	useEffect(() => {
		localStorage.setItem("darkMode", darkMode);

		if (darkMode) {
			document.body.classList.add("dark-mode");
		} else {
			document.body.classList.remove("dark-mode");
		}
	}, [darkMode]);

	return [darkMode, setDarkMode];
}

export default useDarkMode;
