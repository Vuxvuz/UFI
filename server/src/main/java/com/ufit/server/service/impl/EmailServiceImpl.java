package com.ufit.server.service.impl;

import com.ufit.server.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailServiceImpl implements EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Override
    public void sendEmail(String to, String subject, String content) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject(subject);
        message.setText(content);
        mailSender.send(message);
    }

    @Override
    public void sendResetLink(String email, String resetLink) {
        String subject = "Đặt lại mật khẩu";
        String content = "Chào bạn,\n\n" +
                "Vui lòng click vào link bên dưới để đặt lại mật khẩu của bạn:\n\n" +
                resetLink + "\n\n" +
                "Link này sẽ hết hạn sau 24 giờ.\n\n" +
                "Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.";
        
        sendEmail(email, subject, content);
    }
}