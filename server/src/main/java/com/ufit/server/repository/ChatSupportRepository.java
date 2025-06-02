package com.ufit.server.repository;

import com.ufit.server.entity.ChatSupport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository cấp phép CRUD + query cơ bản cho entity ChatSupport.
 */
@Repository
public interface ChatSupportRepository extends JpaRepository<ChatSupport, Long> {
    // JpaRepository đã cung cấp findAll(), save(), v.v.
}
