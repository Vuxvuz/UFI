package com.ufit.server.entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import com.ufit.server.entity.Report;

public enum ReportStatus {
    PENDING,
    REVIEWED,
    IGNORED
}
