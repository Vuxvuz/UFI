import { API } from "./api";

// Lấy danh sách plans
export function fetchPlans() {
	return API.get("/api/plans");
}

// Lấy chi tiết 1 plan
export function fetchPlan(id) {
	return API.get(`/api/plans/${id}`);
}

// Preview plan (khi user bật preview mode)
export function previewPlan(payload) {
	return API.post("/api/plans/preview", payload);
}

// Save plan
export function savePlan(payload) {
	return API.post("/api/plans", payload);
}
