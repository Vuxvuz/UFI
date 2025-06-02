package com.ufit.server.service;

import com.ufit.server.entity.ForumPost;
import com.ufit.server.entity.ForumVote;

public interface VoteService {
    /**
     * Process a vote on a post, updating vote counts and karma
     */
    ForumVote processVote(Long postId, String username, boolean isUpvote);
}