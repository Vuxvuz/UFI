package com.ufit.server.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.ufit.server.entity.User;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    boolean existsByEmail(String email);
    boolean existsByUsername(String username);
    
    Optional<User> findByEmail(String email);
    Optional<User> findByUsername(String username);
    // Thêm phương thức cho Google ID:
    Optional<User> findByGoogleId(String googleId);
}