package com.ufit.server.dto.request;

public record ProfileUpdateRequest(
    String firstName,
    String lastName,
    String phone,
    String avatarUrl,
    Double height,
    Double weight,
    String aim
) {}
