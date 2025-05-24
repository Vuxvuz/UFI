package com.ufit.server.dto.response;
import java.util.List;



import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

public record TopicResponse(
    Long id,
    String title,
    String author,
    LocalDateTime createdAt,
    CategoryDto category,
    int upvotes,
    int downvotes,
    Boolean userVoteIsUpvote,
    List<PostResponse> posts
) {}