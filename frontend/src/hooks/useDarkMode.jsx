// frontend/src/hooks/useDarkMode.jsx
import { useState, useEffect } from "react";

export default function useDarkMode() {
	const [darkMode, setDarkMode] = useState(() => {
		const savedMode = localStorage.getItem("darkMode");
		return savedMode ? JSON.parse(savedMode) : false;
	});

	useEffect(() => {
		if (darkMode) {
			document.body.classList.add("dark-mode");
		} else {
			document.body.classList.remove("dark-mode");
		}
		localStorage.setItem("darkMode", JSON.stringify(darkMode));
	}, [darkMode]);

	return [darkMode, setDarkMode];
}
