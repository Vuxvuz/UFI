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

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role = Role.ROLE_USER;

    // Thông tin profile
    private String firstName;
    private String lastName;
    private String phone;
    private String avatarUrl;
    private Double height;
    private Double weight;
    private String aim;
    private String googleId;
    private boolean profileCompleted = false;
// entity/Role.javapublic enum Role { ROLE_USER, ROLE_STAFF, ROLE_ADMIN, ROLE_DEV }
    public Double getBmi() {
        if (height != null && weight != null && height > 0) {
            double h = height / 100.0;
            return weight / (h * h);
        }
        return null;
    }
}