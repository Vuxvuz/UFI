package com.ufit.server.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "forum_votes", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"post_id", "username"})
})
public class ForumVote {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne @JoinColumn(name = "post_id")
    private ForumPost post;

    private String username;
    private boolean isUpvote;
    private LocalDateTime createdAt = LocalDateTime.now();

    
    // Getters and setters
    public Long getId() { return id; }
    
    public ForumPost getPost() { return post; }
    public void setPost(ForumPost post) { this.post = post; }
    
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    
    public boolean isUpvote() { return isUpvote; }
    public void setUpvote(boolean upvote) { isUpvote = upvote; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
} 