import React from 'react';
import { votePost } from '../../services/forumService';

export default function VoteButtons({ postId, upvotes, downvotes, userVoted, userVoteIsUpvote, onVoteChange }) {
  const handleVote = async (isUpvote) => {
    try {
      await votePost(postId, isUpvote);
      if (onVoteChange) onVoteChange();
    } catch (err) {
      console.error("Error voting:", err);
      alert("Failed to register vote");
    }
  };

  return (
    <div className="d-flex flex-column align-items-center me-3">
      <button 
        className={`btn btn-sm ${userVoted && userVoteIsUpvote ? 'btn-success' : 'btn-outline-secondary'}`}
        onClick={() => handleVote(true)}
        aria-label="Upvote"
      >
        <i className="bi bi-arrow-up"></i>
      </button>
      
      <span className="my-1">{upvotes - downvotes}</span>
      
      <button 
        className={`btn btn-sm ${userVoted && !userVoteIsUpvote ? 'btn-danger' : 'btn-outline-secondary'}`}
        onClick={() => handleVote(false)}
        aria-label="Downvote"
      >
        <i className="bi bi-arrow-down"></i>
      </button>
    </div>
  );
} 