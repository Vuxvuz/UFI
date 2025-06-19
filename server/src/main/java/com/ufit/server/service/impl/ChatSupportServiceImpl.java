package com.ufit.server.service.impl;

import com.ufit.server.dto.response.ChatSupportDto;
import com.ufit.server.entity.ChatSupport;
import com.ufit.server.entity.ModeratorStatus;
import com.ufit.server.entity.User;
import com.ufit.server.repository.ChatSupportRepository;
import com.ufit.server.repository.ModeratorStatusRepository;
import com.ufit.server.repository.UserRepository;
import com.ufit.server.service.ChatSupportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Random;
import java.util.stream.Collectors;

/**
 * Triển khai ChatSupportService
 */
@Service
@Transactional
public class ChatSupportServiceImpl implements ChatSupportService {

    @Autowired
    private ChatSupportRepository chatSupportRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private ModeratorStatusRepository moderatorStatusRepository;

    @Override
    public List<ChatSupportDto> getAllConversations() {
        List<ChatSupport> chats = chatSupportRepository.findAll();
        return mapToDtoList(chats);
    }
    
    @Override
    public ChatSupport createChatSession(Long userId) {
        // Kiểm tra xem user có tồn tại không
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
            
        // Kiểm tra nếu user là moderator hoặc admin
        if (user.getRole().name().contains("MODERATOR") || user.getRole().name().contains("ADMIN")) {
            throw new IllegalArgumentException("Moderators and admins cannot create chat support sessions");
        }
            
        // Kiểm tra nếu user đã có chat session active
        List<ChatSupport> activeChats = chatSupportRepository.findByUserIdAndStatus(userId, ChatSupport.ChatStatus.ACTIVE);
        if (!activeChats.isEmpty()) {
            return activeChats.get(0); // Trả về chat session hiện có
        }
        
        // Tìm moderator online bất kỳ
        ChatSupport.ChatStatus status = ChatSupport.ChatStatus.PENDING;
        Long moderatorId = null;
        
        List<ModeratorStatus> onlineMods = moderatorStatusRepository.findByIsOnlineTrue();
        if (!onlineMods.isEmpty()) {
            // Chọn ngẫu nhiên một moderator
            ModeratorStatus mod = onlineMods.get(new Random().nextInt(onlineMods.size()));
            moderatorId = mod.getUserId();
            status = ChatSupport.ChatStatus.ACTIVE;
        }
        
        // Tạo chat session mới
        ChatSupport chat = new ChatSupport();
        chat.setUserId(userId);
        chat.setModeratorId(moderatorId);
        chat.setStatus(status);
        chat.setTimestamp(LocalDateTime.now());
        chat.setIsAdminInitiated(false);
        
        // Thêm message mặc định khi tạo chat mới
        String defaultMessage = "Người dùng " + user.getUsername() + " đã bắt đầu một cuộc trò chuyện hỗ trợ.";
        chat.setMessage(defaultMessage);
        
        return chatSupportRepository.save(chat);
    }
    
    @Override
    public List<ChatSupportDto> getUserChatSessions(Long userId) {
        // Kiểm tra xem user có tồn tại không
        userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
            
        List<ChatSupport> userChats = chatSupportRepository.findByUserIdAndStatus(
            userId, ChatSupport.ChatStatus.ACTIVE);
        userChats.addAll(chatSupportRepository.findByUserIdAndStatus(
            userId, ChatSupport.ChatStatus.PENDING));
            
        return mapToDtoList(userChats);
    }
    
    @Override
    public List<ChatSupportDto> getPendingChatSessions() {
        List<ChatSupport> pendingChats = chatSupportRepository.findByStatus(
            ChatSupport.ChatStatus.PENDING);
        return mapToDtoList(pendingChats);
    }
    
    @Override
    public List<ChatSupportDto> getModeratorChatSessions(Long moderatorId) {
        // Kiểm tra xem moderator có tồn tại không
        userRepository.findById(moderatorId)
            .orElseThrow(() -> new IllegalArgumentException("Moderator not found"));
            
        List<ChatSupport> modChats = chatSupportRepository.findByModeratorIdAndStatus(
            moderatorId, ChatSupport.ChatStatus.ACTIVE);
            
        return mapToDtoList(modChats);
    }
    
    @Override
    public ChatSupport assignModerator(Long chatId, Long moderatorId) {
        // Kiểm tra xem moderator có tồn tại không
        userRepository.findById(moderatorId)
            .orElseThrow(() -> new IllegalArgumentException("Moderator not found"));
            
        // Kiểm tra xem chat session có tồn tại không
        ChatSupport chat = chatSupportRepository.findById(chatId)
            .orElseThrow(() -> new IllegalArgumentException("Chat session not found"));
            
        // Chỉ chỉ định moderator cho chat đang PENDING
        if (chat.getStatus() != ChatSupport.ChatStatus.PENDING) {
            throw new IllegalStateException("Chat session is not in PENDING state");
        }
        
        chat.setModeratorId(moderatorId);
        chat.setStatus(ChatSupport.ChatStatus.ACTIVE);
        chat.setTimestamp(LocalDateTime.now());
        
        return chatSupportRepository.save(chat);
    }
    
    @Override
    public ChatSupport addMessage(Long chatId, String message, boolean isFromModerator) {
        // Kiểm tra xem chat session có tồn tại không
        ChatSupport chat = chatSupportRepository.findById(chatId)
            .orElseThrow(() -> new IllegalArgumentException("Chat session not found"));
            
        // Chỉ thêm message cho chat đang ACTIVE
        if (chat.getStatus() != ChatSupport.ChatStatus.ACTIVE) {
            throw new IllegalStateException("Chat session is not in ACTIVE state");
        }
        
        chat.setMessage(message);
        chat.setTimestamp(LocalDateTime.now());
        
        return chatSupportRepository.save(chat);
    }
    
    @Override
    public void closeChat(Long chatId) {
        // Kiểm tra xem chat session có tồn tại không
        ChatSupport chat = chatSupportRepository.findById(chatId)
            .orElseThrow(() -> new IllegalArgumentException("Chat session not found"));
            
        chat.setStatus(ChatSupport.ChatStatus.CLOSED);
        chat.setTimestamp(LocalDateTime.now());
        
        chatSupportRepository.save(chat);
    }
    
    @Override
    public ChatSupport initiateAdminChat(Long userId, Long adminId, String initialMessage) {
        // Kiểm tra xem user và admin có tồn tại không
        userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        userRepository.findById(adminId)
            .orElseThrow(() -> new IllegalArgumentException("Admin not found"));
            
        // Tạo chat session mới
        ChatSupport chat = new ChatSupport();
        chat.setUserId(userId);
        chat.setModeratorId(adminId); // Admin sẽ đóng vai trò như moderator
        chat.setStatus(ChatSupport.ChatStatus.ACTIVE);
        chat.setTimestamp(LocalDateTime.now());
        chat.setIsAdminInitiated(true);
        chat.setMessage(initialMessage);
        
        return chatSupportRepository.save(chat);
    }
    
    // Helper method to map ChatSupport entities to DTOs
    private List<ChatSupportDto> mapToDtoList(List<ChatSupport> chats) {
        return chats.stream()
            .map(this::mapToDto)
            .collect(Collectors.toList());
    }
    
    @Override
    public ChatSupportDto mapToDto(ChatSupport chat) {
        String username = null;
        String moderatorName = null;
        
        // Get user's name
        if (chat.getUserId() != null) {
            Optional<User> user = userRepository.findById(chat.getUserId());
            if (user.isPresent()) {
                username = user.get().getUsername();
            }
        }
        
        // Get moderator's name
        if (chat.getModeratorId() != null) {
            Optional<User> moderator = userRepository.findById(chat.getModeratorId());
            if (moderator.isPresent()) {
                moderatorName = moderator.get().getUsername();
            }
        }
        
        return new ChatSupportDto(
            chat.getId(),
            chat.getMessage(),
            chat.getUserId(),
            username,
            chat.getModeratorId(),
            moderatorName,
            chat.getTimestamp(),
            chat.getStatus(),
            chat.getIsAdminInitiated()
        );
    }
}
