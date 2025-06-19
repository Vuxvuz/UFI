// src/services/topicService.js
import { API } from "./api";

// Lấy tất cả Topic (giả định trả về List<TopicDto>) cho mod: GET /api/mod/topics
function getAllTopicsForModerator() {
	console.log("Fetching all topics for moderator");
	return API.get("/api/mod/topics");
}

// Create a new topic: POST /api/forum/topics
function createTopic(topicData) {
	console.log("Creating new topic:", topicData);
	return API.post("/api/forum/topics", topicData);
}

// Delete a topic: DELETE /api/forum/topics/{id}
function deleteTopic(topicId) {
	console.log("Deleting topic with ID:", topicId);
	return API.delete(`/api/forum/topics/${topicId}`);
}

const TopicService = {
	getAllTopicsForModerator,
	getAll: getAllTopicsForModerator, // Alias for backward compatibility
	createTopic,
	deleteTopic,
};

export default TopicService;
