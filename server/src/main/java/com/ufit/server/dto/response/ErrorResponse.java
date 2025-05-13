package com.ufit.server.dto.response;

public record ErrorResponse(
    String message
) {
    public ErrorResponse {
        if (message == null || message.isBlank()) {
            throw new IllegalArgumentException("Message cannot be null or blank");
        }
    }
} 