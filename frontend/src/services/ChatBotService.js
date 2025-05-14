import { API } from "./api";

/**
 * Gửi message lên backend chatbot.
 * @param {string} message 
 * @param {boolean} previewPlan 
 */
export function sendMessage(message, previewPlan = false) {
  return API.post("/api/chatbot/message", {
    message,
    height: null, // backend tự lấy từ profile
    weight: null,
    aim: null,
    previewPlan,
  });
}

/**
 * Lưu kế hoạch Workout Plan
 * @param {{ title:string, details:string[] }} planDto 
 */
export function savePlan(planDto) {
  return API.post("/api/plans", planDto);
}
