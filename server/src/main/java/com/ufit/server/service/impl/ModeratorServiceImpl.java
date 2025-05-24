package com.ufit.server.service.impl;

import com.ufit.server.dto.response.ModeratorDashboard;
import com.ufit.server.repository.UserRepository;
import com.ufit.server.service.ModeratorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class ModeratorServiceImpl implements ModeratorService {
    @Autowired private UserRepository userRepo;

    @Override
    public ModeratorDashboard getDashboard() {
        long users = userRepo.count();
        long moderators = userRepo.findAll().stream()
                          .filter(u -> u.getRole().name().equals("ROLE_MODERATOR"))
                          .count();
        long reports = 0; // This would be replaced with actual report count
        return new ModeratorDashboard(reports, users, moderators);
    }
} 