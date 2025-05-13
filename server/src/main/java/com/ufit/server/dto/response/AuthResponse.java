package com.ufit.server.dto.response;

public record AuthResponse(
    Long id,
    String username,
    String email,
    String message
) {}