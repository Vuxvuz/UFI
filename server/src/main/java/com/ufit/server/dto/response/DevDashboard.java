// src/main/java/com/ufit/server/dto/response/DevDashboard.java
package com.ufit.server.dto.response;

public record DevDashboard(
    String buildStatus,
    String lastDeployTime
) {}
