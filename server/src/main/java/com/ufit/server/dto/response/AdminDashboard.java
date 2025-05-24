// src/main/java/com/ufit/server/dto/response/AdminDashboard.java
package com.ufit.server.dto.response;

public record AdminDashboard(
    long totalUsers,
    long moderators,
    long totalAdmins
) {}
