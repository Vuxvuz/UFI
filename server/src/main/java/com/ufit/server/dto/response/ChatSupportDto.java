// File: src/main/java/com/ufit/server/dto/response/ChatSupportDto.java
package com.ufit.server.dto.response;

/**
 * DTO tạm thời cho Chat Support. 
 * Chỉ bao gồm id và message; bạn có thể bổ sung thêm fields (ví dụ timestamp, userAgent, v.v.).
 */
public record ChatSupportDto(
    Long id,
    String message
) {}
