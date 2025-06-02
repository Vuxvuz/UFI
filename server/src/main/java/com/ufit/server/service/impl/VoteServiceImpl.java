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

    @Autowired private ForumPostRepository postRepository;
    @Autowired private ForumVoteRepository voteRepository;
    @Autowired private UserRepository userRepository;

    @Override
    @Transactional
    public ForumVote processVote(Long postId, String username, boolean isUpvote) {
        ForumPost post = postRepository.findById(postId)
            .orElseThrow(() -> new IllegalArgumentException("Post not found"));

        Optional<ForumVote> existingVote = voteRepository.findByPostIdAndUsername(postId, username);
        User postAuthor = userRepository.findByUsername(post.getAuthor())
            .orElseThrow(() -> new IllegalArgumentException("Post author not found"));

        if (existingVote.isPresent()) {
            ForumVote vote = existingVote.get();
            if (vote.isUpvote() == isUpvote) {
                if (isUpvote) {
                    post.setUpvotes(post.getUpvotes() - 1);
                    postAuthor.setKarma(postAuthor.getKarma() - 1);
                } else {
                    post.setDownvotes(post.getDownvotes() - 1);
                    postAuthor.setKarma(postAuthor.getKarma() + 1);
                }
                voteRepository.delete(vote);
                postRepository.save(post);
                userRepository.save(postAuthor);
                return null;
            } else {
                if (isUpvote) {
                    post.setDownvotes(post.getDownvotes() - 1);
                    post.setUpvotes(post.getUpvotes() + 1);
                    postAuthor.setKarma(postAuthor.getKarma() + 2);
                } else {
                    post.setUpvotes(post.getUpvotes() - 1);
                    post.setDownvotes(post.getDownvotes() + 1);
                    postAuthor.setKarma(postAuthor.getKarma() - 2);
                }
                vote.setUpvote(isUpvote);
                postRepository.save(post);
                userRepository.save(postAuthor);
                return voteRepository.save(vote);
            }
        } else {
            ForumVote vote = new ForumVote();
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
            return voteRepository.save(vote);
        }
    }
}
