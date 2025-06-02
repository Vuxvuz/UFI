// src/services/moderatorService.js
import { API } from "./api";

function getDashboard() {
  // GET /api/mod/dashboard
  return API.get("/api/mod/dashboard");
}

function getAllCategories() {
  // GET /api/mod/categories
  return API.get("/api/mod/categories");
}

function getAllTopics() {
  // GET /api/mod/topics
  return API.get("/api/mod/topics");
}

function getAllChatSupport() {
  // GET /api/mod/chat
  return API.get("/api/mod/chat");
}

function getPendingReports() {
  // GET /api/mod/reports
  return API.get("/api/mod/reports");
}

function reviewReportAsMod(reportId, action) {
  // PUT /api/mod/reports/{reportId}/review?action=DELETE_POST  (hoặc IGNORE)
  return API.put(`/api/mod/reports/${reportId}/review`, null, {
    params: { action },
  });
}

const ModeratorService = {
  getDashboard,
  getAllCategories,
  getAllTopics,
  getAllChatSupport,
  getPendingReports,
  reviewReportAsMod,
};

export default ModeratorService;
