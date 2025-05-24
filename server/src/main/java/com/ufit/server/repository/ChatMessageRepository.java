package com.ufit.server.repository;

import com.ufit.server.entity.ChatEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatEntity, Long> {
    List<ChatEntity> findBySenderOrderByTimestampDesc(String sender);
    List<ChatEntity> findAllByOrderByTimestampDesc();
} 