// server/src/main/java/com/ufit/server/controller/WorkoutPlanController.java
package com.ufit.server.controller;

import com.ufit.server.dto.request.ChatBotRequest;
import com.ufit.server.dto.request.WorkoutPlanDto;
import com.ufit.server.dto.response.WorkoutPlanResponse;
import com.ufit.server.service.ChatBotService;
import com.ufit.server.service.ProfileService;
import com.ufit.server.service.WorkoutPlanService;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.security.Principal;

@RestController
@RequestMapping("/api/plans")
public class WorkoutPlanController {

    private final ChatBotService    chatBotService;
    private final WorkoutPlanService planService;
    private final ProfileService    profileService;

    public WorkoutPlanController(
        ChatBotService chatBotService,
        WorkoutPlanService planService,
        ProfileService profileService
    ) {
        this.chatBotService  = chatBotService;
        this.planService     = planService;
        this.profileService  = profileService;
    }

    /**
     * 1) Preview: chỉ gọi AI để nhận về WorkoutPlanDto mà không lưu vào DB.
     *    Client có thể hiển thị cho user xem, nếu họ “Đồng ý” mới gọi endpoint Save bên dưới.
     */
    @PostMapping("/preview")
    public Mono<WorkoutPlanDto> previewPlan(
        @RequestBody ChatBotRequest req,
        Principal principal
    ) {
        // Lấy thông tin profile
        var prof = profileService.getProfile(principal.getName());

        // Enrich request với height/weight/aim từ profile
        var enriched = new ChatBotRequest(
            req.message(),
            prof.height(),
            prof.weight(),
            prof.aim(),
            req.previewPlan()
        );

        // Gọi AI để tạo kế hoạch, trả về DTO
        return chatBotService.askForPlan(enriched);
    }

    /**
     * 2) Save: client gửi lại WorkoutPlanDto (đã preview và user đồng ý).
     *    Lưu vào DB và trả về ID + title.
     */
    @PostMapping
    public Mono<WorkoutPlanResponse> savePlan(
        @RequestBody WorkoutPlanDto dto,
        Principal principal
    ) {
        return planService
            .createPlan(principal.getName(), dto)
            .map(plan -> new WorkoutPlanResponse(
                plan.getId(),
                dto.title()
            ));
    }
}
