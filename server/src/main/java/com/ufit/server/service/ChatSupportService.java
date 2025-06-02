// File: src/main/java/com/ufit/server/service/ChatSupportService.java
package com.ufit.server.service;

import com.ufit.server.dto.response.ChatSupportDto;

import java.util.List;

public interface ChatSupportService {
    /**
     * Lấy toàn bộ cuộc hội thoại Chat Support dành cho Moderator.
     * (Tạm thời trả về List<ChatSupportDto>)
     */
    List<ChatSupportDto> getAllConversations();
}
