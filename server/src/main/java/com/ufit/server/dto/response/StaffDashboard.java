// src/main/java/com/ufit/server/dto/response/StaffDashboard.java
package com.ufit.server.dto.response;

public record StaffDashboard(
    long pendingReports,
    long totalPosts,
    long totalUsers
) {}
