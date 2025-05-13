// frontend/src/services/forumService.js
import axios from "axios";
const API = axios.create({ baseURL: "http://localhost:8080/api/forum" });

export function listTopics(category) {
  return API.get("/topics", {
    params: category ? { category } : {}
  });
}

export function createTopic(body) {
  // body = { title, category }
  return API.post("/topics", body);
}

export function listPosts(topicId) {
  return API.get(`/topics/${topicId}/posts`);
}

export function createPost(topicId, content, imageFile) {
  const form = new FormData();
  form.append("content", content);
  if (imageFile) {
    form.append("image", imageFile);
  }
  return API.post(`/topics/${topicId}/posts`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}
