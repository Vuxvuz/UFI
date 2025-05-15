// src/services/ChatBotService.js
import { API } from "./api";

/** gửi ChatBotRequest + preview flag */
export function sendMessage(message, previewPlan = false) {
  return API.post("/api/chatbot/message", {
    message,
    height: null,   // server tự thêm từ profile
    weight: null,
    aim: null,
    previewPlan,
  });
}

/** lưu kế hoạch đã preview */
export function savePlan(planDto) {
  return API.post("/api/plans", planDto);
}
