package com.ufit.server.controller;

import com.ufit.server.dto.request.ChatBotRequest;
import com.ufit.server.dto.response.ChatBotResponse;
import com.ufit.server.dto.response.ProfileResponse;
import com.ufit.server.service.ChatBotService;
import com.ufit.server.service.ProfileService;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.security.Principal;

@RestController
@RequestMapping("/api/chatbot")
public class ChatBotController {

    private final ChatBotService chatBotService;
    private final ProfileService profileService;

    public ChatBotController(ChatBotService chatBotService, ProfileService profileService) {
        this.chatBotService = chatBotService;
        this.profileService = profileService;
    }

    @PostMapping("/message")
    public Mono<ChatBotResponse> getReply(
        @RequestBody ChatBotRequest req,
        Principal principal
    ) {
        if (principal == null) {
            return Mono.just(new ChatBotResponse("Vui lòng đăng nhập để sử dụng chatbot.", null));
        }

        try {
            // 1) Lấy profile
            ProfileResponse prof = profileService.getProfile(principal.getName());
            if (prof == null || !prof.profileCompleted()) {
                return Mono.just(new ChatBotResponse(
                    "Vui lòng hoàn thiện profile trước khi sử dụng chatbot.",
                    null
                ));
            }

            // 2) Enrich request
            var enriched = new ChatBotRequest(
                req.message(),
                prof.height() != null ? prof.height() : req.height(),
                prof.weight() != null ? prof.weight() : req.weight(),
                prof.aim() != null ? prof.aim() : req.aim(),
                req.previewPlan()
            );

            // 3) Nếu previewPlan=true thì gọi AI tạo kế hoạch
            if (enriched.previewPlan()) {
                return chatBotService.askForPlan(enriched)
                    .map(planDto -> new ChatBotResponse(
                        "Đây là kế hoạch của bạn",
                        planDto
                    ))
                    .switchIfEmpty(Mono.just(new ChatBotResponse("Không tạo được kế hoạch.", null)));
            }

            // 4) Ngược lại chat text bình thường
            return chatBotService.ask(enriched)
                .map(text -> new ChatBotResponse(text, null))
                .switchIfEmpty(Mono.just(new ChatBotResponse("Không trả lời được.", null)));
        } catch (IllegalArgumentException e) {
            return Mono.just(new ChatBotResponse("Không tìm thấy người dùng: " + e.getMessage(), null));
        }
    }
}