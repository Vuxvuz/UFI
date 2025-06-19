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
    Optional<ForumVote> findByTopicIdAndUsername(Long topicId, String username);
    int countByPostIdAndUpvote(Long postId, boolean upvote);
    int countByTopicIdAndUpvote(Long topicId, boolean upvote);

    @Query("SELECT COUNT(v) FROM ForumVote v JOIN v.post p WHERE p.author = :author AND v.upvote = :upvote")
    int countByPostAuthorAndUpvote(@Param("author") String author, @Param("upvote") boolean upvote);

    @Query("SELECT COUNT(v) FROM ForumVote v JOIN v.topic t WHERE t.author = :author AND v.upvote = :upvote")
    int countByTopicAuthorAndUpvote(@Param("author") String author, @Param("upvote") boolean upvote);
}
