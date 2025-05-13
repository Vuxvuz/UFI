package com.ufit.server.dto.response;

import com.ufit.server.entity.Category;
import java.time.LocalDateTime;

public record TopicResponse(
    Long id,
    String title,
    String author,
    LocalDateTime createdAt,
    Category category
) {}
