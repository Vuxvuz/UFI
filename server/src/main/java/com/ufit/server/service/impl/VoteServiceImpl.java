package com.ufit.server.service.impl;

import com.ufit.server.entity.ForumPost;
import com.ufit.server.entity.ForumTopic;
import com.ufit.server.entity.ForumVote;
import com.ufit.server.entity.User;
import com.ufit.server.repository.ForumPostRepository;
import com.ufit.server.repository.ForumTopicRepository;
import com.ufit.server.repository.ForumVoteRepository;
import com.ufit.server.repository.UserRepository;
import com.ufit.server.service.VoteService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class VoteServiceImpl implements VoteService {

    private static final Logger logger = LoggerFactory.getLogger(VoteServiceImpl.class);

    @Autowired private ForumPostRepository postRepository;
    @Autowired private ForumTopicRepository topicRepository;
    @Autowired private ForumVoteRepository voteRepository;
    @Autowired private UserRepository userRepository;

    @Override
    @Transactional
    public ForumVote processVote(Long entityId, String username, boolean isUpvote, String entityType) {
        logger.info("=== PROCESSING VOTE ===");
        logger.info("EntityId: {}, Username: {}, IsUpvote: {}, EntityType: {}", 
            entityId, username, isUpvote, entityType);

        // Validate entity
        Optional<ForumPost> postOptional = Optional.empty();
        Optional<ForumTopic> topicOptional = Optional.empty();
        String author;

        if ("POST".equalsIgnoreCase(entityType)) {
            postOptional = postRepository.findById(entityId);
            if (postOptional.isEmpty()) {
                throw new IllegalArgumentException("Post not found");
            }
            author = postOptional.get().getAuthor();
            logger.info("Found POST - ID: {}, Author: {}, Current Upvotes: {}, Current Downvotes: {}", 
                postOptional.get().getId(), author, postOptional.get().getUpvotes(), postOptional.get().getDownvotes());
        } else if ("TOPIC".equalsIgnoreCase(entityType)) {
            topicOptional = topicRepository.findById(entityId);
            if (topicOptional.isEmpty()) {
                throw new IllegalArgumentException("Topic not found");
            }
            author = topicOptional.get().getAuthor();
            logger.info("Found TOPIC - ID: {}, Author: {}, Current Upvotes: {}, Current Downvotes: {}", 
                topicOptional.get().getId(), author, topicOptional.get().getUpvotes(), topicOptional.get().getDownvotes());
        } else {
            throw new IllegalArgumentException("Invalid entity type");
        }

        User postAuthor = userRepository.findByUsername(author)
            .orElseThrow(() -> new IllegalArgumentException("Author not found"));
        logger.info("Author found - Username: {}, Current Karma: {}", postAuthor.getUsername(), postAuthor.getKarma());

        // Find existing vote
        Optional<ForumVote> existingVote = "POST".equalsIgnoreCase(entityType)
            ? voteRepository.findByPostIdAndUsername(entityId, username)
            : voteRepository.findByTopicIdAndUsername(entityId, username);

        if (existingVote.isPresent()) {
            ForumVote vote = existingVote.get();
            logger.info("EXISTING VOTE FOUND - VoteId: {}, IsUpvote: {}", vote.getId(), vote.isUpvote());
            
            if (vote.isUpvote() == isUpvote) {
                // Remove vote (same vote type) - toggle off
                logger.info("REMOVING VOTE (toggle off) - Same vote type");
                removeVote(postOptional, topicOptional, vote.isUpvote(), postAuthor);
                try {
                    // Check if vote still exists in DB before attempting to delete
                    if (voteRepository.existsById(vote.getId())) {
                        voteRepository.delete(vote);
                        logger.info("Vote deleted successfully");
                    } else {
                        logger.warn("Vote with ID {} already deleted or doesn't exist", vote.getId());
                    }
                } catch (EmptyResultDataAccessException e) {
                    logger.warn("Failed to delete vote: {}", e.getMessage());
                    // Continue processing since we've already updated the counts
                }
                userRepository.save(postAuthor);
                logger.info("Vote removed successfully");
                return null;
            } else {
                // Change vote (different vote type)
                logger.info("CHANGING VOTE - From {} to {}", vote.isUpvote(), isUpvote);
                changeVote(postOptional, topicOptional, vote.isUpvote(), isUpvote, postAuthor);
                vote.setUpvote(isUpvote);
                ForumVote savedVote = voteRepository.save(vote);
                userRepository.save(postAuthor);
                logger.info("Vote changed successfully - New VoteId: {}", savedVote.getId());
                return savedVote;
            }
        } else {
            // New vote
            logger.info("CREATING NEW VOTE");
            ForumVote vote = new ForumVote();
            vote.setUsername(username);
            vote.setUpvote(isUpvote);
            
            addNewVote(postOptional, topicOptional, isUpvote, postAuthor);
            
            if ("POST".equalsIgnoreCase(entityType)) {
                vote.setPost(postOptional.get());
            } else {
                vote.setTopic(topicOptional.get());
            }
            
            ForumVote savedVote = voteRepository.save(vote);
            userRepository.save(postAuthor);
            logger.info("New vote created successfully - VoteId: {}", savedVote.getId());
            return savedVote;
        }
    }

    // Add a new vote
    private void addNewVote(Optional<ForumPost> postOptional, Optional<ForumTopic> topicOptional,
                           boolean isUpvote, User postAuthor) {
        logger.info("=== ADDING NEW VOTE ===");
        
        if (postOptional.isPresent()) {
            ForumPost post = postOptional.get();
            int oldUpvotes = post.getUpvotes();
            int oldDownvotes = post.getDownvotes();
            int oldKarma = postAuthor.getKarma();
            
            if (isUpvote) {
                post.setUpvotes(post.getUpvotes() + 1);
                postAuthor.setKarma(postAuthor.getKarma() + 1);
                logger.info("POST UPVOTE - Upvotes: {} -> {}, Karma: {} -> {}", 
                    oldUpvotes, post.getUpvotes(), oldKarma, postAuthor.getKarma());
            } else {
                post.setDownvotes(post.getDownvotes() + 1);
                postAuthor.setKarma(postAuthor.getKarma() - 1);
                logger.info("POST DOWNVOTE - Downvotes: {} -> {}, Karma: {} -> {}", 
                    oldDownvotes, post.getDownvotes(), oldKarma, postAuthor.getKarma());
            }
            postRepository.save(post);
            
        } else if (topicOptional.isPresent()) {
            ForumTopic topic = topicOptional.get();
            int oldUpvotes = topic.getUpvotes();
            int oldDownvotes = topic.getDownvotes();
            int oldKarma = postAuthor.getKarma();
            
            if (isUpvote) {
                topic.setUpvotes(topic.getUpvotes() + 1);
                postAuthor.setKarma(postAuthor.getKarma() + 1);
                logger.info("TOPIC UPVOTE - Upvotes: {} -> {}, Karma: {} -> {}", 
                    oldUpvotes, topic.getUpvotes(), oldKarma, postAuthor.getKarma());
            } else {
                topic.setDownvotes(topic.getDownvotes() + 1);
                postAuthor.setKarma(postAuthor.getKarma() - 1);
                logger.info("TOPIC DOWNVOTE - Downvotes: {} -> {}, Karma: {} -> {}", 
                    oldDownvotes, topic.getDownvotes(), oldKarma, postAuthor.getKarma());
            }
            topicRepository.save(topic);
        }
        logger.info("=== NEW VOTE ADDED ===");
    }

    // Remove an existing vote
    private void removeVote(Optional<ForumPost> postOptional, Optional<ForumTopic> topicOptional,
                           boolean wasUpvote, User postAuthor) {
        logger.info("=== REMOVING VOTE ===");
        
        if (postOptional.isPresent()) {
            ForumPost post = postOptional.get();
            int oldUpvotes = post.getUpvotes();
            int oldDownvotes = post.getDownvotes();
            int oldKarma = postAuthor.getKarma();
            
            if (wasUpvote) {
                post.setUpvotes(Math.max(0, post.getUpvotes() - 1));
                postAuthor.setKarma(postAuthor.getKarma() - 1);
                logger.info("REMOVE POST UPVOTE - Upvotes: {} -> {}, Karma: {} -> {}", 
                    oldUpvotes, post.getUpvotes(), oldKarma, postAuthor.getKarma());
            } else {
                post.setDownvotes(Math.max(0, post.getDownvotes() - 1));
                postAuthor.setKarma(postAuthor.getKarma() + 1);
                logger.info("REMOVE POST DOWNVOTE - Downvotes: {} -> {}, Karma: {} -> {}", 
                    oldDownvotes, post.getDownvotes(), oldKarma, postAuthor.getKarma());
            }
            postRepository.save(post);
            
        } else if (topicOptional.isPresent()) {
            ForumTopic topic = topicOptional.get();
            int oldUpvotes = topic.getUpvotes();
            int oldDownvotes = topic.getDownvotes();
            int oldKarma = postAuthor.getKarma();
            
            if (wasUpvote) {
                topic.setUpvotes(Math.max(0, topic.getUpvotes() - 1));
                postAuthor.setKarma(postAuthor.getKarma() - 1);
                logger.info("REMOVE TOPIC UPVOTE - Upvotes: {} -> {}, Karma: {} -> {}", 
                    oldUpvotes, topic.getUpvotes(), oldKarma, postAuthor.getKarma());
            } else {
                topic.setDownvotes(Math.max(0, topic.getDownvotes() - 1));
                postAuthor.setKarma(postAuthor.getKarma() + 1);
                logger.info("REMOVE TOPIC DOWNVOTE - Downvotes: {} -> {}, Karma: {} -> {}", 
                    oldDownvotes, topic.getDownvotes(), oldKarma, postAuthor.getKarma());
            }
            topicRepository.save(topic);
        }
        logger.info("=== VOTE REMOVED ===");
    }

    // Change an existing vote
    private void changeVote(Optional<ForumPost> postOptional, Optional<ForumTopic> topicOptional,
                           boolean oldVote, boolean newVote, User postAuthor) {
        logger.info("=== CHANGING VOTE FROM {} TO {} ===", oldVote, newVote);
        
        if (postOptional.isPresent()) {
            ForumPost post = postOptional.get();
            int initialUpvotes = post.getUpvotes();
            int initialDownvotes = post.getDownvotes();
            int initialKarma = postAuthor.getKarma();
            
            // Remove old vote effect
            if (oldVote) {
                post.setUpvotes(Math.max(0, post.getUpvotes() - 1));
                postAuthor.setKarma(postAuthor.getKarma() - 1);
                logger.info("Removed old UPVOTE effect");
            } else {
                post.setDownvotes(Math.max(0, post.getDownvotes() - 1));
                postAuthor.setKarma(postAuthor.getKarma() + 1);
                logger.info("Removed old DOWNVOTE effect");
            }
            
            // Add new vote effect
            if (newVote) {
                post.setUpvotes(post.getUpvotes() + 1);
                postAuthor.setKarma(postAuthor.getKarma() + 1);
                logger.info("Added new UPVOTE effect");
            } else {
                post.setDownvotes(post.getDownvotes() + 1);
                postAuthor.setKarma(postAuthor.getKarma() - 1);
                logger.info("Added new DOWNVOTE effect");
            }
            
            logger.info("POST VOTE CHANGE - Upvotes: {} -> {}, Downvotes: {} -> {}, Karma: {} -> {}", 
                initialUpvotes, post.getUpvotes(), initialDownvotes, post.getDownvotes(), 
                initialKarma, postAuthor.getKarma());
            postRepository.save(post);
            
        } else if (topicOptional.isPresent()) {
            ForumTopic topic = topicOptional.get();
            int initialUpvotes = topic.getUpvotes();
            int initialDownvotes = topic.getDownvotes();
            int initialKarma = postAuthor.getKarma();
            
            // Remove old vote effect
            if (oldVote) {
                topic.setUpvotes(Math.max(0, topic.getUpvotes() - 1));
                postAuthor.setKarma(postAuthor.getKarma() - 1);
                logger.info("Removed old UPVOTE effect");
            } else {
                topic.setDownvotes(Math.max(0, topic.getDownvotes() - 1));
                postAuthor.setKarma(postAuthor.getKarma() + 1);
                logger.info("Removed old DOWNVOTE effect");
            }
            
            // Add new vote effect
            if (newVote) {
                topic.setUpvotes(topic.getUpvotes() + 1);
                postAuthor.setKarma(postAuthor.getKarma() + 1);
                logger.info("Added new UPVOTE effect");
            } else {
                topic.setDownvotes(topic.getDownvotes() + 1);
                postAuthor.setKarma(postAuthor.getKarma() - 1);
                logger.info("Added new DOWNVOTE effect");
            }
            
            logger.info("TOPIC VOTE CHANGE - Upvotes: {} -> {}, Downvotes: {} -> {}, Karma: {} -> {}", 
                initialUpvotes, topic.getUpvotes(), initialDownvotes, topic.getDownvotes(), 
                initialKarma, postAuthor.getKarma());
            topicRepository.save(topic);
        }
        logger.info("=== VOTE CHANGED ===");
    }
}