// server/src/main/java/com/ufit/server/dto/request/WorkoutPlanDto.java
package com.ufit.server.dto.request;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;

public record WorkoutPlanDto(
    String title,
    List<String> details
) {
  private static final ObjectMapper M = new ObjectMapper();
  public static WorkoutPlanDto fromJson(String json) {
    try {
      return M.readValue(json, WorkoutPlanDto.class);
    } catch (Exception e) {
      throw new RuntimeException("Failed to parse plan JSON", e);
    }
  }
  public String toJson() {
    try {
      return M.writeValueAsString(this);
    } catch (Exception e) {
      throw new RuntimeException(e);
    }
  }
}
