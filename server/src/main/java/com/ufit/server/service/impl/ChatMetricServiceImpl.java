// server/src/main/java/com/ufit/server/service/impl/ChatMetricServiceImpl.java
package com.ufit.server.service.impl;

import com.ufit.server.entity.ChatMetric;
import com.ufit.server.repository.ChatMetricRepository;
import com.ufit.server.service.ChatMetricService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@Transactional
public class ChatMetricServiceImpl implements ChatMetricService {

    private final ChatMetricRepository repo;

    public ChatMetricServiceImpl(ChatMetricRepository repo) {
        this.repo = repo;
    }

    @Override
    public void recordMessageSent(String username) {
        ChatMetric m = repo.findById(username)
                           .orElse(new ChatMetric(username));
        m.setMessageCount(m.getMessageCount() + 1);
        m.setLastSentAt(LocalDateTime.now());
        repo.save(m);
    }
}
