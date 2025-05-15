// server/src/main/java/com/ufit/server/service/impl/WorkoutPlanServiceImpl.java
package com.ufit.server.service.impl;

import com.ufit.server.dto.request.ChatBotRequest;
import com.ufit.server.dto.request.WorkoutPlanDto;
import com.ufit.server.entity.WorkoutPlan;
import com.ufit.server.repository.WorkoutPlanRepository;
import com.ufit.server.service.ChatBotService;
import com.ufit.server.service.WorkoutPlanService;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class WorkoutPlanServiceImpl implements WorkoutPlanService {
  private final WorkoutPlanRepository repo;
  private final ChatBotService   chatBotService;

  public WorkoutPlanServiceImpl(WorkoutPlanRepository repo,
                                ChatBotService chatBotService) {
    this.repo            = repo;
    this.chatBotService  = chatBotService;
  }

  @Override
  public WorkoutPlanDto previewPlan(String username, ChatBotRequest req) {
    // block() nếu chatBotService.askForPlan trả Mono
    return chatBotService.askForPlan(req).block();
  }

  @Override
  public WorkoutPlan createPlan(String username, WorkoutPlanDto dto) {
    WorkoutPlan p = new WorkoutPlan();
    p.setUsername(username);
    p.setPlanDetails(dto.toJson());
    p.setCreatedAt(LocalDateTime.now());
    return repo.save(p);
  }

  @Override
  public List<WorkoutPlan> findAllByUsername(String username) {
    return repo.findAllByUsername(username);
  }

  @Override
  public Optional<WorkoutPlan> findByIdAndUsername(Long id, String username) {
    return repo.findByIdAndUsername(id, username);
  }
}