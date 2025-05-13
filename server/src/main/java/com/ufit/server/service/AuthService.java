package com.ufit.server.service;

import com.ufit.server.dto.response.AuthResponse;
import com.ufit.server.dto.response.JwtAuthResponse;
import com.ufit.server.dto.request.GoogleAuthRequest;
import com.ufit.server.dto.request.LoginRequest;
import com.ufit.server.dto.request.RegisterRequest;

public interface AuthService {
    AuthResponse register(RegisterRequest request);
    // AuthResponse login(LoginRequest request);
    void sendResetToken(String email);
    void resetPassword(String token, String newPassword);
    JwtAuthResponse googleLogin(GoogleAuthRequest request);
    JwtAuthResponse login(LoginRequest request);  
}
