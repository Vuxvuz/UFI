// server/src/main/java/com/ufit/server/dto/response/ChatBotResponse.java
package com.ufit.server.dto.response;

import com.ufit.server.dto.request.WorkoutPlanDto;

public record ChatBotResponse(
    String message,
    WorkoutPlanDto plan
) {}
