package com.ufit.server.dto.request;

public class VoteRequest {
    private boolean isUpvote;

    public boolean isUpvote() {
        return isUpvote;
    }

    public void setUpvote(boolean isUpvote) {
        this.isUpvote = isUpvote;
    }
}
