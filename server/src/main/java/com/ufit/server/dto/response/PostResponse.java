// server/src/main/java/com/ufit/server/dto/response/PostResponse.java
package com.ufit.server.dto.response;

import java.time.LocalDateTime;

public record PostResponse(
    Long id,
    String author,
    String content,
    LocalDateTime createdAt,
    String imageUrl
) {}