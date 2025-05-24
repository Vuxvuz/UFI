package com.ufit.server.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
public class ChatLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String username;
    
    @Column(length = 1000)
    private String userMessage;
    
    @Column(length = 2000)
    private String botResponse;
    
    private LocalDateTime timestamp;
    
    private boolean containsPlan;
    
    @PrePersist
    public void prePersist() {
        timestamp = LocalDateTime.now();
    }
} 