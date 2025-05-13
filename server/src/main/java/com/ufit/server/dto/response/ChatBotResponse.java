// server/src/main/java/com/ufit/server/dto/response/ChatbotPlanResponse.java
package com.ufit.server.dto.response;

import com.ufit.server.dto.request.WorkoutPlanDto;

public record ChatBotResponse(
    String message,
    WorkoutPlanDto plan
) {}
