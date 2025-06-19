
package com.ufit.server.service;

import com.ufit.server.entity.ForumVote;

public interface VoteService {
    /**
     * Process a vote on a post or topic, updating vote counts and karma
     */
    ForumVote processVote(Long entityId, String username, boolean isUpvote, String entityType);
}
