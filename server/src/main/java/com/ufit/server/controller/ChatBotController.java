package com.ufit.server.controller;

import com.ufit.server.dto.request.ChatBotRequest;
import com.ufit.server.dto.request.WorkoutPlanDto;
import com.ufit.server.dto.response.ApiResponse;
import com.ufit.server.service.ChatBotService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chatbot")
public class ChatBotController {

    @Autowired
    private ChatBotService chatBotService;

    @PostMapping("/message")
    public ResponseEntity<ApiResponse<String>> ask(@RequestBody ChatBotRequest request, Authentication authentication) {
        try {
            // Log the request and authentication status
            System.out.println("Chatbot request received from: " + 
                              (authentication != null ? authentication.getName() : "unauthenticated user"));
                              
            // Block on the reactive response - this is okay for this endpoint
            String response = chatBotService.ask(request).block();
            
            return ResponseEntity.ok(new ApiResponse<>("SUCCESS", "Fitness advice generated", response));
        } catch (Exception e) {
            System.err.println("Error processing chat request: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                .body(new ApiResponse<>("ERROR", e.getMessage(), null));
        }
    }

    @PostMapping("/plan")
    public ResponseEntity<ApiResponse<WorkoutPlanDto>> getPlan(@RequestBody ChatBotRequest request, Authentication authentication) {
        try {
            // Log the request and authentication status
            System.out.println("Plan request received from: " + 
                              (authentication != null ? authentication.getName() : "unauthenticated user"));
                              
            // Block on the reactive response - this is okay for this endpoint
            WorkoutPlanDto plan = chatBotService.askForPlan(request).block();
            
            return ResponseEntity.ok(new ApiResponse<>("SUCCESS", "Plan generated", plan));
        } catch (Exception e) {
            System.err.println("Error generating plan: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                .body(new ApiResponse<>("ERROR", e.getMessage(), null));
        }
    }
}