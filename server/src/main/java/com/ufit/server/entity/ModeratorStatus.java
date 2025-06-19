package com.ufit.server.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
public class ModeratorStatus {
    @Id
    private Long userId; // Matches User entity ID

    private boolean isOnline;

    @Column(nullable = false)
    private long lastActive; // Timestamp in milliseconds
}