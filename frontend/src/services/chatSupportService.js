// src/services/chatSupportService.js

import { API } from "./api";

// API paths for chat support
const USER_CHAT_URL = "/api/chat";
const MOD_CHAT_URL = "/api/mod/chat-support"; // URL cho moderator
const ADMIN_CHAT_URL = "/api/admin/chat-support";

// User functions
const getUserChats = () => {
	return API.get(`${USER_CHAT_URL}/user`);
};

const closeChat = (chatId) => {
	return API.post(`${USER_CHAT_URL}/close/${chatId}`);
};

// Moderator functions
const getModeratorChats = () => {
	return API.get(`${MOD_CHAT_URL}/active`); // Sửa URL để phù hợp với backend
};

const getPendingChats = () => {
	return API.get(`${MOD_CHAT_URL}/pending`); // Sửa URL để phù hợp với backend
};

const acceptChat = (chatId) => {
	return API.post(`${MOD_CHAT_URL}/accept/${chatId}`); // Sửa URL để phù hợp với backend
};

// Admin functions
const getAllChatSessions = () => {
	return API.get(`${ADMIN_CHAT_URL}`);
};

const initiateChat = (userId, message) => {
	return API.post(`${ADMIN_CHAT_URL}/initiate`, null, {
		params: { userId, message },
	});
};

const ChatSupportService = {
	// User methods
	getUserChats,
	closeChat,

	// Moderator methods
	getModeratorChats,
	getPendingChats,
	acceptChat,

	// Admin methods
	getAllChatSessions,
	initiateChat,
};

export default ChatSupportService;
