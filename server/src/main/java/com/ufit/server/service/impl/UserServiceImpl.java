// src/main/java/com/ufit/server/service/impl/UserServiceImpl.java
package com.ufit.server.service.impl;

import com.ufit.server.dto.response.UserProfile;
import com.ufit.server.dto.request.ChangePasswordRequest;
import com.ufit.server.entity.User;
import com.ufit.server.repository.UserRepository;
import com.ufit.server.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class UserServiceImpl implements UserService {
    @Autowired private UserRepository userRepo;
    @Autowired private PasswordEncoder passwordEncoder;

    @Override
    public UserProfile getProfile(String username) {
        User u = userRepo.findByUsername(username)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return new UserProfile(
            u.getId(), u.getUsername(), u.getEmail(),
            u.getFirstName(), u.getLastName(),
            u.getPhone(), u.getAvatarUrl(),
            u.getHeight(), u.getWeight(), u.getAim(),
            u.isProfileCompleted()
        );
    }

    @Override
    public UserProfile updateProfile(String username, UserProfile updated) {
        User u = userRepo.findByUsername(username)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        u.setFirstName(updated.firstName());
        u.setLastName(updated.lastName());
        u.setPhone(updated.phone());
        u.setAvatarUrl(updated.avatarUrl());
        u.setHeight(updated.height());
        u.setWeight(updated.weight());
        u.setAim(updated.aim());
        u.setProfileCompleted(true);
        userRepo.save(u);
        return getProfile(username);
    }

    @Override
    public void changePassword(String username, ChangePasswordRequest request) {
        User user = userRepo.findByUsername(username)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
            
        // Verify current password
        if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }
        
        // Update password
        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepo.save(user);
    }
}
