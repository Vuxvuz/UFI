package com.ufit.server.service.impl;

import com.ufit.server.dto.request.ProfileUpdateRequest;
import com.ufit.server.dto.response.ProfileResponse;
import com.ufit.server.entity.User;
import com.ufit.server.repository.UserRepository;
import com.ufit.server.service.ProfileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ProfileServiceImpl implements ProfileService {

    @Autowired
    private UserRepository userRepository;

    @Override
    public ProfileResponse getProfile(String username) {
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new IllegalArgumentException("User không tồn tại"));
        return mapToResponse(user);
    }

    @Override
    public ProfileResponse updateProfile(String username, ProfileUpdateRequest request) {
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new IllegalArgumentException("User không tồn tại"));

        // Cập nhật thông tin
        user.setFirstName(request.firstName());
        user.setLastName(request.lastName());
        user.setPhone(request.phone());
        user.setAvatarUrl(request.avatarUrl());
        user.setHeight(request.height());
        user.setWeight(request.weight());
        user.setAim(request.aim());

        // Đánh dấu profileCompleted nếu đã đầy đủ
        boolean complete = user.getFirstName() != null
                        && user.getLastName()  != null
                        && user.getPhone()     != null
                        && user.getHeight()    != null
                        && user.getWeight()    != null
                        && user.getAim()       != null;
        user.setProfileCompleted(complete);

        // Lưu vào DB
        userRepository.save(user);

        return mapToResponse(user);
    }

    private ProfileResponse mapToResponse(User user) {
        // getBmi() sẽ tính dựa trên height & weight
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
            user.getBmi(),              // gọi getBmi()
            user.isActive(),
            user.isProfileCompleted()
        );
    }
}
