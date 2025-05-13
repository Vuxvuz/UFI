// server/src/main/java/com/ufit/server/repository/ForumTopicRepository.java
package com.ufit.server.repository;

import com.ufit.server.entity.ForumTopic;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ForumTopicRepository extends JpaRepository<ForumTopic, Long> {}
