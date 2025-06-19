package com.ufit.server.repository;

import com.ufit.server.entity.ChatSupport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatSupportRepository extends JpaRepository<ChatSupport, Long> {
    // Find chats by user ID and status (e.g., PENDING or ACTIVE)
    List<ChatSupport> findByUserIdAndStatus(Long userId, ChatSupport.ChatStatus status);

    // Find chats assigned to a moderator
    List<ChatSupport> findByModeratorIdAndStatus(Long moderatorId, ChatSupport.ChatStatus status);

    // Find all pending chats for moderator assignment
    List<ChatSupport> findByStatus(ChatSupport.ChatStatus status);

    // Find admin-initiated chats
    List<ChatSupport> findByIsAdminInitiatedTrue();
}