// src/main/java/com/ufit/server/service/impl/AdminServiceImpl.java
package com.ufit.server.service.impl;

import com.ufit.server.dto.response.AdminDashboard;
import com.ufit.server.dto.response.UserDto;
import com.ufit.server.dto.response.UserProfile;
import com.ufit.server.entity.Role;
import com.ufit.server.entity.User;
import com.ufit.server.repository.UserRepository;
import com.ufit.server.service.AdminService;
import com.ufit.server.service.UserService;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;
import com.ufit.server.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AdminServiceImpl implements AdminService {
    @Autowired private UserRepository userRepo;
    @Autowired private UserService userService;

    @Override
    public AdminDashboard getDashboard() {
        long total = userRepo.count();
        long moderators = userRepo.findAll().stream()
                            .filter(u -> u.getRole() == Role.ROLE_MODERATOR)
                            .count();
        long admins = userRepo.findAll().stream()
                            .filter(u -> u.getRole() == Role.ROLE_ADMIN)
                            .count();
        return new AdminDashboard(total, moderators, admins);
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

    @Override
    public List<UserDto> getAllUsers() {
        List<User> users = userRepo.findAll();
        
        return users.stream()
                .map(user -> {
                    UserDto dto = new UserDto();
                    dto.setId(user.getId());
                    dto.setUsername(user.getUsername());
                    dto.setEmail(user.getEmail());
                    dto.setRole(user.getRole().toString());
                    return dto;
                })
                .collect(Collectors.toList());
    }

     @Override
    public void deleteUserById(Long userId) {
        User u = userRepo.findById(userId)
                .orElseThrow(() -> new NoSuchElementException("User not found with id " + userId));
        userRepo.delete(u);
    }
    
}