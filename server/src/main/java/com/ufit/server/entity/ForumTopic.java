package com.ufit.server.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "forum_topics")
public class ForumTopic {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String author;
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(columnDefinition = "boolean default false")
    private boolean isLocked = false;

    @Column(columnDefinition = "integer default 0")
    private int upvotes = 0;

    @Column(columnDefinition = "integer default 0")
    private int downvotes = 0;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "locked_by_id")
    private User lockedBy;

    private LocalDateTime lockedAt;

    @OneToMany(mappedBy = "topic", cascade = CascadeType.ALL)
    private List<ForumPost> posts = new ArrayList<>();

    // getters & setters

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getAuthor() { return author; }
    public void setAuthor(String author) { this.author = author; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public boolean isLocked() { return isLocked; }
    public void setLocked(boolean locked) { this.isLocked = locked; }
    public User getLockedBy() { return lockedBy; }
    public void setLockedBy(User lockedBy) { this.lockedBy = lockedBy; }
    public LocalDateTime getLockedAt() { return lockedAt; }
    public void setLockedAt(LocalDateTime lockedAt) { this.lockedAt = lockedAt; }
    public int getUpvotes() { return upvotes; }
    public void setUpvotes(int upvotes) { this.upvotes = upvotes; }
    public int getDownvotes() { return downvotes; }
    public void setDownvotes(int downvotes) { this.downvotes = downvotes; }
    public Category getCategory() { return category; }
    public void setCategory(Category category) { this.category = category; }
    public List<ForumPost> getPosts() { return posts; }
    public void setPosts(List<ForumPost> posts) { this.posts = posts; }
}