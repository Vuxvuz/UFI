package com.ufit.server.dto.request;

public record CategoryRequest(
    String name,
    String description
) {
    // Compact canonical constructor for validation
    public CategoryRequest {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Category name cannot be empty");
        }
        if (description == null) {
            description = "";
        }
    }
} 