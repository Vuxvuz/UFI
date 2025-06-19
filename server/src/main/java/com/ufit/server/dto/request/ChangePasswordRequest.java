package com.ufit.server.dto.request;

import jakarta.validation.constraints.NotEmpty;

public record ChangePasswordRequest(
    @NotEmpty(message = "Current password is required")
    String currentPassword,

    @NotEmpty(message = "New password is required")
    String newPassword
) {} 