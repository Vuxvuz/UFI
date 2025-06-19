package com.ufit.server.service.impl;

import com.ufit.server.dto.response.TopicDto;
import com.ufit.server.entity.ForumTopic;
import com.ufit.server.repository.ForumTopicRepository;
import com.ufit.server.service.TopicService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Triển khai TopicService, lấy tất cả topic từ ForumTopic table.
 */
@Service
public class TopicServiceImpl implements TopicService {

    @Autowired
    private ForumTopicRepository topicRepository;

    @Override
    public List<TopicDto> getAllTopicsForModerator() {
        // Lấy tất cả ForumTopic entity
        List<ForumTopic> topics = topicRepository.findAll();

        // Map sang DTO (lấy id, title và category)
        return topics.stream()
                .map(t -> new TopicDto(
                    t.getId(), 
                    t.getTitle(),
                    t.getCategory() != null ? t.getCategory().getName() : null,
                    t.getAuthor(),
                    t.getCreatedAt()
                ))
                .collect(Collectors.toList());
    }
}
