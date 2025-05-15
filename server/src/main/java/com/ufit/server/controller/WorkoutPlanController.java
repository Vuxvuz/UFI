// server/src/main/java/com/ufit/server/controller/WorkoutPlanController.java
package com.ufit.server.controller;

import com.ufit.server.dto.request.ChatBotRequest;
import com.ufit.server.dto.request.WorkoutPlanDto;
import com.ufit.server.dto.response.WorkoutPlanDetailResponse;
import com.ufit.server.dto.response.WorkoutPlanResponse;
import com.ufit.server.service.WorkoutPlanService;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.security.Principal;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/plans")
public class WorkoutPlanController {

    private static final Logger logger = LoggerFactory.getLogger(WorkoutPlanController.class);
    private final WorkoutPlanService planService;

    public WorkoutPlanController(WorkoutPlanService planService) {
        this.planService = planService;
    }

    /** 1) Preview (chưa lưu) */
    @PostMapping("/preview")
    public WorkoutPlanDto previewPlan(
        @RequestBody ChatBotRequest req,
        Principal principal
    ) {
        logger.debug("PreviewPlan called by {}", principal.getName());
        return planService.previewPlan(principal.getName(), req);
    }

    /** 2) Save */
    @PostMapping
    public WorkoutPlanResponse savePlan(
        @RequestBody WorkoutPlanDto dto,
        Principal principal
    ) {
        logger.debug("SavePlan called by {}", principal.getName());
        var entity = planService.createPlan(principal.getName(), dto);
        return new WorkoutPlanResponse(
            entity.getId(),
            dto.title(),
            entity.getCreatedAt()
        );
    }

    /** 3) List tất cả plans của user */
    @GetMapping
    public List<WorkoutPlanResponse> listPlans(Principal principal) {
        logger.debug("ListPlans called by {}", principal.getName());
        return planService.findAllByUsername(principal.getName())
            .stream()
            .map(ent -> {
                var dto = WorkoutPlanDto.fromJson(ent.getPlanDetails());
                return new WorkoutPlanResponse(
                    ent.getId(),
                    dto.title(),
                    ent.getCreatedAt()
                );
            })
            .collect(Collectors.toList());
    }

    /** 4) Detail một plan */
    @GetMapping("/{id}")
    public WorkoutPlanDetailResponse getPlan(
        @PathVariable Long id,
        Principal principal
    ) {
        logger.debug("GetPlan({}) called by {}", id, principal.getName());
        var opt = planService.findByIdAndUsername(id, principal.getName());
        var ent = opt.orElseThrow(() ->
            new ResponseStatusException(HttpStatus.NOT_FOUND, "Plan not found")
        );
        var dto = WorkoutPlanDto.fromJson(ent.getPlanDetails());
        return new WorkoutPlanDetailResponse(
            ent.getId(),
            dto.title(),
            dto.details(),
            ent.getCreatedAt()
        );
    }
}
