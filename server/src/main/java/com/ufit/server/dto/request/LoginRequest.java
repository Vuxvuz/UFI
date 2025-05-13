package com.ufit.server.dto.request;

import jakarta.validation.constraints.NotEmpty;

public record LoginRequest(
    @NotEmpty String email,
    @NotEmpty String password
) {}