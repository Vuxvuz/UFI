import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { getTopicDetail, createPost, replyToPost, votePost } from '../../services/forumService';

export default function TopicDetail() {
  const { topicId } = useParams();
  const [topic, setTopic] = useState(null);
  const [posts, setPosts] = useState([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingPostId, setReplyingPostId] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const BASE_IMAGE_URL = 'http://localhost:8080';

  const loadTopicData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getTopicDetail(topicId);
      if (response?.result === 'SUCCESS' && response.data) {
        setTopic(response.data);
        setPosts(Array.isArray(response.data.posts) ? response.data.posts : []);
      } else {
        setError('Failed to load topic.');
      }
    } catch (err) {
      console.error('Error loading topic:', err);
      setError(`Error loading topic: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [topicId]);

  useEffect(() => {
    if (topicId) {
      loadTopicData();
    }
  }, [topicId, loadTopicData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;
    setIsSubmitting(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('content', newPostContent);
      if (image) formData.append('image', image);
      await createPost(topicId, formData);
      setNewPostContent('');
      setImage(null);
      await loadTopicData();
    } catch (err) {
      console.error('Post creation error:', err);
      setError(`Error creating post: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleVote = async (postId, isUpvote) => {
    try {
      await votePost(postId, isUpvote);
      loadTopicData();
    } catch (error) {
      console.error('Error voting:', error);
      setError(`Error voting: ${error.message}`);
    }
  };

  const handleReply = async (postId) => {
    if (!replyContent.trim()) return;
    try {
      await replyToPost(postId, replyContent);
      setReplyContent('');
      setReplyingPostId(null);
      loadTopicData();
    } catch (error) {
      console.error("Error replying:", error);
    
      if (error.response && error.response.data && error.response.data.message.includes("Replies only allowed up to 3 levels")) {
        alert("⚠ You cannot reply deeper than 3 levels. Reloading page...");
        window.location.reload();
      } else {
        setError(`Error replying: ${error.message}`);
      }
    }
  };

  const renderReplies = (replies, level = 1) => {
    if (!replies || replies.length === 0 || level > 3) return null;
  
    return replies.map((reply) => (
      <div
        key={reply.id}
        className={`mt-2 ms-${Math.min(level * 3, 9)} border-start ps-3`}
        style={{ borderColor: '#ccc' }}
      >
        <div className="d-flex justify-content-between">
          <strong>{reply.author || 'Anonymous'}</strong>
          <small className="text-muted">
            {reply.createdAt ? new Date(reply.createdAt).toLocaleString() : 'Just now'}
          </small>
        </div>
        <p className="mb-1">{reply.content}</p>
        <div className="d-flex mb-2">
          <button
            className="btn btn-sm btn-outline-success me-2"
            onClick={() => handleVote(reply.id, true)}
          >
            👍 {reply.upvotes || 0}
          </button>
          <button
            className="btn btn-sm btn-outline-danger me-2"
            onClick={() => handleVote(reply.id, false)}
          >
            👎 {reply.downvotes || 0}
          </button>
          {level < 3 && (
            <button
              className="btn btn-sm btn-outline-primary"
              onClick={() => setReplyingPostId(reply.id)}
            >
              Reply
            </button>
          )}
        </div>
  
        {replyingPostId === reply.id && level < 3 && (
          <div className="mb-2">
            <textarea
              className="form-control mb-2"
              rows="2"
              placeholder="Write your reply..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
            />
            <button
              className="btn btn-sm btn-success"
              onClick={() => handleReply(reply.id)}
              disabled={!replyContent.trim()}
            >
              Submit Reply
            </button>
          </div>
        )}
  
        {/* Recursive render for deeper replies, max 3 levels */}
        {renderReplies(reply.replies, level + 1)}
      </div>
    ));
  };
  

  if (loading) {
    return <div className="container mt-4"><div className="alert alert-info">Loading topic...</div></div>;
  }

  if (error) {
    return <div className="container mt-4"><div className="alert alert-danger">{error}</div></div>;
  }

  if (!topic) {
    return <div className="container mt-4"><div className="alert alert-warning">Topic not found</div></div>;
  }

  return (
    <div className="container mt-4">
      <div className="card mb-4">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h2 className="mb-0">{topic.title}</h2>
          <span className="badge bg-secondary">
            {typeof topic.category === 'object' ? topic.category.name : topic.category || 'Uncategorized'}
          </span>
        </div>
        <div className="card-body">
          <p className="card-text">
            Created by {topic.author || 'Anonymous'} on {new Date(topic.createdAt).toLocaleString()}
          </p>
        </div>
      </div>

      <h3 className="mb-3">Posts</h3>

      {posts.length === 0 ? (
        <div className="alert alert-info">No posts yet. Be the first to post!</div>
      ) : (
        posts.map((post) => (
          <div key={post.id} className="card mb-3">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <h5 className="card-title">{post.author || 'Anonymous'}</h5>
                <small className="text-muted">
                  {post.createdAt ? new Date(post.createdAt).toLocaleString() : 'Just now'}
                </small>
              </div>
              <p className="card-text">{post.content}</p>

              {post.imageUrl && (
                <div className="mt-2 mb-3">
                  <img
                    src={post.imageUrl.startsWith('http')
                      ? post.imageUrl
                      : `${BASE_IMAGE_URL}${post.imageUrl}`}
                    alt="Post attachment"
                    className="img-fluid"
                    style={{ maxWidth: '100%', maxHeight: '300px' }}
                  />
                </div>
              )}

              <div className="d-flex mb-2">
                <button
                  className="btn btn-sm btn-outline-success me-2"
                  onClick={() => handleVote(post.id, true)}
                >
                  👍 {post.upvotes || 0}
                </button>
                <button
                  className="btn btn-sm btn-outline-danger me-2"
                  onClick={() => handleVote(post.id, false)}
                >
                  👎 {post.downvotes || 0}
                </button>
                <button
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => setReplyingPostId(post.id)}
                >
                  Reply
                </button>
              </div>

              {replyingPostId === post.id && (
                <div className="mb-2">
                  <textarea
                    className="form-control mb-2"
                    rows="2"
                    placeholder="Write your reply..."
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                  />
                  <button
                    className="btn btn-sm btn-success"
                    onClick={() => handleReply(post.id)}
                    disabled={!replyContent.trim()}
                  >
                    Submit Reply
                  </button>
                </div>
              )}

              {/* Render replies */}
              {renderReplies(post.replies)}
            </div>
          </div>
        ))
      )}

      <div className="card mt-4">
        <div className="card-header">
          <h4>Add a Post</h4>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <textarea
                className="form-control"
                rows="3"
                placeholder="Write your post here..."
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Attach Image (optional)</label>
              <input
                type="file"
                className="form-control"
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting || !newPostContent.trim()}
            >
              {isSubmitting ? 'Posting...' : 'Post'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
