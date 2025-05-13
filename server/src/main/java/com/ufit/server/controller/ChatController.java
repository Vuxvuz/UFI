// server/src/main/java/com/ufit/server/controller/ChatController.java
package com.ufit.server.controller;

import com.ufit.server.dto.ChatMessage;
import com.ufit.server.entity.ChatEntity;
import com.ufit.server.repository.ChatMessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

import java.time.LocalDateTime;

@Controller
public class ChatController {

    @Autowired
    private ChatMessageRepository repo;

    @MessageMapping("/chat.send")
    @SendTo("/topic/chat")
    public ChatMessage send(ChatMessage message) {
        // Lưu vào DB
        repo.save(new ChatEntity(
            null,
            message.getSender(),
            message.getContent(),
            LocalDateTime.now()
        ));
        return message;
    }
}
