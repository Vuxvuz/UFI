// server/src/main/java/com/ufit/server/controller/ChatController.java
package com.ufit.server.controller;

import com.ufit.server.dto.ChatMessage;
import com.ufit.server.entity.ChatEntity;
import com.ufit.server.repository.ChatMessageRepository;
import com.ufit.server.service.ChatLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.access.prepost.PreAuthorize;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;

@Controller
public class ChatController {

    @Autowired
    private ChatMessageRepository repo;

    @MessageMapping("/chat.send")
    @SendTo("/topic/chat")
    public ChatMessage send(ChatMessage message, SimpMessageHeaderAccessor headerAccessor) {
        try {
            // Get user details if available
            Principal principal = headerAccessor.getUser();
            String username = (principal != null) ? principal.getName() : message.getSender();
            
            // Save to database with timestamp
            repo.save(new ChatEntity(
                null,
                username,
                message.getContent(),
                LocalDateTime.now()
            ));
            
            return message;
        } catch (Exception e) {
            // Log the error for debugging
            System.err.println("Error processing chat message: " + e.getMessage());
            e.printStackTrace();
            throw e; // Re-throw the exception to handle it in the client
        }
    }
}

@RestController
@RequestMapping("/api/moderator/user-chats")
@PreAuthorize("hasAuthority('ROLE_MODERATOR')")
class ChatModeratorController {

    @Autowired
    private ChatMessageRepository chatRepo;
    
    @GetMapping
    public List<ChatEntity> getAllChats() {
        return chatRepo.findAllByOrderByTimestampDesc();
    }
}
