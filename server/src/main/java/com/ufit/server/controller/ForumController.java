package com.ufit.server.controller;

import com.ufit.server.dto.request.TopicRequest;
import com.ufit.server.dto.request.VoteRequest;
import com.ufit.server.dto.response.ApiResponse;
import com.ufit.server.dto.response.TopicResponse;
import com.ufit.server.dto.response.PostResponse;
import com.ufit.server.dto.response.CategoryDto;
import com.ufit.server.entity.ForumTopic;
import com.ufit.server.entity.ForumPost;
import com.ufit.server.entity.Category;
import com.ufit.server.entity.ForumVote;
import com.ufit.server.repository.ForumTopicRepository;
import com.ufit.server.repository.ForumPostRepository;
import com.ufit.server.repository.ForumVoteRepository;
import com.ufit.server.service.StorageService;
import com.ufit.server.service.VoteService;
import com.ufit.server.service.CategoryService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.http.HttpStatus;

import java.security.Principal;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.ArrayList;
import java.time.LocalDateTime;

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

    @GetMapping("/topics")
    public ResponseEntity<ApiResponse<List<TopicResponse>>> getTopics() {
        try {
            List<ForumTopic> topics = topicRepo.findAll();

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
                .map(p -> mapToPostResponse(p, principal != null ? principal.getName() : null))
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

    @GetMapping("/topics/{topicId}/posts")
    public ResponseEntity<ApiResponse<List<PostResponse>>> getPostsForTopic(@PathVariable Long topicId, Principal principal) {
        try {
            List<ForumPost> posts = postRepo.findByTopicIdAndParentPostIsNull(topicId);
            List<PostResponse> postResponses = posts.stream()
                .map(p -> mapToPostResponse(p, principal != null ? principal.getName() : null))
                .collect(Collectors.toList());

            return ResponseEntity.ok(new ApiResponse<>("SUCCESS", "Posts retrieved successfully", postResponses));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>("ERROR", e.getMessage(), null));
        }
    }

    @PostMapping(value = "/topics/{topicId}/posts", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public PostResponse createPost(
        @PathVariable Long topicId,
        @RequestPart("content") String content,
        @RequestPart(value = "image", required = false) MultipartFile image,
        Principal principal
    ) {
        ForumTopic topic = topicRepo.findById(topicId)
            .orElseThrow(() -> new IllegalArgumentException("Topic not found"));

        ForumPost post = new ForumPost();
        post.setTopic(topic);
        post.setAuthor(principal.getName());
        post.setContent(content);

        if (image != null && !image.isEmpty()) {
            String filename = storageService.store(image);
            post.setImageUrl("/uploads/" + filename);
        }

        ForumPost saved = postRepo.save(post);
        return mapToPostResponse(saved, principal.getName());
    }

    @PostMapping("/posts/{postId}/vote")
public ResponseEntity<ApiResponse<PostResponse>> votePost(
    @PathVariable Long postId,
    @RequestBody VoteRequest voteRequest,
    Principal principal
) {
    try {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ApiResponse<>("ERROR", "You must be logged in to vote", null));
        }
        
        ForumVote vote = voteService.processVote(postId, principal.getName(), voteRequest.isUpvote());
        ForumPost post = vote.getPost();
        PostResponse postResponse = mapToPostResponse(post, principal.getName());
        
        return ResponseEntity.ok(new ApiResponse<>("SUCCESS", "Vote processed successfully", postResponse));
    } catch (Exception e) {
        return ResponseEntity.badRequest()
            .body(new ApiResponse<>("ERROR", e.getMessage(), null));
    }
}


    private PostResponse mapToPostResponse(ForumPost post, String username) {
        Optional<ForumVote> userVote = voteRepository.findByPostIdAndUsername(post.getId(), username);

        List<PostResponse> replies = new ArrayList<>();
        if (post.getParentPost() == null) {
            replies = post.getReplies().stream()
                .map(reply -> mapToPostResponse(reply, username))
                .collect(Collectors.toList());
        }

        return new PostResponse(
            post.getId(),
            post.getAuthor(),
            post.getContent(),
            post.getCreatedAt(),
            post.getImageUrl(),
            post.getUpvotes(),
            post.getDownvotes(),
            post.getParentPost() != null ? post.getParentPost().getId() : null,
            replies,
            userVote.isPresent(),
            userVote.map(ForumVote::isUpvote).orElse(null)
        );
    }
}
