import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8080/api/chatbot",
});

API.interceptors.request.use(cfg => {
  const token = localStorage.getItem("token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

/**
 * Gửi payload gồm:
 *  - message: chuỗi người dùng gõ
 *  - previewPlan: boolean (true nếu muốn AI trả về plan dưới dạng JSON)
 */
export function sendMessage(message, previewPlan = false) {
  return API.post("/message", {
    message,
    height: null,    // back-end sẽ lấy lại từ profileService
    weight: null,
    aim: null,
    previewPlan
  });
}
// Lưu workout plan
export function savePlan(planDto) {
  // planDto: { title, details: [...] }
  return API.post("/plans", planDto);
}