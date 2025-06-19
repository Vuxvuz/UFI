// src/services/articleService.js
import { API } from "./api";
const articleService = {
	getAll: () => API.get("/api/admin/articles"),
	create: (data) => API.post("/api/admin/articles", data),
	update: (id, data) => API.put(`/api/admin/articles/${id}`, data),
	delete: (id) => API.delete(`/api/admin/articles/${id}`),
};
export default articleService;
