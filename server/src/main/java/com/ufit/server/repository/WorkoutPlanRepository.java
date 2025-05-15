// server/src/main/java/com/ufit/server/repository/WorkoutPlanRepository.java
package com.ufit.server.repository;

import com.ufit.server.entity.WorkoutPlan;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.List;

public interface WorkoutPlanRepository extends JpaRepository<WorkoutPlan, Long> {
    List<WorkoutPlan> findAllByUsername(String username);
    Optional<WorkoutPlan> findByIdAndUsername(Long id, String username);
}
