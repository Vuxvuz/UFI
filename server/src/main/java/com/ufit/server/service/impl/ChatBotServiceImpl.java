// server/src/main/java/com/ufit/server/service/impl/ChatBotServiceImpl.java
package com.ufit.server.service.impl;

import com.ufit.server.dto.request.ChatBotRequest;
import com.ufit.server.dto.request.WorkoutPlanDto;
import com.ufit.server.entity.ChatMetric;
import com.ufit.server.repository.ChatMetricRepository;
import com.ufit.server.service.ChatBotService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
public class ChatBotServiceImpl implements ChatBotService {

    private final WebClient client;
    
    @Autowired
    private ChatMetricRepository chatMetricRepository;

    public ChatBotServiceImpl(@Value("${openai.api.key}") String apiKey, WebClient.Builder webClientBuilder) {
        this.client = webClientBuilder
          .baseUrl("https://api.openai.com/v1/chat/completions")
          .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
          .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
          .build();
    }

    @Override
    public Mono<String> ask(ChatBotRequest req) {
        // Capture the security context before going async
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication != null ? authentication.getName() : "anonymous";
        
        // Update metrics
        updateChatMetrics(username);
        
        // Create body with fitness-specific system context
        var body = Map.of(
          "model", "gpt-3.5-turbo",
          "messages", List.of(
            Map.of("role", "system", "content", 
                "You are a professional fitness coach. Provide specific workout and nutrition advice. " +
                "Focus on offering practical fitness plans, exercise techniques, and healthy eating recommendations. " +
                "Your answers should be detailed, structured, and tailored to fitness enthusiasts. " +
                "When asked for plans, provide day-by-day structured workout plans with specific exercises."),
            Map.of("role", "user", "content", req.message())
          )
        );
        
        return client.post()
          .bodyValue(body)
          .retrieve()
          .bodyToMono(Map.class)
          .subscribeOn(Schedulers.boundedElastic())
          .map(map -> {
              var choices = (List<?>) map.get("choices");
              if (choices != null && !choices.isEmpty()) {
                  var msg = (Map<?,?>)((Map<?,?>)choices.get(0)).get("message");
                  return (String)msg.get("content");
              }
              throw new RuntimeException("AI did not return a response");
          });
    }

    @Override
    public Mono<WorkoutPlanDto> askForPlan(ChatBotRequest req) {
        // Capture the security context before going async
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication != null ? authentication.getName() : "anonymous";
        
        // Update metrics
        updateChatMetrics(username);
        
        String prompt = String.format("""
            You are a fitness coach. User info:
            - height: %.0f cm
            - weight: %.0f kg
            - aim: %s

            Generate a comprehensive weekly workout plan as valid JSON with the following structure:
            {
              "title": "Personalized Weekly Workout Plan",
              "description": "Brief overview of the plan and its benefits",
              "difficulty": "Beginner/Intermediate/Advanced",
              "targetMuscleGroups": "Main muscle groups targeted",
              "estimatedDurationMinutes": 45-90,
              "details": [
                "Day 1: Full detailed workout with exercises, sets, reps",
                "Day 2: Rest or active recovery details",
                "Day 3: Full detailed workout with exercises, sets, reps",
                "etc..."
              ],
              "media": [
                {
                  "type": "youtube",
                  "url": "https://www.youtube.com/watch?v=VIDEO_ID",
                  "title": "How to perform [Exercise Name] correctly",
                  "exerciseName": "Name of the exercise"
                },
                {
                  "type": "image",
                  "url": "https://example.com/exercise-image.jpg",
                  "title": "Proper form for [Exercise Name]",
                  "exerciseName": "Name of the exercise"
                }
              ]
            }
            
            Include 3-5 media items (primarily YouTube videos) for the most important exercises in your plan.
            Use real, existing YouTube videos with actual video IDs.
            Only output the JSON object with no additional text.
            """,
            req.height(), req.weight(), req.aim()
        );
        
        var body = Map.of(
          "model", "gpt-3.5-turbo",
          "messages", List.of(
            Map.of("role","system","content","You are a professional fitness coach specializing in creating personalized workout plans with multimedia resources."),
            Map.of("role","user","content",prompt)
          )
        );
        
        return client.post()
          .bodyValue(body)
          .retrieve()
          .bodyToMono(Map.class)
          .subscribeOn(Schedulers.boundedElastic())
          .map(map -> {
              var choices = (List<?>) map.get("choices");
              if (choices!=null && !choices.isEmpty()) {
                  var msg = (Map<?,?>)((Map<?,?>)choices.get(0)).get("message");
                  String json = ((String)msg.get("content")).trim();
                  
                  // Clean up the JSON string by removing any markdown code blocks
                  if (json.startsWith("```json")) {
                      json = json.substring(7);
                  } else if (json.startsWith("```")) {
                      json = json.substring(3);
                  }
                  
                  if (json.endsWith("```")) {
                      json = json.substring(0, json.length() - 3);
                  }
                  
                  json = json.trim();
                  
                  // Parse the JSON into our DTO
                  return WorkoutPlanDto.fromJson(json);
              }
              throw new RuntimeException("AI did not return a plan");
          })
          .onErrorResume(e -> {
              System.err.println("Error generating plan: " + e.getMessage());
              e.printStackTrace();
              
              // Fallback to a simpler plan structure if there's an error
              return ask(req).map(text -> {
                  List<String> details = List.of(text.split("\n"));
                  return new WorkoutPlanDto(
                      "Basic Workout Plan", 
                      details, 
                      List.of(), 
                      "Generated plan based on your requirements", 
                      "Intermediate",
                      "",
                      60
                  );
              });
          });
    }
    
    private void updateChatMetrics(String username) {
        try {
            ChatMetric metric = chatMetricRepository.findById(username)
                .orElse(new ChatMetric(username));
            
            metric.setMessageCount(metric.getMessageCount() + 1);
            metric.setLastSentAt(LocalDateTime.now());
            
            chatMetricRepository.save(metric);
        } catch (Exception e) {
            System.err.println("Error updating chat metrics: " + e.getMessage());
        }
    }
}
