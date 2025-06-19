import axios from "axios";

const API = axios.create({
	baseURL: "http://localhost:8080/api",
	headers: { "Content-Type": "application/json" },
});

export function getProfile() {
	const token = localStorage.getItem("token");
	return API.get("/profile", {
		headers: { Authorization: `Bearer ${token}` },
	});
}

export function updateProfile(data) {
	const token = localStorage.getItem("token");
	return API.put("/profile", data, {
		headers: { Authorization: `Bearer ${token}` },
	});
}
