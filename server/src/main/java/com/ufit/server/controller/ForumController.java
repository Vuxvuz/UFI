package com.ufit.server.controller;

import com.ufit.server.dto.request.ReplyRequest;
import com.ufit.server.dto.request.VoteRequest;
import com.ufit.server.dto.response.ApiResponse;
import com.ufit.server.dto.response.CategoryDto;
import com.ufit.server.dto.response.PostResponse;
import com.ufit.server.dto.response.TopicResponse;
import com.ufit.server.entity.Category;
import com.ufit.server.entity.ForumPost;
import com.ufit.server.entity.ForumTopic;
import com.ufit.server.entity.ForumVote;
import com.ufit.server.entity.User;
import com.ufit.server.repository.ForumPostRepository;
import com.ufit.server.repository.ForumTopicRepository;
import com.ufit.server.repository.ForumVoteRepository;
import com.ufit.server.repository.UserRepository;
import com.ufit.server.service.CategoryService;
import com.ufit.server.service.ReportService;
import com.ufit.server.service.StorageService;
import com.ufit.server.service.VoteService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.ufit.server.dto.request.TopicRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.security.Principal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.time.LocalDateTime;

@RestController
@CrossOrigin(origins = "http://localhost:3000")
@RequestMapping("/api/forum")
public class ForumController {

    private static final Logger logger = LoggerFactory.getLogger(ForumController.class);

    @Autowired private ForumTopicRepository topicRepo;
    @Autowired private ForumPostRepository postRepo;
    @Autowired private ForumVoteRepository voteRepository;
    @Autowired private VoteService voteService;
    @Autowired private StorageService storageService;
    @Autowired private CategoryService categoryService;
    @Autowired private ReportService reportService;
    @Autowired private UserRepository userRepository;

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
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ApiResponse<>("ERROR", "Unauthorized", null));
        }

        try {
            ForumTopic topic = topicRepo.findById(topicId)
                .orElseThrow(() -> new IllegalArgumentException("Topic not found"));
            
            // Kiểm tra nếu topic đã bị khóa
            if (topic.isLocked()) {
                User user = userRepository.findByUsername(principal.getName())
                    .orElseThrow(() -> new IllegalArgumentException("User not found"));
                    
                // Chỉ cho phép admin reply vào topic đã khóa
                if (!user.getRole().name().equals("ROLE_ADMIN")) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(new ApiResponse<>("ERROR", "This topic is locked", null));
                }
            }

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
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiResponse<>("ERROR", e.getMessage(), null));
        }
    }

    @GetMapping("/topics")
    public ResponseEntity<ApiResponse<List<TopicResponse>>> getTopics(@RequestParam(required = false) String category, Principal principal) {
        try {
            List<ForumTopic> topics = (category != null && !category.equalsIgnoreCase("ALL"))
                ? topicRepo.findByCategory_NameIgnoreCase(category)
                : topicRepo.findAll();

            List<TopicResponse> topicResponses = topics.stream()
                .map(topic -> {
                    CategoryDto categoryDto = topic.getCategory() != null
                        ? new CategoryDto(topic.getCategory().getId(), topic.getCategory().getName())
                        : null;

                    Boolean userVoteIsUpvote = null;
                    if (principal != null) {
                        Optional<ForumVote> userVote = voteRepository.findByTopicIdAndUsername(topic.getId(), principal.getName());
                        userVoteIsUpvote = userVote.map(ForumVote::isUpvote).orElse(null);
                    }

                    return new TopicResponse(
                        topic.getId(),
                        topic.getTitle(),
                        topic.getAuthor(),
                        topic.getCreatedAt(),
                        categoryDto,
                        topic.getUpvotes(),
                        topic.getDownvotes(),
                        userVoteIsUpvote,
                        null
                    );
                })
                .collect(Collectors.toList());

            return ResponseEntity.ok(new ApiResponse<>("SUCCESS", "Topics retrieved successfully", topicResponses));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>("ERROR", e.getMessage(), null));
        }
    }

    @PostMapping("/topics")
    public ResponseEntity<ApiResponse<TopicResponse>> createTopic(@RequestBody TopicRequest request, Principal principal) {
        try {
            Category category = categoryService.getAllCategories().stream()
                .filter(c -> c.getName().equals(request.category().getName()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Invalid category: " + request.category().getName()));

            ForumTopic topic = new ForumTopic();
            topic.setTitle(request.title());
            topic.setCategory(category);
            topic.setAuthor(principal.getName());

            ForumTopic savedTopic = topicRepo.save(topic);
            CategoryDto categoryDto = new CategoryDto(savedTopic.getCategory().getId(), savedTopic.getCategory().getName());

            TopicResponse response = new TopicResponse(
                savedTopic.getId(),
                savedTopic.getTitle(),
                savedTopic.getAuthor(),
                savedTopic.getCreatedAt(),
                categoryDto,
                0,
                0,
                null,
                new ArrayList<>()
            );

            return ResponseEntity.ok(new ApiResponse<>("SUCCESS", "Topic created successfully", response));
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

            Boolean userVoteIsUpvote = null;
            if (principal != null) {
                Optional<ForumVote> userVote = voteRepository.findByTopicIdAndUsername(topic.getId(), principal.getName());
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
                topic.getUpvotes(),
                topic.getDownvotes(),
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

    @PostMapping("/{entityType}/{entityId}/vote")
    public ResponseEntity<ApiResponse<VoteResponse>> voteOnEntity(
        @PathVariable String entityType,
        @PathVariable Long entityId,
        @RequestBody VoteRequest voteRequest,
        Principal principal
    ) {
        logger.info("Received VoteRequest: isUpvote = {}", voteRequest.isUpvote()); //debug
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ApiResponse<>("ERROR", "Unauthorized", null));
        }
        try {
            ForumVote vote = voteService.processVote(entityId, principal.getName(), voteRequest.isUpvote(), entityType.toUpperCase());
            VoteResponse response = new VoteResponse();
            if (vote != null) {
                response.setVoteId(vote.getId());
                response.setUpvote(vote.isUpvote());
                response.setEntityId(entityId);
                response.setEntityType(entityType.toUpperCase());
                if ("POST".equalsIgnoreCase(entityType)) {
                    ForumPost post = postRepo.findById(entityId)
                        .orElseThrow(() -> new IllegalArgumentException("Post not found"));
                    response.setUpvotes(post.getUpvotes());
                    response.setDownvotes(post.getDownvotes());
                } else if ("TOPIC".equalsIgnoreCase(entityType)) {
                    ForumTopic topic = topicRepo.findById(entityId)
                        .orElseThrow(() -> new IllegalArgumentException("Topic not found"));
                    response.setUpvotes(topic.getUpvotes());
                    response.setDownvotes(topic.getDownvotes());
                }
            } else {
                // Vote was removed
                response.setEntityId(entityId);
                response.setEntityType(entityType.toUpperCase());
                if ("POST".equalsIgnoreCase(entityType)) {
                    ForumPost post = postRepo.findById(entityId)
                        .orElseThrow(() -> new IllegalArgumentException("Post not found"));
                    response.setUpvotes(post.getUpvotes());
                    response.setDownvotes(post.getDownvotes());
                } else if ("TOPIC".equalsIgnoreCase(entityType)) {
                    ForumTopic topic = topicRepo.findById(entityId)
                        .orElseThrow(() -> new IllegalArgumentException("Topic not found"));
                    response.setUpvotes(topic.getUpvotes());
                    response.setDownvotes(topic.getDownvotes());
                }
            }
            return ResponseEntity.ok(new ApiResponse<>("SUCCESS", "Vote processed successfully", response));
        } catch (IllegalArgumentException e) {
            logger.error("Invalid request for voting: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiResponse<>("ERROR", e.getMessage(), null));
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            logger.error("Database integrity error when voting: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ApiResponse<>("ERROR", "Database constraint violation. The vote record may be in an inconsistent state.", null));
        } catch (org.springframework.dao.EmptyResultDataAccessException e) {
            logger.error("Failed to find or delete vote record: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ApiResponse<>("ERROR", "Vote record not found or already deleted", null));
        } catch (Exception e) {
            logger.error("Unexpected error during voting: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiResponse<>("ERROR", "An unexpected error occurred: " + e.getMessage(), null));
        }
    }

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

    @PostMapping("/articles/{articleId}/report")
    public ResponseEntity<ApiResponse<String>> reportArticle(
        @PathVariable Long articleId,
        @RequestBody(required = false) ReportRequest reportRequest,
        Principal principal
    ) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ApiResponse<>("ERROR", "Unauthorized", null));
        }
        String reason = (reportRequest != null ? reportRequest.getReason() : null);
        reportService.reportArticle(articleId, reason, principal.getName());
        return ResponseEntity.ok(new ApiResponse<>("SUCCESS", "Report submitted successfully", null));
    }

    @DeleteMapping("/topics/{id}")
    public ResponseEntity<ApiResponse<String>> deleteTopic(@PathVariable Long id) {
        try {
            ForumTopic topic = topicRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Topic not found with id: " + id));
            
            // Delete all posts associated with the topic first
            List<ForumPost> posts = postRepo.findByTopicId(id);
            if (!posts.isEmpty()) {
                postRepo.deleteAll(posts);
            }
            
            // Delete the topic
            topicRepo.delete(topic);
            
            return ResponseEntity.ok(new ApiResponse<>("SUCCESS", "Topic deleted successfully", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>("ERROR", e.getMessage(), null));
        }
    }

    @PostMapping("/topics/{topicId}/toggle-lock")
    public ResponseEntity<ApiResponse<String>> toggleTopicLock(
        @PathVariable Long topicId,
        Principal principal
    ) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ApiResponse<>("ERROR", "Unauthorized", null));
        }

        try {
            ForumTopic topic = topicRepo.findById(topicId)
                .orElseThrow(() -> new IllegalArgumentException("Topic not found"));
            
            User user = userRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
            
            // Chỉ cho phép author hoặc mod/admin toggle lock
            boolean isAuthor = topic.getAuthor().equals(principal.getName());
            boolean isModOrAdmin = user.getRole().name().contains("MODERATOR") || 
                                 user.getRole().name().contains("ADMIN");
                                 
            if (!isAuthor && !isModOrAdmin) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ApiResponse<>("ERROR", "Only topic author or moderators can lock/unlock topics", null));
            }

            // Toggle lock status
            topic.setLocked(!topic.isLocked());
            topic.setLockedBy(user);
            topic.setLockedAt(LocalDateTime.now());
            
            topicRepo.save(topic);
            
            String message = topic.isLocked() ? "Topic locked successfully" : "Topic unlocked successfully";
            return ResponseEntity.ok(new ApiResponse<>("SUCCESS", message, null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiResponse<>("ERROR", e.getMessage(), null));
        }
    }

    public static class ReportRequest {
        private String reason;
        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
    }

    public static class VoteResponse {
        private Long voteId;
        
        @JsonProperty("isUpvote")
        private Boolean upvote;
        
        private Long entityId;
        private String entityType;
        private Integer upvotes;
        private Integer downvotes;
    
        public Long getVoteId() { return voteId; }
        public void setVoteId(Long voteId) { this.voteId = voteId; }
        
        public Boolean isUpvote() { return upvote; }
        public void setUpvote(Boolean upvote) { this.upvote = upvote; }
        
        public Long getEntityId() { return entityId; }
        public void setEntityId(Long entityId) { this.entityId = entityId; }
        public String getEntityType() { return entityType; }
        public void setEntityType(String entityType) { this.entityType = entityType; }
        public Integer getUpvotes() { return upvotes; }
        public void setUpvotes(Integer upvotes) { this.upvotes = upvotes; }
        public Integer getDownvotes() { return downvotes; }
        public void setDownvotes(Integer downvotes) { this.downvotes = downvotes; }
    }
    
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
