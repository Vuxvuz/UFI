package com.ufit.server.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatSupport {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 1000)
    private String message;

    private Long userId;
    private Long moderatorId; // Nullable if not yet assigned
    private LocalDateTime timestamp;

    @Enumerated(EnumType.STRING)
    private ChatStatus status; // PENDING, ACTIVE, CLOSED

    private Boolean isAdminInitiated = false; // For admin-initiated chats

    public enum ChatStatus {
        PENDING, ACTIVE, CLOSED
    }
}