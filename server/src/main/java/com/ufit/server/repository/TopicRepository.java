package com.ufit.server.repository;

import com.ufit.server.entity.Topic;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository cấp phép CRUD + query cơ bản cho entity Topic.
 */
@Repository
public interface TopicRepository extends JpaRepository<Topic, Long> {
    // hiện tại chưa cần thêm phương thức custom, JpaRepository đã cung cấp findAll(), save(), findById(), deleteById(), ...
}
