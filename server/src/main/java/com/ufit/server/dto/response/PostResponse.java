// server/src/main/java/com/ufit/server/dto/response/PostResponse.java
package com.ufit.server.dto.response;

import java.time.LocalDateTime;
import java.util.List;

public record PostResponse(
    Long id,
    String author,
    String content,
    LocalDateTime createdAt,
    String imageUrl,
    int upvotes,
    int downvotes,
    Long parentPostId,
    List<PostResponse> replies,
    boolean userVoted,
    Boolean userVoteIsUpvote
) {}