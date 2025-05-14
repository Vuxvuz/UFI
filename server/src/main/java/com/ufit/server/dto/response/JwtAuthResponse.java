// src/main/java/com/ufit/server/dto/response/JwtAuthResponse.java
package com.ufit.server.dto.response;

public record JwtAuthResponse(
    Long id,
    String username,
    String email,
    String token,
    String role, // Thêm role
    long expiresAt, // Thêm thời gian hết hạn (epoch time in seconds)
    String message
) {}
