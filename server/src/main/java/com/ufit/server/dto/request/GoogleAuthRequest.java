package com.ufit.server.dto.request;



import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotEmpty;

public record GoogleAuthRequest(
    @Email @NotEmpty String email,
    @NotEmpty String googleId,
    @NotEmpty String token
) {}
