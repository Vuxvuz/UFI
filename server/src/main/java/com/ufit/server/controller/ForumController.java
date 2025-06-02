package com.ufit.server.controller;

import com.ufit.server.dto.request.ReplyRequest;
import com.ufit.server.dto.request.VoteRequest;
import com.ufit.server.dto.response.*;
import com.ufit.server.entity.*;
import com.ufit.server.repository.*;
import com.ufit.server.service.*;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@CrossOrigin(origins = "http://localhost:3000")
@RequestMapping("/api/forum")
public class ForumController {

    @Autowired private ForumTopicRepository topicRepo;
    @Autowired private ForumPostRepository postRepo;
    @Autowired private ForumVoteRepository voteRepository;
    @Autowired private VoteService voteService;
    @Autowired private StorageService storageService;
    @Autowired private CategoryService categoryService;
    @Autowired private ReportService reportService;  // thêm reportService

    @GetMapping("/forum-categories")
    public ResponseEntity<ApiResponse<List<CategoryDto>>> listCategories() {
        try {
            List<Category> categories = categoryService.getAllCategories();
            List<CategoryDto> categoryDtos = categories.stream()
                .map(cat -> new CategoryDto(cat.getId(), cat.getName()))
                .collect(Collectors.toList());
            return ResponseEntity.ok(new ApiResponse<>("SUCCESS", "Categories retrieved", categoryDtos));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiResponse<>("ERROR", e.getMessage(), null));
        }
    }

    @PostMapping("/topics/{topicId}/posts")
    public ResponseEntity<ApiResponse<PostResponse>> createTopLevelPost(
        @PathVariable Long topicId,
        @RequestParam String content,
        @RequestParam(required = false) MultipartFile image,
        Principal principal
    ) {
        ForumTopic topic = topicRepo.findById(topicId)
            .orElseThrow(() -> new IllegalArgumentException("Topic not found"));

        ForumPost post = new ForumPost();
        post.setTopic(topic);
        post.setAuthor(principal.getName());
        post.setContent(content);

        if (image != null && !image.isEmpty()) {
            String imageUrl = storageService.store(image);
            post.setImageUrl(imageUrl);
        }

        ForumPost savedPost = postRepo.save(post);
        PostResponse response = mapReplyLevel(savedPost, principal.getName(), 1);
        return ResponseEntity.ok(new ApiResponse<>("SUCCESS", "Post created successfully", response));
    }

    @GetMapping("/topics")
    public ResponseEntity<ApiResponse<List<TopicResponse>>> getTopics(@RequestParam(required = false) String category) {
        try {
            List<ForumTopic> topics = (category != null && !category.equalsIgnoreCase("ALL"))
                ? topicRepo.findByCategory_NameIgnoreCase(category)
                : topicRepo.findAll();

            List<TopicResponse> topicResponses = topics.stream()
                .map(topic -> {
                    CategoryDto categoryDto = topic.getCategory() != null
                        ? new CategoryDto(topic.getCategory().getId(), topic.getCategory().getName())
                        : null;

                    int upvotes = voteRepository.countByPostIdAndIsUpvote(topic.getId(), true);
                    int downvotes = voteRepository.countByPostIdAndIsUpvote(topic.getId(), false);

                    return new TopicResponse(
                        topic.getId(),
                        topic.getTitle(),
                        topic.getAuthor(),
                        topic.getCreatedAt(),
                        categoryDto,
                        upvotes,
                        downvotes,
                        null,
                        null
                    );
                })
                .collect(Collectors.toList());

            return ResponseEntity.ok(new ApiResponse<>("SUCCESS", "Topics retrieved successfully", topicResponses));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>("ERROR", e.getMessage(), null));
        }
    }

    @GetMapping("/topics/{id}")
    public ResponseEntity<ApiResponse<TopicResponse>> getTopic(@PathVariable Long id, Principal principal) {
        try {
            ForumTopic topic = topicRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Topic not found with id: " + id));

            CategoryDto categoryDto = topic.getCategory() != null
                ? new CategoryDto(topic.getCategory().getId(), topic.getCategory().getName())
                : null;

            int upvotes = voteRepository.countByPostIdAndIsUpvote(topic.getId(), true);
            int downvotes = voteRepository.countByPostIdAndIsUpvote(topic.getId(), false);

            Boolean userVoteIsUpvote = null;
            if (principal != null) {
                Optional<ForumVote> userVote = voteRepository.findByPostIdAndUsername(topic.getId(), principal.getName());
                userVoteIsUpvote = userVote.map(ForumVote::isUpvote).orElse(null);
            }

            List<ForumPost> posts = postRepo.findByTopicIdAndParentPostIsNull(id);
            List<PostResponse> postResponses = posts.stream()
                .map(p -> mapReplyLevel(p, principal != null ? principal.getName() : null, 1))
                .collect(Collectors.toList());

            TopicResponse response = new TopicResponse(
                topic.getId(),
                topic.getTitle(),
                topic.getAuthor(),
                topic.getCreatedAt(),
                categoryDto,
                upvotes,
                downvotes,
                userVoteIsUpvote,
                postResponses
            );

            return ResponseEntity.ok(new ApiResponse<>("SUCCESS", "Topic retrieved successfully", response));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>("ERROR", e.getMessage(), null));
        }
    }

    @PostMapping("/posts/{postId}/reply")
    public ResponseEntity<ApiResponse<PostResponse>> replyToPost(
        @PathVariable Long postId,
        @RequestBody ReplyRequest replyRequest,
        Principal principal
    ) {
        String content = replyRequest.getContent();

        ForumPost parentPost = postRepo.findById(postId)
            .orElseThrow(() -> new IllegalArgumentException("Parent post not found"));

        int level = 1;
        ForumPost current = parentPost;
        while (current.getParentPost() != null) {
            current = current.getParentPost();
            level++;
        }
        if (level >= 3) {
            throw new IllegalArgumentException("Replies only allowed up to 3 levels");
        }

        ForumPost reply = new ForumPost();
        reply.setTopic(parentPost.getTopic());
        reply.setParentPost(parentPost);
        reply.setAuthor(principal.getName());
        reply.setContent(content);

        ForumPost savedReply = postRepo.save(reply);
        PostResponse response = mapReplyLevel(savedReply, principal.getName(), level + 1);
        return ResponseEntity.ok(new ApiResponse<>("SUCCESS", "Reply created successfully", response));
    }

    @PostMapping("/posts/{postId}/vote")
    public ResponseEntity<ApiResponse<String>> voteOnPost(
        @PathVariable Long postId,
        @RequestBody VoteRequest voteRequest,
        Principal principal
    ) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ApiResponse<>("ERROR", "Unauthorized", null));
        }

        try {
            voteService.processVote(postId, principal.getName(), voteRequest.isUpvote());
            return ResponseEntity.ok(new ApiResponse<>("SUCCESS", "Vote processed successfully", null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiResponse<>("ERROR", e.getMessage(), null));
        }
    }

    /**
     * Endpoint mới: User report post
     * POST /api/forum/posts/{postId}/report
     * Chỉ user đã xác thực (ROLE_USER or higher) mới gọi được.
     */
    @PostMapping("/posts/{postId}/report")
    public ResponseEntity<ApiResponse<String>> reportPost(
        @PathVariable Long postId,
        @RequestBody(required = false) ReportRequest reportRequest,
        Principal principal
    ) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ApiResponse<>("ERROR", "Unauthorized", null));
        }
        String reason = (reportRequest != null ? reportRequest.getReason() : null);
        reportService.reportPost(postId, reason, principal.getName());
        return ResponseEntity.ok(new ApiResponse<>("SUCCESS", "Report submitted successfully", null));
    }

    // DTO cho phần body khi report (nếu muốn kèm lý do)
    public static class ReportRequest {
        private String reason;
        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
    }

    // Hàm helper để map reply levels (giữ nguyên)
    private PostResponse mapReplyLevel(ForumPost reply, String username, int level) {
        Optional<ForumVote> userVote = voteRepository.findByPostIdAndUsername(reply.getId(), username);

        List<PostResponse> nestedReplies = new ArrayList<>();
        if (level < 3 && reply.getReplies() != null) {
            nestedReplies = reply.getReplies().stream()
                .map(r -> mapReplyLevel(r, username, level + 1))
                .collect(Collectors.toList());
        }

        return new PostResponse(
            reply.getId(),
            reply.getAuthor(),
            reply.getContent(),
            reply.getCreatedAt(),
            reply.getImageUrl(),
            reply.getUpvotes(),
            reply.getDownvotes(),
            reply.getParentPost() != null ? reply.getParentPost().getId() : null,
            nestedReplies,
            userVote.isPresent(),
            userVote.map(ForumVote::isUpvote).orElse(null),
            reply.getReplies().size()
        );
    }
}
