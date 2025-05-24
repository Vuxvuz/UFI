package com.ufit.server.service.impl;

import com.ufit.server.dto.response.ChatLogDTO;
import com.ufit.server.entity.ChatLog;
import com.ufit.server.repository.ChatLogRepository;
import com.ufit.server.service.ChatLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ChatLogServiceImpl implements ChatLogService {
    @Autowired private ChatLogRepository chatLogRepository;
    
    @Override
    public void saveLog(String username, String userMessage, String botResponse, boolean containsPlan) {
        ChatLog log = new ChatLog();
        log.setUsername(username);
        log.setUserMessage(userMessage);
        log.setBotResponse(botResponse);
        log.setContainsPlan(containsPlan);
        
        chatLogRepository.save(log);
    }
    
    @Override
    public List<ChatLogDTO> getAllLogs() {
        return chatLogRepository.findAllOrderByTimestampDesc()
            .stream()
            .map(this::mapToDTO)
            .collect(Collectors.toList());
    }
    
    @Override
    public List<ChatLogDTO> getLogsByUsername(String username) {
        return chatLogRepository.findByUsernameOrderByTimestampDesc(username)
            .stream()
            .map(this::mapToDTO)
            .collect(Collectors.toList());
    }
    
    private ChatLogDTO mapToDTO(ChatLog log) {
        return new ChatLogDTO(
            log.getId(),
            log.getUsername(),
            log.getUserMessage(),
            log.getBotResponse(),
            log.getTimestamp(),
            log.isContainsPlan()
        );
    }
} 