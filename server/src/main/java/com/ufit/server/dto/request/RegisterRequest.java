package com.ufit.server.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotEmpty;

public record RegisterRequest(
    @NotEmpty String username,
    @NotEmpty @Email String email,
    @NotEmpty String password
) {}