// File: src/main/java/com/ufit/server/service/TopicService.java
package com.ufit.server.service;

import com.ufit.server.dto.response.TopicDto;

import java.util.List;

public interface TopicService {
    /**
     * Lấy danh sách tất cả Topic dành cho Moderator.
     * (Trả về dưới dạng List<TopicDto> để Controller có thể trả trực tiếp)
     */
    List<TopicDto> getAllTopicsForModerator();
}
