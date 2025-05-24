// server/src/main/java/com/ufit/server/entity/ChatEntity.java
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
public class ChatEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String sender;
    
    @Column(length = 1000)
    private String content;
    
    private LocalDateTime timestamp;
}
