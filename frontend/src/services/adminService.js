// src/services/adminService.js
import { API } from "./api";

function getDashboard() {
	return API.get("/api/admin/dashboard");
}

function getAllUsers() {
	console.log("AdminService: Getting all users");
	return API.get("/api/admin/users");
}

function getAllArticles() {
	console.log("AdminService: Getting all articles");
	return API.get("/api/admin/articles");
}

function createArticle(articleData) {
	console.log("AdminService: Creating article", articleData);
	return API.post("/api/admin/articles", articleData);
}

function updateArticle(articleId, articleData) {
	console.log(`AdminService: Updating article ${articleId}`, articleData);
	return API.put(`/api/admin/articles/${articleId}`, articleData);
}

function getSystemInfo() {
	console.log("AdminService: Getting system info");
	return API.get("/api/admin/system-info");
}

function getPendingReports() {
	return API.get("/api/admin/reports");
}

function reviewReportAsAdmin(reportId, action) {
	return API.put(`/api/admin/reports/${reportId}/review`, null, {
		params: { action },
	});
}

function assignRole(username, role) {
	return API.post("/api/admin/assign-role", null, {
		params: { username, role },
	});
}

function deleteUser(userId) {
	console.log(`AdminService: Deleting user ${userId}`);
	return API.delete(`/api/admin/user/${userId}`);
}

function updateUser(userId, userData) {
	console.log(`AdminService: Updating user ${userId}`, userData);
	// Không có API endpoint để cập nhật user, nên sử dụng assignRole thay thế
	if (userData && userData.role) {
		return assignRole(userData.username, userData.role);
	}
	return Promise.reject(new Error("API endpoint không tồn tại"));
}

function updateUserStatus(userId, statusData) {
	console.log(`AdminService: Updating user status ${userId}`, statusData);
	return API.post(`/api/admin/users/${userId}/status`, statusData);
}

function deleteArticle(articleId) {
	console.log(`AdminService: Deleting article ${articleId}`);
	return API.delete(`/api/admin/article/${articleId}`);
}

function getAllChatSessions() {
	return API.get("/api/admin/chat-support");
}

function initiateChatWithUser(userId, message) {
	return API.post("/api/admin/chat-support/initiate", null, {
		params: { userId, message },
	});
}

const AdminService = {
	getDashboard,
	getAllUsers,
	getAllArticles,
	createArticle,
	updateArticle,
	getSystemInfo,
	getPendingReports,
	reviewReportAsAdmin,
	assignRole,
	deleteUser,
	updateUser,
	updateUserStatus,
	deleteArticle,
	getAllChatSessions,
	initiateChatWithUser,
};

export default AdminService;
