// server/src/main/java/com/ufit/server/service/ChatBotService.java
package com.ufit.server.service;

import com.ufit.server.dto.request.ChatBotRequest;
import com.ufit.server.dto.request.WorkoutPlanDto;
import reactor.core.publisher.Mono;

public interface ChatBotService {
    /** 1) trả về phản hồi text */
    Mono<String> ask(ChatBotRequest request);

    /** 2) trả về kế hoạch workout dưới dạng DTO (preview) */
    Mono<WorkoutPlanDto> askForPlan(ChatBotRequest request);
}
