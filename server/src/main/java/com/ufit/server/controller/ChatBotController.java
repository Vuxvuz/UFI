// server/src/main/java/com/ufit/server/controller/ChatBotController.java
package com.ufit.server.controller;

import com.ufit.server.dto.request.ChatBotRequest;
import com.ufit.server.dto.response.ChatBotResponse;
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

    public ChatBotController(ChatBotService chatBotService,
                             ProfileService profileService) {
        this.chatBotService  = chatBotService;
        this.profileService  = profileService;
    }

    /**
     * POST /api/chatbot/message
     * Body: {
     *   "message": "...",
     *   "height": null,
     *   "weight": null,
     *   "aim": null,
     *   "previewPlan": true|false
     * }
     */
    @PostMapping("/message")
    public Mono<ChatBotResponse> getReply(
        @RequestBody ChatBotRequest req,
        Principal principal
    ) {
        // 1) enrich profile
        var prof = profileService.getProfile(principal.getName());
        var enriched = new ChatBotRequest(
            req.message(),
            prof.height(),
            prof.weight(),
            prof.aim(),
            req.previewPlan()
        );

        // 2) nếu previewPlan=true thì gọi AI tạo kế hoạch
        if (enriched.previewPlan()) {
            return chatBotService.askForPlan(enriched)
                .map(planDto -> new ChatBotResponse(
                    "Đây là kế hoạch của bạn",
                    planDto
                ));
        }

        // 3) ngược lại chat text bình thường
        return chatBotService.ask(enriched)
            .map(text -> new ChatBotResponse(text, null));
    }
}
