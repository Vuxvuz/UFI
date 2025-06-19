package com.ufit.server.controller;

import com.ufit.server.dto.ChatMessage;
import com.ufit.server.dto.response.ApiResponse;
import com.ufit.server.dto.response.ChatSupportDto;
import com.ufit.server.entity.ChatSupport;
import com.ufit.server.entity.ModeratorStatus;
import com.ufit.server.entity.User;
import com.ufit.server.repository.ChatSupportRepository;
import com.ufit.server.repository.ModeratorStatusRepository;
import com.ufit.server.repository.UserRepository;
import com.ufit.server.service.ChatSupportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;

@Controller
public class ChatSupportController {

    @Autowired
    private ChatSupportRepository chatSupportRepo;

    @Autowired
    private ModeratorStatusRepository modStatusRepo;

    @Autowired
    private UserRepository userRepo;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    
    @Autowired
    private ChatSupportService chatSupportService;

    /**
     * WebSocket endpoint for starting a chat support session
     */
    @MessageMapping("/support.start")
    public void startSupportChat(Principal principal) {
        if (principal == null) {
            throw new IllegalStateException("User not authenticated");
        }
        
        String username = principal.getName();
        User user = userRepo.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
                
        // Check if user is moderator or admin
        if (user.getRole().name().contains("MODERATOR") || user.getRole().name().contains("ADMIN")) {
            messagingTemplate.convertAndSendToUser(username, "/queue/errors", 
                new ApiResponse<>("ERROR", "Moderators and admins cannot create chat support sessions", null));
            return;
        }

        // Create new chat session
        try {
            ChatSupport chat = chatSupportService.createChatSession(user.getId());

            // Notify user
            messagingTemplate.convertAndSendToUser(username, "/queue/support", chat);

            // Notify moderator if assigned
            if (chat.getModeratorId() != null) {
                String modUsername = userRepo.findById(chat.getModeratorId())
                    .map(User::getUsername)
                    .orElse(null);
                    
                if (modUsername != null) {
                    messagingTemplate.convertAndSendToUser(modUsername, "/queue/support", chat);
                }
            }
        } catch (IllegalArgumentException e) {
            messagingTemplate.convertAndSendToUser(username, "/queue/errors", 
                new ApiResponse<>("ERROR", e.getMessage(), null));
        }
    }

    /**
     * WebSocket endpoint for sending a message in chat support
     */
    @MessageMapping("/support.send")
    public void sendSupportMessage(ChatMessage message, Principal principal) {
        if (principal == null) {
            throw new IllegalStateException("User not authenticated");
        }
        
        String username = principal.getName();
        Long userId = userRepo.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"))
                .getId();
                
        User user = userRepo.findById(userId).orElseThrow();
        boolean isUserModerator = user.getRole().name().contains("MODERATOR") || 
                                  user.getRole().name().contains("ADMIN");

        // Find associated chat session
        ChatSupport chat;
        if (isUserModerator) {
            // If sender is moderator, look for chat by moderatorId
            chat = chatSupportRepo.findByModeratorIdAndStatus(userId, ChatSupport.ChatStatus.ACTIVE)
                .stream()
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("No active support session for this moderator"));
        } else {
            // If sender is regular user, look for chat by userId
            chat = chatSupportRepo.findByUserIdAndStatus(userId, ChatSupport.ChatStatus.ACTIVE)
                .stream()
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("No active support session for this user"));
        }

        // Update chat with new message
        chat = chatSupportService.addMessage(chat.getId(), message.getContent(), isUserModerator);

        // Send to user
        String userUsername = userRepo.findById(chat.getUserId())
            .map(User::getUsername)
            .orElse(null);
            
        if (userUsername != null) {
            messagingTemplate.convertAndSendToUser(userUsername, "/queue/support", chat);
        }

        // Send to moderator
        if (chat.getModeratorId() != null) {
            String modUsername = userRepo.findById(chat.getModeratorId())
                .map(User::getUsername)
                .orElse(null);
                
            if (modUsername != null) {
                messagingTemplate.convertAndSendToUser(modUsername, "/queue/support", chat);
            }
        }
    }
    
    /**
     * REST endpoint to close a chat session
     */
    @PostMapping("/api/chat/close/{chatId}")
    public ResponseEntity<ApiResponse<String>> closeChat(
        @PathVariable Long chatId,
        Principal principal
    ) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ApiResponse<>("ERROR", "Unauthorized", null));
        }
        
        try {
            chatSupportService.closeChat(chatId);
            
            // Notify both user and moderator that chat is closed
            ChatSupport chat = chatSupportRepo.findById(chatId).orElseThrow();
            
            // Notify user
            String userUsername = userRepo.findById(chat.getUserId())
                .map(User::getUsername)
                .orElse(null);
                
            if (userUsername != null) {
                messagingTemplate.convertAndSendToUser(userUsername, "/queue/support", chat);
            }
    
            // Notify moderator
            if (chat.getModeratorId() != null) {
                String modUsername = userRepo.findById(chat.getModeratorId())
                    .map(User::getUsername)
                    .orElse(null);
                    
                if (modUsername != null) {
                    messagingTemplate.convertAndSendToUser(modUsername, "/queue/support", chat);
                }
            }
            
            return ResponseEntity.ok(new ApiResponse<>("SUCCESS", "Chat closed successfully", null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiResponse<>("ERROR", e.getMessage(), null));
        }
    }
    
    /**
     * REST endpoint to get active chat sessions for the current user
     */
    @GetMapping("/api/chat/user")
    public ResponseEntity<ApiResponse<List<ChatSupportDto>>> getUserChats(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ApiResponse<>("ERROR", "Unauthorized", null));
        }
        
        try {
            Long userId = userRepo.findByUsername(principal.getName())
                .map(User::getId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
                
            List<ChatSupportDto> chats = chatSupportService.getUserChatSessions(userId);
            return ResponseEntity.ok(new ApiResponse<>("SUCCESS", "User chats retrieved successfully", chats));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiResponse<>("ERROR", e.getMessage(), null));
        }
    }
    
    /**
     * REST endpoint to get active chat sessions for a moderator
     */
    @GetMapping("/api/chat/moderator")
    @PreAuthorize("hasAnyAuthority('ROLE_MODERATOR', 'ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<List<ChatSupportDto>>> getModeratorChats(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ApiResponse<>("ERROR", "Unauthorized", null));
        }
        
        try {
            Long moderatorId = userRepo.findByUsername(principal.getName())
                .map(User::getId)
                .orElseThrow(() -> new IllegalArgumentException("Moderator not found"));
                
            List<ChatSupportDto> chats = chatSupportService.getModeratorChatSessions(moderatorId);
            return ResponseEntity.ok(new ApiResponse<>("SUCCESS", "Moderator chats retrieved successfully", chats));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiResponse<>("ERROR", e.getMessage(), null));
        }
    }
    
    /**
     * REST endpoint to get pending chat sessions (for moderators)
     */
    @GetMapping("/api/chat/pending")
    @PreAuthorize("hasAnyAuthority('ROLE_MODERATOR', 'ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<List<ChatSupportDto>>> getPendingChats() {
        try {
            List<ChatSupportDto> chats = chatSupportService.getPendingChatSessions();
            return ResponseEntity.ok(new ApiResponse<>("SUCCESS", "Pending chats retrieved successfully", chats));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiResponse<>("ERROR", e.getMessage(), null));
        }
    }
    
    /**
     * REST endpoint for a moderator to accept a pending chat
     */
    @PostMapping("/api/chat/accept/{chatId}")
    @PreAuthorize("hasAnyAuthority('ROLE_MODERATOR', 'ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<ChatSupportDto>> acceptChat(
        @PathVariable Long chatId,
        Principal principal
    ) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ApiResponse<>("ERROR", "Unauthorized", null));
        }
        
        try {
            Long moderatorId = userRepo.findByUsername(principal.getName())
                .map(User::getId)
                .orElseThrow(() -> new IllegalArgumentException("Moderator not found"));
                
            ChatSupport chat = chatSupportService.assignModerator(chatId, moderatorId);
            
            // Notify user that moderator accepted the chat
            String userUsername = userRepo.findById(chat.getUserId())
                .map(User::getUsername)
                .orElse(null);
                
            if (userUsername != null) {
                messagingTemplate.convertAndSendToUser(userUsername, "/queue/support", chat);
            }
            
            ChatSupportDto dto = chatSupportService.mapToDto(chat);
            return ResponseEntity.ok(new ApiResponse<>("SUCCESS", "Chat accepted successfully", dto));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiResponse<>("ERROR", e.getMessage(), null));
        }
    }
    
    /**
     * REST endpoint for admin to initiate a chat with a specific user
     */
    @PostMapping("/api/admin/chat/initiate")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<ChatSupportDto>> initiateChat(
        @RequestParam Long userId,
        @RequestParam String message,
        Principal principal
    ) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ApiResponse<>("ERROR", "Unauthorized", null));
        }
        
        try {
            Long adminId = userRepo.findByUsername(principal.getName())
                .map(User::getId)
                .orElseThrow(() -> new IllegalArgumentException("Admin not found"));
                
            ChatSupport chat = chatSupportService.initiateAdminChat(userId, adminId, message);
            
            // Notify user of new chat from admin
            String userUsername = userRepo.findById(chat.getUserId())
                .map(User::getUsername)
                .orElse(null);
                
            if (userUsername != null) {
                messagingTemplate.convertAndSendToUser(userUsername, "/queue/support", chat);
            }
            
            ChatSupportDto dto = chatSupportService.mapToDto(chat);
            return ResponseEntity.ok(new ApiResponse<>("SUCCESS", "Chat initiated successfully", dto));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiResponse<>("ERROR", e.getMessage(), null));
        }
    }
} 