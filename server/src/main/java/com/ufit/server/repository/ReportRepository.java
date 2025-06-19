package com.ufit.server.repository;

import com.ufit.server.entity.Report;
import com.ufit.server.entity.Report.ReportStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReportRepository extends JpaRepository<Report, Long> {
    // For backward compatibility
    List<Report> findByStatus(ReportStatus status);
    
    // New paginated methods
    Page<Report> findByStatus(ReportStatus status, Pageable pageable);
}
