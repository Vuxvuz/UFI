// server/src/main/java/com/ufit/server/entity/WorkoutPlan.java
package com.ufit.server.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "workout_plans")
@Data
public class WorkoutPlan {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String username;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String planDetails;

    private LocalDateTime createdAt;
}
