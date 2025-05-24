package com.ufit.server.service.impl;

import com.ufit.server.entity.ForumPost;
import com.ufit.server.entity.ForumVote;
import com.ufit.server.entity.User;
import com.ufit.server.repository.ForumPostRepository;
import com.ufit.server.repository.ForumVoteRepository;
import com.ufit.server.repository.UserRepository;
import com.ufit.server.service.VoteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class VoteServiceImpl implements VoteService {
    
    @Autowired
    private ForumPostRepository postRepository;
    
    @Autowired
    private ForumVoteRepository voteRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Override
    @Transactional
    public ForumVote processVote(Long postId, String username, boolean isUpvote) {
        ForumPost post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));
        
        Optional<ForumVote> existingVote = voteRepository.findByPostIdAndUsername(postId, username);
        
        // The post author's karma will be affected
        User postAuthor = userRepository.findByUsername(post.getAuthor())
                .orElseThrow(() -> new IllegalArgumentException("Post author not found"));
        
        ForumVote vote = null;
        
        if (existingVote.isPresent()) {
            vote = existingVote.get();
            
            // If vote is the same as before, remove it (toggle behavior)
            if (vote.isUpvote() == isUpvote) {
                // Undo the previous vote effect
                if (isUpvote) {
                    post.setUpvotes(post.getUpvotes() - 1);
                    postAuthor.setKarma(postAuthor.getKarma() - 1);
                } else {
                    post.setDownvotes(post.getDownvotes() - 1);
                    postAuthor.setKarma(postAuthor.getKarma() + 1); // Removing a downvote increases karma
                }
                
                voteRepository.delete(vote);
                postRepository.save(post);
                userRepository.save(postAuthor);
                return null; // Vote removed
            } else {
                // Change vote direction
                if (isUpvote) {
                    // Changed from downvote to upvote
                    post.setDownvotes(post.getDownvotes() - 1);
                    post.setUpvotes(post.getUpvotes() + 1);
                    postAuthor.setKarma(postAuthor.getKarma() + 2); // +2 because removing downvote and adding upvote
                } else {
                    // Changed from upvote to downvote
                    post.setUpvotes(post.getUpvotes() - 1);
                    post.setDownvotes(post.getDownvotes() + 1);
                    postAuthor.setKarma(postAuthor.getKarma() - 2); // -2 because removing upvote and adding downvote
                }
                
                vote.setUpvote(isUpvote);
                postRepository.save(post);
                userRepository.save(postAuthor);
                vote = voteRepository.save(vote);
            }
        } else {
            // New vote
            vote = new ForumVote();
            vote.setPost(post);
            vote.setUsername(username);
            vote.setUpvote(isUpvote);
            
            if (isUpvote) {
                post.setUpvotes(post.getUpvotes() + 1);
                postAuthor.setKarma(postAuthor.getKarma() + 1);
            } else {
                post.setDownvotes(post.getDownvotes() + 1);
                postAuthor.setKarma(postAuthor.getKarma() - 1);
            }
            
            postRepository.save(post);
            userRepository.save(postAuthor);
            vote = voteRepository.save(vote);
        }
        
        // After processing the vote, update user karma with formula
        String postAuthorUsername = post.getAuthor();
        User user = userRepository.findByUsername(postAuthorUsername)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        // Get total upvotes and downvotes for the user
        int totalUpvotes = voteRepository.countByPostAuthorAndIsUpvote(postAuthorUsername, true);
        int totalDownvotes = voteRepository.countByPostAuthorAndIsUpvote(postAuthorUsername, false);
        
        // Calculate karma: +1 for every 3 upvotes, -1 for every 5 downvotes
        int calculatedKarma = (totalUpvotes / 3) - (totalDownvotes / 5);
        
        // Update user karma
        user.setKarma(calculatedKarma);
        userRepository.save(user);
        
        return vote;
    }
}