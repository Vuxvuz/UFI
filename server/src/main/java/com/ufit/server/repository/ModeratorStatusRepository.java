package com.ufit.server.repository;

import com.ufit.server.entity.ModeratorStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ModeratorStatusRepository extends JpaRepository<ModeratorStatus, Long> {
    List<ModeratorStatus> findByIsOnlineTrue();
}