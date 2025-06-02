package com.ufit.server.service.impl;

import com.ufit.server.dto.response.TopicDto;
import com.ufit.server.entity.Topic;
import com.ufit.server.repository.TopicRepository;
import com.ufit.server.service.TopicService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Triển khai TopicService, lấy tất cả topic từ DB rồi map sang TopicDto.
 */
@Service
public class TopicServiceImpl implements TopicService {

    @Autowired
    private TopicRepository topicRepository;

    @Override
    public List<TopicDto> getAllTopicsForModerator() {
        // Lấy tất cả Topic entity
        List<Topic> topics = topicRepository.findAll();

        // Map sang DTO (chỉ lấy id + title)
        return topics.stream()
                .map(t -> new TopicDto(t.getId(), t.getTitle()))
                .collect(Collectors.toList());
    }
}
