// File: src/main/java/com/ufit/server/dto/response/ChatSupportDto.java
package com.ufit.server.dto.response;

import com.ufit.server.entity.ChatSupport.ChatStatus;
import java.time.LocalDateTime;

/**
 * DTO for Chat Support information transfer.
 */
public record ChatSupportDto(
    Long id,
    String message,
    Long userId,
    String username,
    Long moderatorId,
    String moderatorName,
    LocalDateTime timestamp,
    ChatStatus status,
    Boolean isAdminInitiated
) {}
