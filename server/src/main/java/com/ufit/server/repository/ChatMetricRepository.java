// server/src/main/java/com/ufit/server/repository/ChatMetricRepository.java
package com.ufit.server.repository;

import com.ufit.server.entity.ChatMetric;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ChatMetricRepository extends JpaRepository<ChatMetric, String> {
    // No additional methods needed
}
