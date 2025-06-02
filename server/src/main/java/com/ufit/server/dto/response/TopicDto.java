// File: src/main/java/com/ufit/server/dto/response/TopicDto.java
package com.ufit.server.dto.response;

/**
 * Tạm thời chỉ bao gồm id và title.
 * Sau này bạn có thể mở rộng thêm các trường cần thiết (author, createdAt, v.v.).
 */
public record TopicDto(
    Long id,
    String title
) {}
