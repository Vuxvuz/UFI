package com.ufit.server.dto.request;
import jakarta.validation.constraints.NotEmpty;

public record ResetPasswordRequest(
    @NotEmpty(message = "Token không được để trống")
    String token,

    @NotEmpty(message = "Mật khẩu mới không được để trống")
    String newPassword
) {}