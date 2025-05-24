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

            Generate a weekly workout plan as valid JSON with fields:
            { "title": "...", "details": ["Day 1: ...", "Day 2: ...", ...] }
            Only output the JSON object.
            """,
            req.height(), req.weight(), req.aim()
        );
        var body = Map.of(
          "model", "gpt-3.5-turbo",
          "messages", List.of(
            Map.of("role","system","content","You are a fitness coach."),
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
                  return WorkoutPlanDto.fromJson(json);
              }
              throw new RuntimeException("AI did not return a plan");
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
