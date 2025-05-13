package com.ufit.server.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotEmpty;

public record ForgotPasswordRequest(
    @Email(message = "Email không hợp lệ")
    @NotEmpty(message = "Email không được để trống")
    String email
) {}