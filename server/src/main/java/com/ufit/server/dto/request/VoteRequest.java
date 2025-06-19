package com.ufit.server.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;

public class VoteRequest {
    @JsonProperty("isUpvote")
    private boolean upvote;

    public boolean isUpvote() {
        return upvote;
    }

    public void setUpvote(boolean upvote) {
        this.upvote = upvote;
    }
}
