package com.ufit.server.service.impl;

import com.ufit.server.service.StorageService;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;

@Service
public class FileSystemStorageService implements StorageService {

    private final Path uploadDir = Paths.get("uploads");

    public FileSystemStorageService() {
        try {
            if (!Files.exists(uploadDir)) {
                Files.createDirectories(uploadDir);
            }
        } catch (IOException e) {
            throw new RuntimeException("Could not create upload directory", e);
        }
    }

    @Override
public String store(MultipartFile file) {
    // Lấy filename gốc, nếu null thì dùng "unknown"
    String original = file.getOriginalFilename();
    String raw = (original != null && !original.isBlank())
        ? StringUtils.cleanPath(original)
        : "unknown";

    String filename = System.currentTimeMillis() + "_" + raw;
    try {
        Path target = this.uploadDir.resolve(filename);
        Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
        return filename;
    } catch (IOException e) {
        throw new RuntimeException("Failed to store file " + filename, e);
    }
}

}
