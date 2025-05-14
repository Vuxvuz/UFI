package com.ufit.server.service.impl;

import com.ufit.server.dto.request.ProfileUpdateRequest;
import com.ufit.server.dto.response.ProfileResponse;
import com.ufit.server.entity.User;
import com.ufit.server.repository.UserRepository;
import com.ufit.server.service.ProfileService;
import org.springframework.stereotype.Service;

@Service
public class ProfileServiceImpl implements ProfileService {

    private final UserRepository userRepository;

    public ProfileServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public ProfileResponse getProfile(String username) {
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new IllegalArgumentException("User not found: " + username));
        return new ProfileResponse(
            user.getId(),
            user.getUsername(),
            user.getEmail(),
            user.getFirstName(),
            user.getLastName(),
            user.getPhone(),
            user.getAvatarUrl(),
            user.getHeight(),
            user.getWeight(),
            user.getAim(),
            user.getBmi(),
            user.isActive(), // Chỉ truyền active
            user.isProfileCompleted()
        );
    }

    @Override
    public ProfileResponse updateProfile(String username, ProfileUpdateRequest request) {
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new IllegalArgumentException("User not found: " + username));

        // Cập nhật các trường từ request
        if (request.firstName() != null) user.setFirstName(request.firstName());
        if (request.lastName() != null) user.setLastName(request.lastName());
        if (request.phone() != null) user.setPhone(request.phone());
        if (request.avatarUrl() != null) user.setAvatarUrl(request.avatarUrl());
        if (request.height() != null) user.setHeight(request.height());
        if (request.weight() != null) user.setWeight(request.weight());
        if (request.aim() != null) user.setAim(request.aim());

        // Tính toán BMI (giả định)
        // if (user.getHeight() != null && user.getWeight() != null) {
        //     double bmi = user.getWeight() / (user.getHeight() * user.getHeight()); // Công thức đơn giản
        //     user.setBmi(bmi);
        // }

        // Kiểm tra profile hoàn thiện
        boolean profileCompleted = user.getFirstName() != null &&
                                   user.getLastName() != null &&
                                   user.getHeight() != null &&
                                   user.getWeight() != null &&
                                   user.getAim() != null;
        user.setProfileCompleted(profileCompleted);

        // Lưu user
        userRepository.save(user);

        // Trả về ProfileResponse mới
        return new ProfileResponse(
            user.getId(),
            user.getUsername(),
            user.getEmail(),
            user.getFirstName(),
            user.getLastName(),
            user.getPhone(),
            user.getAvatarUrl(),
            user.getHeight(),
            user.getWeight(),
            user.getAim(),
            user.getBmi(),
            user.isActive(),
            user.isProfileCompleted()
        );
    }
}