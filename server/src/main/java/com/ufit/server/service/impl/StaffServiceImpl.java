// src/main/java/com/ufit/server/service/impl/StaffServiceImpl.java
package com.ufit.server.service.impl;

import com.ufit.server.dto.response.StaffDashboard;
import com.ufit.server.repository.UserRepository;
import com.ufit.server.service.StaffService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class StaffServiceImpl implements StaffService {
    @Autowired private UserRepository userRepo;

    @Override
    public StaffDashboard getDashboard() {
        long users = userRepo.count();
        long staff  = userRepo.findAll().stream()
                          .filter(u -> u.getRole().name().equals("ROLE_STAFF"))
                          .count();
        long reports = 0; // giả sử count từ bảng report nếu có
        return new StaffDashboard(reports, users, staff);
    }
}
