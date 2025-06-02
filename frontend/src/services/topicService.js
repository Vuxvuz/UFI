// src/services/topicService.js
import { API } from "./api";

// Lấy tất cả Topic (giả định trả về List<TopicDto>) cho mod: GET /api/mod/topics
function getAllTopicsForModerator() {
  return API.get("/api/mod/topics");
}

const TopicService = {
  getAllTopicsForModerator,
};

export default TopicService;
