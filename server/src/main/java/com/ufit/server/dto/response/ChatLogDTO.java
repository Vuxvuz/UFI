package com.ufit.server.dto.response;

import java.time.LocalDateTime;

public record ChatLogDTO(
    Long id,
    String username,
    String userMessage,
    String botResponse,
    LocalDateTime timestamp,
    boolean containsPlan
) {} 