// server/src/main/java/com/ufit/server/repository/ForumPostRepository.java
package com.ufit.server.repository;

import com.ufit.server.entity.ForumPost;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ForumPostRepository extends JpaRepository<ForumPost, Long> {
    List<ForumPost> findByTopicId(Long topicId);
    List<ForumPost> findByTopicIdAndParentPostIsNull(Long topicId);
    List<ForumPost> findByParentPostId(Long parentPostId);
}
