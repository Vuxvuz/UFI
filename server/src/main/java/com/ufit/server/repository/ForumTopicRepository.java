// server/src/main/java/com/ufit/server/repository/ForumTopicRepository.java
package com.ufit.server.repository;

import com.ufit.server.entity.ForumTopic;
import com.ufit.server.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ForumTopicRepository extends JpaRepository<ForumTopic, Long> {
    List<ForumTopic> findAllByCategory(Category category);
}
