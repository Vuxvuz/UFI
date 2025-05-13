package com.ufit.server.dto.request;

import com.ufit.server.entity.Category;

public record TopicRequest(
    String title,
    Category category
) {}
