// server/src/main/java/com/ufit/server/service/impl/ChatBotServiceImpl.java
package com.ufit.server.service.impl;

import com.ufit.server.dto.request.ChatBotRequest;
import com.ufit.server.dto.request.WorkoutPlanDto;
import com.ufit.server.service.ChatBotService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

@Service
public class ChatBotServiceImpl implements ChatBotService {

    private final WebClient client;

    public ChatBotServiceImpl(@Value("${openai.api.key}") String apiKey) {
        this.client = WebClient.builder()
          .baseUrl("https://api.openai.com/v1/chat/completions")
          .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
          .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
          .build();
    }

    @Override
    public Mono<String> ask(ChatBotRequest req) {
        var body = Map.of(
          "model", "gpt-3.5-turbo",
          "messages", List.of(
            Map.of("role","user","content", req.message())
          )
        );
        return client.post()
          .bodyValue(body)
          .retrieve()
          .bodyToMono(Map.class)
          .map(map -> {
              var choices = (List<?>) map.get("choices");
              if (choices!=null && !choices.isEmpty()) {
                  var msg = (Map<?,?>)((Map<?,?>)choices.get(0)).get("message");
                  return ((String)msg.get("content")).trim();
              }
              return "Xin lỗi, tôi không có phản hồi.";
          });
    }

    @Override
    public Mono<WorkoutPlanDto> askForPlan(ChatBotRequest req) {
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
}
