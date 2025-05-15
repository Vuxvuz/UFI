// server/src/main/java/com/ufit/server/dto/response/WorkoutPlanDetailResponse.java
package com.ufit.server.dto.response;

import java.time.LocalDateTime;
import java.util.List;

public record WorkoutPlanDetailResponse(
    Long id,
    String title,
    List<String> details,
    LocalDateTime createdAt
) {}
