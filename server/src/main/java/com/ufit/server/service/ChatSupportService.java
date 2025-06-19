// File: src/main/java/com/ufit/server/service/ChatSupportService.java
package com.ufit.server.service;

import com.ufit.server.dto.response.ChatSupportDto;
import com.ufit.server.entity.ChatSupport;

import java.util.List;

public interface ChatSupportService {
    /**
     * Lấy toàn bộ cuộc hội thoại Chat Support dành cho Moderator.
     * (Tạm thời trả về List<ChatSupportDto>)
     */
    List<ChatSupportDto> getAllConversations();
    
    /**
     * Tạo một chat support session mới cho user
     * @param userId User ID cần support
     * @return ChatSupport object đã được tạo
     */
    ChatSupport createChatSession(Long userId);
    
    /**
     * Lấy toàn bộ chat session của một user
     * @param userId User ID cần tìm
     * @return Danh sách các chat sessions
     */
    List<ChatSupportDto> getUserChatSessions(Long userId);
    
    /**
     * Lấy toàn bộ chat session đang pending (chưa có moderator)
     * @return Danh sách các chat sessions đang chờ
     */
    List<ChatSupportDto> getPendingChatSessions();
    
    /**
     * Lấy toàn bộ chat session của một moderator
     * @param moderatorId Moderator ID
     * @return Danh sách các chat sessions
     */
    List<ChatSupportDto> getModeratorChatSessions(Long moderatorId);
    
    /**
     * Chỉ định một moderator cho chat session
     * @param chatId Chat session ID
     * @param moderatorId Moderator ID
     * @return ChatSupport object đã được cập nhật
     */
    ChatSupport assignModerator(Long chatId, Long moderatorId);
    
    /**
     * Thêm tin nhắn vào chat session
     * @param chatId Chat session ID
     * @param message Nội dung tin nhắn
     * @param isFromModerator True nếu tin nhắn từ moderator, false nếu từ user
     * @return ChatSupport object đã được cập nhật
     */
    ChatSupport addMessage(Long chatId, String message, boolean isFromModerator);
    
    /**
     * Đóng chat session
     * @param chatId Chat session ID
     */
    void closeChat(Long chatId);
    
    /**
     * Admin khởi tạo chat với user cụ thể
     * @param userId User ID cần chat
     * @param adminId Admin ID khởi tạo chat
     * @param initialMessage Tin nhắn khởi đầu
     * @return ChatSupport object đã được tạo
     */
    ChatSupport initiateAdminChat(Long userId, Long adminId, String initialMessage);
    
    /**
     * Chuyển đổi đối tượng ChatSupport thành ChatSupportDto
     * @param chat Đối tượng ChatSupport cần chuyển đổi
     * @return ChatSupportDto tương ứng
     */
    ChatSupportDto mapToDto(ChatSupport chat);
}
