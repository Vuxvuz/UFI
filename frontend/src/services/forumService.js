// frontend/src/services/forumService.js
import { API } from "./api";  // <-- dùng chung instance đã cài interceptor

/**
 * Lấy danh sách topics, có thể filter theo category (string) hoặc không filter (null/undefined)
 * @param {string|null} category 
 * @returns Promise<AxiosResponse<TopicResponse[]>>
 */
export function listTopics(category) {
  return API.get("/api/forum/topics", {
    params: category ? { category } : {}
  });
}

/**
 * Tạo topic mới
 * @param {{ title: string, category: string }} body 
 * @returns Promise<AxiosResponse<TopicResponse>>
 */
export function createTopic(body) {
  return API.post("/api/forum/topics", body);
}

/**
 * Lấy danh sách posts của 1 topic
 * @param {number|string} topicId 
 * @returns Promise<AxiosResponse<PostResponse[]>>
 */
export function listPosts(topicId) {
  return API.get(`/api/forum/topics/${topicId}/posts`);
}

/**
 * Tạo post (có thể kèm ảnh)
 * @param {number|string} topicId 
 * @param {string} content 
 * @param {File|null} imageFile 
 * @returns Promise<AxiosResponse<PostResponse>>
 */
export function createPost(topicId, content, imageFile) {
  const form = new FormData();
  form.append("content", content);
  if (imageFile) {
    form.append("image", imageFile);
  }
  return API.post(`/api/forum/topics/${topicId}/posts`, form, {
    headers: { "Content-Type": "multipart/form-data" }
  });
}
