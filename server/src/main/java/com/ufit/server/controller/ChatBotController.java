package com.ufit.server.controller;

import com.ufit.server.dto.request.ChatBotRequest;
import com.ufit.server.dto.request.WorkoutPlanDto;
import com.ufit.server.dto.response.ApiResponse;
import com.ufit.server.service.ChatBotService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClientResponseException;

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
        } catch (WebClientResponseException.Unauthorized e) {
            // Handle 401 Unauthorized specifically
            System.err.println("OpenAI API key unauthorized: " + e.getMessage());
            // Use 503 Service Unavailable instead of 401 to avoid triggering authentication issues
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(new ApiResponse<>("ERROR", "OpenAI API key is invalid or expired. Please update your API key in the server configuration.", null));
        } catch (WebClientResponseException e) {
            // Handle other WebClient exceptions
            System.err.println("WebClient error: " + e.getStatusCode() + " " + e.getMessage());
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(new ApiResponse<>("ERROR", "Error communicating with AI service: " + e.getStatusText(), null));
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
        } catch (WebClientResponseException.Unauthorized e) {
            // Handle 401 Unauthorized specifically
            System.err.println("OpenAI API key unauthorized: " + e.getMessage());
            // Use 503 Service Unavailable instead of 401 to avoid triggering authentication issues
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(new ApiResponse<>("ERROR", "OpenAI API key is invalid or expired. Please update your API key in the server configuration.", null));
        } catch (WebClientResponseException e) {
            // Handle other WebClient exceptions
            System.err.println("WebClient error: " + e.getStatusCode() + " " + e.getMessage());
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(new ApiResponse<>("ERROR", "Error communicating with AI service: " + e.getStatusText(), null));
        } catch (Exception e) {
            System.err.println("Error generating plan: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                .body(new ApiResponse<>("ERROR", e.getMessage(), null));
        }
    }
}