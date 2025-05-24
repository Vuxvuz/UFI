package com.ufit.server.dto.response;

public record ModeratorDashboard(
    long pendingReports,
    long totalPosts,
    long totalUsers
) {} 