package com.ufit.server.repository;

import com.ufit.server.entity.ForumTopic;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ForumTopicRepository extends JpaRepository<ForumTopic, Long> {
    List<ForumTopic> findByCategory_NameIgnoreCase(String categoryName);
}
