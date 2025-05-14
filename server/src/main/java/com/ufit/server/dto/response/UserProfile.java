// src/main/java/com/ufit/server/dto/response/UserProfile.java
package com.ufit.server.dto.response;

public record UserProfile(
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
    boolean profileCompleted
) {}
