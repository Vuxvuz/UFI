// server/src/main/java/com/ufit/server/dto/response/WorkoutPlanResponse.java
package com.ufit.server.dto.response;

import java.time.LocalDateTime;

public record WorkoutPlanResponse(
    Long id,
    String title,
    LocalDateTime createdAt
) {}
