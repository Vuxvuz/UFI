package com.ufit.server.dto.response;

public record ProfileResponse(
    Long id,
    String username,
    String email,
    String firstName,
    String lastName,
    String phone,
    String avatarUrl,
    Double height,
    Double weight,
    String aim,
    Double bmi,
    boolean Active,
    boolean profileCompleted
) {}
