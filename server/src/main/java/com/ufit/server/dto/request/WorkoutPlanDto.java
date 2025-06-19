// server/src/main/java/com/ufit/server/dto/request/WorkoutPlanDto.java
package com.ufit.server.dto.request;

import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.ArrayList;
import java.util.List;

public record WorkoutPlanDto(
    String title,
    List<String> details,
    List<ExerciseMedia> media,
    String description,
    String difficulty,
    String targetMuscleGroups,
    int estimatedDurationMinutes
) {
    private static final ObjectMapper M = new ObjectMapper();
    
    // Constructor with default values for backward compatibility
    public WorkoutPlanDto(String title, List<String> details) {
        this(title, details, new ArrayList<>(), "", "Intermediate", "", 60);
    }
    
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
    
    // Nested record for media items
    public record ExerciseMedia(
        String type,       // "youtube", "image", etc.
        String url,        // URL to the media
        String title,      // Title/description of the media
        String exerciseName // Name of the exercise this media demonstrates
    ) {}
}
