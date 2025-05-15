// src/main/java/com/ufit/server/service/impl/AdminServiceImpl.java
package com.ufit.server.service.impl;

import com.ufit.server.dto.response.AdminDashboard;
import com.ufit.server.dto.response.UserProfile;
import com.ufit.server.entity.Role;
import com.ufit.server.entity.User;
import com.ufit.server.repository.UserRepository;
import com.ufit.server.service.AdminService;
import com.ufit.server.service.ProfileService;
import com.ufit.server.service.UserService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AdminServiceImpl implements AdminService {
    @Autowired private UserRepository userRepo;
    // @Autowired private ProfileService profileService;  // reuse logic hiện có
    @Autowired private UserService    userService;

    @Override
    public AdminDashboard getDashboard() {
        long total = userRepo.count();
        long staff = userRepo.findAll().stream()
                            .filter(u -> u.getRole() == Role.ROLE_STAFF)
                            .count();
        long admins= userRepo.findAll().stream()
                            .filter(u -> u.getRole() == Role.ROLE_ADMIN)
                            .count();
        return new AdminDashboard(total, staff, admins);
    }

    @Override
    public void assignRole(String username, String role) {
        User u = userRepo.findByUsername(username)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        u.setRole(Role.valueOf(role));
        userRepo.save(u);
    }

    @Override
    public UserProfile getUserProfile(String username) {
        // chỉ Admin mới gọi, trả về profile bất kỳ
        return userService.getProfile(username);
    }
}
