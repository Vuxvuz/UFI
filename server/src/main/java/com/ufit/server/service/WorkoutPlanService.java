// server/src/main/java/com/ufit/server/service/WorkoutPlanService.java
package com.ufit.server.service;

import com.ufit.server.dto.request.WorkoutPlanDto;
import com.ufit.server.entity.WorkoutPlan;
import com.ufit.server.dto.request.ChatBotRequest;

import java.util.List;
import java.util.Optional;

public interface WorkoutPlanService {
    // preview vẫn reactive hoặc bạn có thể block() tuỳ thích
    WorkoutPlanDto previewPlan(String username, ChatBotRequest req);

    // lưu plan
    WorkoutPlan createPlan(String username, WorkoutPlanDto dto);

    // list đồng bộ
    List<WorkoutPlan> findAllByUsername(String username);

    // detail đồng bộ
    Optional<WorkoutPlan> findByIdAndUsername(Long id, String username);
}
