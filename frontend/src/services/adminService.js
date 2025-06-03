// src/services/adminService.js
import { API } from "./api";

function getDashboard() {
  return API.get("/api/admin/dashboard");
}

function getAllUsers() {
  return API.get("/api/admin/users");
}

function getAllArticles() {
  return API.get("/api/admin/articles");
}

function getSystemInfo() {
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
  return API.delete(`/api/admin/user/${userId}`);
}

function deleteArticle(articleId) {
  return API.delete(`/api/admin/article/${articleId}`);
}

const AdminService = {
  getDashboard,
  getAllUsers,
  getAllArticles,
  getSystemInfo,
  getPendingReports,
  reviewReportAsAdmin,
  assignRole,
  deleteUser,
  deleteArticle, // chắc chắn export deleteArticle
};

export default AdminService;
