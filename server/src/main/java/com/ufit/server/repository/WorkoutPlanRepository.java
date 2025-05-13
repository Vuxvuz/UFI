// server/src/main/java/com/ufit/server/repository/WorkoutPlanRepository.java
package com.ufit.server.repository;

import com.ufit.server.entity.WorkoutPlan;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WorkoutPlanRepository extends JpaRepository<WorkoutPlan, Long> {}
