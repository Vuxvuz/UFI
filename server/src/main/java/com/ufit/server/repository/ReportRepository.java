package com.ufit.server.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.ufit.server.entity.Report;
import java.util.List;
import com.ufit.server.entity.ReportStatus;

public interface ReportRepository extends JpaRepository<Report, Long> {
    List<Report> findByStatus(ReportStatus status);
    
}
