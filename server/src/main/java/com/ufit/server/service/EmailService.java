package com.ufit.server.service;

public interface EmailService {
    void sendEmail(String to, String subject, String content);
    void sendResetLink(String email, String resetLink);
    // Các phương thức gửi email khác nếu cần
}