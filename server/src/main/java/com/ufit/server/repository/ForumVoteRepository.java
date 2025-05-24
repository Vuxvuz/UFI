package com.ufit.server.repository;

import com.ufit.server.entity.ForumVote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ForumVoteRepository extends JpaRepository<ForumVote, Long> {
    Optional<ForumVote> findByPostIdAndUsername(Long postId, String username);
    int countByPostIdAndIsUpvote(Long postId, boolean isUpvote);
    
    @Query("SELECT COUNT(v) FROM ForumVote v JOIN v.post p WHERE p.author = :author AND v.isUpvote = :isUpvote")
    int countByPostAuthorAndIsUpvote(@Param("author") String author, @Param("isUpvote") boolean isUpvote);
} 