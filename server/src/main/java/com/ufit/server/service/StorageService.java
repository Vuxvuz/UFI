package com.ufit.server.service;

import org.springframework.web.multipart.MultipartFile;

public interface StorageService {
    /**
     * Lưu MultipartFile vào thư mục 'uploads/' và trả về tên file đã lưu.
     */
    String store(MultipartFile file);
}
