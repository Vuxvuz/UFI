// src/services/chatSupportService.js

import {API} from './api';

// Base cho Moderator
const BASE_URL = '/api/mod';

export default {
  getAllConversations: () => axios.get(`${BASE_URL}/chat`),
  // Nếu cần gửi message/chat mới, bạn có thể add thêm:
  // sendMessage: data => axios.post(`${BASE_URL}/chat`, data)
};
