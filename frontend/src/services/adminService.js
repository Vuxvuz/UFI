// src/services/adminService.js
import { API } from "./api";

function getDashboard() {
  // GET /api/admin/dashboard
  return API.get("/api/admin/dashboard");
}

function getAllUsers() {
  // GET /api/admin/users
  return API.get("/api/admin/users");
}

function getAllArticles() {
  // GET /api/admin/articles
  return API.get("/api/admin/articles");
}

function getSystemInfo() {
  // GET /api/admin/system-info
  return API.get("/api/admin/system-info");
}

function getPendingReports() {
  // GET /api/admin/reports
  return API.get("/api/admin/reports");
}

function reviewReportAsAdmin(reportId, action) {
  // PUT /api/admin/reports/{reportId}/review?action=DELETE_POST  (hoặc IGNORE)
  return API.put(`/api/admin/reports/${reportId}/review`, null, {
    params: { action },
  });
}

function assignRole(username, role) {
  // POST /api/admin/assign-role?username=...&role=...
  return API.post("/api/admin/assign-role", null, {
    params: { username, role },
  });
}

const AdminService = {
  getDashboard,
  getAllUsers,
  getAllArticles,
  getSystemInfo,
  getPendingReports,
  reviewReportAsAdmin,
  assignRole,
};

export default AdminService;
