package com.ufit.server.repository;

import com.ufit.server.entity.Notification;
import com.ufit.server.entity.Notification.NotificationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    
    // Lấy notifications của user với phân trang
    Page<Notification> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
    
    // Lấy notifications chưa đọc của user
    List<Notification> findByUserIdAndStatusOrderByCreatedAtDesc(Long userId, NotificationStatus status);
    
    // Đếm số notifications chưa đọc
    long countByUserIdAndStatus(Long userId, NotificationStatus status);
    
    // Đánh dấu tất cả notifications của user là đã đọc
    @Modifying
    @Query("UPDATE Notification n SET n.status = :status, n.readAt = CURRENT_TIMESTAMP WHERE n.user.id = :userId AND n.status = 'UNREAD'")
    void markAllAsRead(@Param("userId") Long userId, @Param("status") NotificationStatus status);
    
    // Đánh dấu một notification là đã đọc
    @Modifying
    @Query("UPDATE Notification n SET n.status = :status, n.readAt = CURRENT_TIMESTAMP WHERE n.id = :notificationId")
    void markAsRead(@Param("notificationId") Long notificationId, @Param("status") NotificationStatus status);
    
    // Xóa notifications cũ (older than X days)
    @Modifying
    @Query("DELETE FROM Notification n WHERE n.createdAt < :cutoffDate")
    void deleteOldNotifications(@Param("cutoffDate") java.time.LocalDateTime cutoffDate);
} 