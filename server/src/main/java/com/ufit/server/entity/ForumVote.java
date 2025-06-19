package com.ufit.server.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "forum_votes")
public class ForumVote {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "post_id")
    private ForumPost post;

    @ManyToOne
    @JoinColumn(name = "topic_id")
    private ForumTopic topic;

    private String username;

    @Column(name = "is_upvote")
    private boolean upvote;

    // getters & setters

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public ForumPost getPost() { return post; }
    public void setPost(ForumPost post) { this.post = post; }
    public ForumTopic getTopic() { return topic; }
    public void setTopic(ForumTopic topic) { this.topic = topic; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public boolean isUpvote() { return upvote; }
    public void setUpvote(boolean upvote) { this.upvote = upvote; }
}
