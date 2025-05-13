// server/src/main/java/com/ufit/server/service/impl/WorkoutPlanServiceImpl.java
package com.ufit.server.service.impl;

import com.ufit.server.dto.request.WorkoutPlanDto;
import com.ufit.server.entity.WorkoutPlan;
import com.ufit.server.repository.WorkoutPlanRepository;
import com.ufit.server.service.WorkoutPlanService;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;

@Service
public class WorkoutPlanServiceImpl implements WorkoutPlanService {

    private final WorkoutPlanRepository repo;

    public WorkoutPlanServiceImpl(WorkoutPlanRepository repo) {
        this.repo = repo;
    }

    @Override
    public Mono<WorkoutPlan> createPlan(String username, WorkoutPlanDto dto) {
        WorkoutPlan plan = new WorkoutPlan();
        plan.setUsername(username);
        plan.setPlanDetails(dto.toJson());  // bạn có thể serialize dto thành JSON hoặc format nào tuỳ ý
        plan.setCreatedAt(LocalDateTime.now());
        return Mono.just(repo.save(plan));
    }
}
