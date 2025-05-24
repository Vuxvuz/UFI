package com.ufit.server.repository;

import com.ufit.server.entity.ChatLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatLogRepository extends JpaRepository<ChatLog, Long> {
    List<ChatLog> findByUsernameOrderByTimestampDesc(String username);
    
    @Query("SELECT c FROM ChatLog c ORDER BY c.timestamp DESC")
    List<ChatLog> findAllOrderByTimestampDesc();
} 