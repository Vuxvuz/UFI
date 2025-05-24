// server/src/main/java/com/ufit/server/entity/ForumPost.java
package com.ufit.server.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "forum_posts")
public class ForumPost {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "topic_id")
    private ForumTopic topic;

    private String author;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column
    private String imageUrl;

    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(columnDefinition = "integer default 0")
    private int upvotes = 0;

    @Column(columnDefinition = "integer default 0")
    private int downvotes = 0;

    @ManyToOne
    @JoinColumn(name = "parent_id")
    private ForumPost parentPost;

    @OneToMany(mappedBy = "parentPost", cascade = CascadeType.ALL)
    private List<ForumPost> replies = new ArrayList<>();

    @Column(nullable = false, columnDefinition = "boolean default true")
    private boolean commentsEnabled = true;

    // getters & setters

    public Long getId() { return id; }
    public ForumTopic getTopic() { return topic; }
    public void setTopic(ForumTopic topic) { this.topic = topic; }

    public String getAuthor() { return author; }
    public void setAuthor(String author) { this.author = author; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public LocalDateTime getCreatedAt() { return createdAt; }

    public int getUpvotes() { return upvotes; }
    public void setUpvotes(int upvotes) { this.upvotes = upvotes; }

    public int getDownvotes() { return downvotes; }
    public void setDownvotes(int downvotes) { this.downvotes = downvotes; }

    public ForumPost getParentPost() { return parentPost; }
    public void setParentPost(ForumPost parentPost) { this.parentPost = parentPost; }

    public List<ForumPost> getReplies() { return replies; }
    public void setReplies(List<ForumPost> replies) { this.replies = replies; }

    public boolean isCommentsEnabled() { return commentsEnabled; }
    public void setCommentsEnabled(boolean commentsEnabled) { this.commentsEnabled = commentsEnabled; }
}
