package com.ufit.server.service.impl;

import com.ufit.server.dto.request.*;
import com.ufit.server.dto.response.AuthResponse;
import com.ufit.server.dto.response.JwtAuthResponse;
import com.ufit.server.entity.User;
import com.ufit.server.entity.Role;
import com.ufit.server.repository.UserRepository;
import com.ufit.server.security.jwt.JwtService;
import com.ufit.server.service.AuthService;
import com.ufit.server.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@Transactional
public class AuthServiceImpl implements AuthService {
    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private EmailService emailService;
    @Autowired private JwtService jwtService;

    private static class TokenInfo {
        private final String email;
        private final LocalDateTime expiry;
        public TokenInfo(String email, LocalDateTime expiry) {
            this.email = email;
            this.expiry = expiry;
        }
        public String getEmail() { return email; }
        public boolean isExpired() { return LocalDateTime.now().isAfter(expiry); }
    }
    private final Map<String, TokenInfo> tokenStorage = new HashMap<>();

    @Override
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Email already exists");
        }
        if (userRepository.existsByUsername(request.username())) {
            throw new IllegalArgumentException("Username already exists");
        }
        User user = new User();
        user.setUsername(request.username());
        user.setEmail(request.email());
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setActive(true);
        user.setRole(Role.ROLE_USER);
        User saved = userRepository.save(user);
        return new AuthResponse(saved.getId(), saved.getUsername(), saved.getEmail(), "Registration successful");
    }

    @Override
    public JwtAuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
            .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));
        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new IllegalArgumentException("Invalid email or password");
        }
        if (!user.isActive()) {
            throw new IllegalArgumentException("Account is not active");
        }
        String token = jwtService.generateToken(user.getUsername());
        long expiresAt = jwtService.getExpirationTime(token);
        return new JwtAuthResponse(
            user.getId(),
            user.getUsername(),
            user.getEmail(),
            token,
            user.getRole().name().replace("ROLE_", ""),
            expiresAt,
            "Login successful"
        );
    }

    @Override
    public void sendResetToken(String email) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new IllegalArgumentException("Email not found"));
        String token = UUID.randomUUID().toString();
        LocalDateTime expiry = LocalDateTime.now().plus(24, ChronoUnit.HOURS);
        tokenStorage.put(token, new TokenInfo(user.getEmail(), expiry));
        String link = "http://your-domain.com/reset-password?token=" + token;
        emailService.sendResetLink(email, link);
    }

    @Override
    public void resetPassword(String token, String newPassword) {
        TokenInfo info = tokenStorage.get(token);
        if (info == null || info.isExpired()) {
            tokenStorage.remove(token);
            throw new IllegalArgumentException("Token is invalid or expired");
        }
        User user = userRepository.findByEmail(info.getEmail())
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        tokenStorage.remove(token);
    }

    @Override
    public JwtAuthResponse googleLogin(GoogleAuthRequest req) {
        User user = userRepository.findByGoogleId(req.googleId())
            .orElseGet(() -> {
                User u = new User();
                u.setUsername(req.email().split("@")[0]);
                u.setEmail(req.email());
                u.setGoogleId(req.googleId());
                u.setActive(true);
                u.setRole(Role.ROLE_USER);
                return userRepository.save(u);
            });
        String token = jwtService.generateToken(user.getUsername());
        long expiresAt = jwtService.getExpirationTime(token);
        return new JwtAuthResponse(
            user.getId(),
            user.getUsername(),
            user.getEmail(),
            token,
            user.getRole().name().replace("ROLE_", ""),
            expiresAt,
            "Google login successful"
        );
    }
}