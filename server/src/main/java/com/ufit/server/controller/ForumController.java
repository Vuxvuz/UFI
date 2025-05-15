// server/src/main/java/com/ufit/server/controller/ForumController.java
package com.ufit.server.controller;

import com.ufit.server.dto.request.TopicRequest;
import com.ufit.server.dto.response.TopicResponse;
import com.ufit.server.dto.response.PostResponse;
import com.ufit.server.entity.ForumTopic;
import com.ufit.server.entity.ForumPost;
import com.ufit.server.entity.Category;
import com.ufit.server.repository.ForumTopicRepository;
import com.ufit.server.repository.ForumPostRepository;
import com.ufit.server.service.StorageService;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@CrossOrigin(origins = "http://localhost:3000")
@RequestMapping("/api/forum")
public class ForumController {

    private final ForumTopicRepository topicRepo;
    private final ForumPostRepository postRepo;
    private final StorageService storageService;

    public ForumController(ForumTopicRepository topicRepo,
                           ForumPostRepository postRepo,
                           StorageService storageService) {
        this.topicRepo      = topicRepo;
        this.postRepo       = postRepo;
        this.storageService = storageService;
    }

    // 1) List topics (có thể filter theo category)
    @GetMapping("/topics")
    public List<TopicResponse> listTopics(
        @RequestParam(required = false) Category category
    ) {
        return topicRepo.findAll().stream()
            .filter(t -> category == null || t.getCategory() == category)
            .map(t -> new TopicResponse(
                t.getId(),
                t.getTitle(),
                t.getAuthor(),
                t.getCreatedAt(),
                t.getCategory()
            ))
            .collect(Collectors.toList());
    }

    // 2) Create topic mới
    @PostMapping("/topics")
    public TopicResponse createTopic(
        @RequestBody TopicRequest req,
        Principal principal
    ) {
        ForumTopic t = new ForumTopic();
        t.setTitle(req.title());
        t.setAuthor(principal.getName());
        t.setCategory(req.category());
        ForumTopic saved = topicRepo.save(t);
        return new TopicResponse(
            saved.getId(),
            saved.getTitle(),
            saved.getAuthor(),
            saved.getCreatedAt(),
            saved.getCategory()
        );
    }

    // 3) List posts của một topic
    @GetMapping("/topics/{topicId}/posts")
    public List<PostResponse> listPosts(@PathVariable Long topicId) {
        return postRepo.findByTopicId(topicId).stream()
            .map(p -> new PostResponse(
                p.getId(),
                p.getAuthor(),
                p.getContent(),
                p.getCreatedAt(),
                p.getImageUrl()
            ))
            .collect(Collectors.toList());
    }

    // 4) Create post (multipart/form-data: content + optional image)
    @PostMapping(
      value = "/topics/{topicId}/posts",
      consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public PostResponse createPost(
        @PathVariable Long topicId,
        @RequestPart("content") String content,
        @RequestPart(value = "image", required = false) MultipartFile image,
        Principal principal
    ) {
        // 1) Lấy topic
        ForumTopic topic = topicRepo.findById(topicId)
            .orElseThrow(() -> new IllegalArgumentException("Topic not found"));

        // 2) Tạo post mới
        ForumPost p = new ForumPost();
        p.setTopic(topic);
        p.setContent(content);
        p.setAuthor(principal.getName());

        // 3) Nếu có image, lưu qua StorageService và set URL
        if (image != null && !image.isEmpty()) {
            try {
                String filename = storageService.store(image);
                // --> lưu vào :uploads/<filename>
                p.setImageUrl("/uploads/" + filename);
            } catch (Exception ex) {
                // Nếu lưu thất bại, bỏ qua image (hoặc có thể ném 1 BadRequest)
                throw new RuntimeException("Failed to store image", ex);
            }
        }

        // 4) Lưu vào DB
        ForumPost saved = postRepo.save(p);

        // 5) Trả về DTO
        return new PostResponse(
            saved.getId(),
            saved.getAuthor(),
            saved.getContent(),
            saved.getCreatedAt(),
            saved.getImageUrl()
        );
    }

}
