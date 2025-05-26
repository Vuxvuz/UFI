import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { getTopicDetail, createPost, votePost } from '../../services/forumService';

export default function TopicDetail() {
  const { topicId } = useParams();
  const [topic, setTopic] = useState(null);
  const [posts, setPosts] = useState([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Debug mount effect
  useEffect(() => {
    console.log('TopicDetail component mounted with topicId:', topicId);
  }, [topicId]);

  // Load topic data function
  const loadTopicData = useCallback(async () => {
    console.log(`ATTEMPTING to fetch topic details for ID: ${topicId}`);
    setLoading(true);
    try {
      const response = await getTopicDetail(topicId);
      console.log('RECEIVED topic detail response:', response);
      
      // Detailed debug logging
      console.log('Response structure:', {
        hasResult: 'result' in response,
        resultValue: response.result,
        hasData: 'data' in response,
        responseKeys: Object.keys(response)
      });
      
      if (response) {
        if (response.result === "SUCCESS" && response.data) {
          console.log('Setting topic data from response.data:', response.data);
          setTopic(response.data);
          // Ensure posts is always an array
          setPosts(Array.isArray(response.data.posts) ? response.data.posts : []);
        } else if (response.posts || response.title) {
          console.log('Setting topic data directly from response:', response);
          setTopic(response);
          // Ensure posts is always an array
          setPosts(Array.isArray(response.posts) ? response.posts : []);
        } else {
          console.error('Response format not recognized:', response);
          setError("Failed to load topic: unexpected response format");
        }
      } else {
        console.error('Empty response received');
        setError("Failed to load topic: empty response");
      }
    } catch (err) {
      console.error("Error loading topic:", err);
      setError(`Error loading topic: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [topicId]);

  // Call loadTopicData when component mounts or topicId changes
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
      if (image) {
        formData.append('image', image);
      }
  
      const response = await createPost(topicId, formData);
      console.log('Post creation response:', response);
  
      setNewPostContent('');
      setImage(null);
  
      // Load immediately without setTimeout
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
      loadTopicData(); // Refresh to show updated votes
    } catch (error) {
      console.error("Error voting:", error);
      setError(`Error voting: ${error.message}`);
    }
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
            {topic.category && typeof topic.category === 'object' 
              ? topic.category.name 
              : (topic.category || 'Uncategorized')}
          </span>
        </div>
        <div className="card-body">
          <p className="card-text">
            Created by {typeof topic.createdBy === 'object' 
              ? topic.createdBy.username 
              : (topic.createdBy || 'Anonymous')} 
            on {new Date(topic.createdAt).toLocaleString()}
          </p>
        </div>
      </div>

      <h3 className="mb-3">Posts</h3>
      
      {posts.length === 0 ? (
        <div className="alert alert-info">No posts yet. Be the first to post!</div>
      ) : (
        <div>
          {console.log('Rendering posts array:', posts)}
          {posts.map((post, index) => (
            <div key={post.id || index} className="card mb-3">
              <div className="card-body">
                <div className="d-flex justify-content-between">
                  <h5 className="card-title">
                    {typeof post.author === 'object' 
                      ? post.author.username 
                      : (post.author || 'Anonymous')}
                  </h5>
                  <small className="text-muted">
                    {post.createdAt ? new Date(post.createdAt).toLocaleString() : 'Just now'}
                  </small>
                </div>
                <p className="card-text">{post.content}</p>
                
                {/* Fixed image display logic */}
                {post.imageUrl && (
                  <div className="mt-2 mb-3">
                    <img 
                      src={post.imageUrl} 
                      alt="Post attachment" 
                      className="img-fluid" 
                      style={{ maxWidth: '100%', maxHeight: '300px' }} 
                    />
                  </div>
                )}
                
                <div className="d-flex mt-2">
                  <button 
                    className="btn btn-sm btn-outline-success me-2" 
                    onClick={() => handleVote(post.id, true)}
                  >
                    👍 {post.upvotes || 0}
                  </button>
                  <button 
                    className="btn btn-sm btn-outline-danger" 
                    onClick={() => handleVote(post.id, false)}
                  >
                    👎 {post.downvotes || 0}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
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
              ></textarea>
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