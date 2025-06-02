package com.ufit.server.service.impl;

import com.ufit.server.dto.response.ChatSupportDto;
import com.ufit.server.entity.ChatSupport;
import com.ufit.server.repository.ChatSupportRepository;
import com.ufit.server.service.ChatSupportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Triển khai ChatSupportService, lấy toàn bộ record ChatSupport từ DB rồi map sang ChatSupportDto.
 */
@Service
public class ChatSupportServiceImpl implements ChatSupportService {

    @Autowired
    private ChatSupportRepository chatSupportRepository;

    @Override
    public List<ChatSupportDto> getAllConversations() {
        // Lấy toàn bộ entity
        List<ChatSupport> chats = chatSupportRepository.findAll();

        // Map sang DTO (chỉ lấy id + message)
        return chats.stream()
                .map(c -> new ChatSupportDto(c.getId(), c.getMessage()))
                .collect(Collectors.toList());
    }
}
