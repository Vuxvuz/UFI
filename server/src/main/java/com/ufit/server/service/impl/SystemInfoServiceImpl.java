package com.ufit.server.service.impl;

import com.ufit.server.dto.response.SystemInfoDto;
import com.ufit.server.repository.UserRepository;
import com.ufit.server.repository.ArticleRepository;
import com.ufit.server.service.SystemInfoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.lang.management.ManagementFactory;
import java.time.Duration;

@Service
public class SystemInfoServiceImpl implements SystemInfoService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ArticleRepository articleRepository;

    @Override
    public SystemInfoDto fetchSystemInfo() {
        long uptimeMillis = ManagementFactory.getRuntimeMXBean().getUptime();
        Duration uptime = Duration.ofMillis(uptimeMillis);
        String formattedUptime = String.format("%d hours %d minutes", uptime.toHours(), uptime.toMinutesPart());

        long totalUsers = userRepository.count();
        long totalArticles = articleRepository.count();

        return new SystemInfoDto("1.0.0", formattedUptime, totalUsers, totalArticles);
    }
}