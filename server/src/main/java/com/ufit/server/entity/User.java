package com.ufit.server.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    @NotEmpty(message = "Username không được để trống")
    private String username;

    @Column(unique = true, nullable = false)
    @Email(message = "Email không hợp lệ")
    @NotEmpty(message = "Email không được để trống")
    private String email;

    @Column(nullable = false)
    @NotEmpty(message = "Password không được để trống")
    private String password;

    @Column(nullable = false)
    private boolean active = true;

    @Column(nullable = false)
    private String role = "USER";

    //  // Lưu thẳng enum name, ví dụ "ROLE_USER"
    // @Enumerated(EnumType.STRING)
    // @Column(nullable = false)
    // private Role role = Role.ROLE_USER;

    // Profile fields
    private String firstName;   // Tên
    private String lastName;    // Họ
    private String phone;       // Số điện thoại
    private String avatarUrl;   // URL avatar
    private Double height;      // Chiều cao (cm)
    private Double weight;      // Cân nặng (kg)
    private String aim;         // Mục tiêu (lose_weight, gain_muscle, maintain)

    @Column(name = "google_id", unique = true)
    private String googleId;

    // Flag xem profile đã hoàn thiện chưa
    private boolean profileCompleted = false;

    // Helper method tính BMI, không lưu vào DB
    public Double getBmi() {
        if (height != null && weight != null && height > 0) {
            double heightM = height / 100.0;
            return weight / (heightM * heightM);
        }
        return null;
    }
}
