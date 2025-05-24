package com.ufit.server.service;

import com.ufit.server.dto.response.ChatLogDTO;
import com.ufit.server.entity.ChatLog;

import java.util.List;

public interface ChatLogService {
    void saveLog(String username, String userMessage, String botResponse, boolean containsPlan);
    List<ChatLogDTO> getAllLogs();
    List<ChatLogDTO> getLogsByUsername(String username);
} 