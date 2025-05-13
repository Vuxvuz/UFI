package com.ufit.server.service;

// import reactor.core.publisher.Mono;
import com.ufit.server.entity.WorkoutPlan;
import com.ufit.server.dto.request.WorkoutPlanDto;
import reactor.core.publisher.Mono;;

public interface WorkoutPlanService {
    Mono<WorkoutPlan> createPlan(String username, WorkoutPlanDto dto);
}
