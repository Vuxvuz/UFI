import React, { useState, useEffect, useCallback } from 'react';
import { 
  listTopics, 
  listPosts, 
  deletePost, 
  updatePost, 
  togglePostComments, 
  deleteTopic 
} from '../../services/forumService';

function ForumManagement() {
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editPostId, setEditPostId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });

  // Load topics on component mount
  const loadTopics = useCallback(async () => {
    setLoading(true);
    try {
      const response = await listTopics();
      if (response && response.data) {
        setTopics(response.data || []);
      } else {
        showMessage('No topics found or invalid response', 'warning');
        setTopics([]);
      }
    } catch (error) {
      console.error('Error loading topics:', error);
      showMessage(`Error loading topics: ${error.message || 'Unknown error'}`, 'error');
      setTopics([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTopics();
  }, [loadTopics]);

  // Load posts for a selected topic
  const loadPosts = async (topicId) => {
    setLoading(true);
    try {
      const response = await listPosts(topicId);
      if (response && response.data) {
        setPosts(response.data || []);
      } else {
        setPosts([]);
        showMessage('No posts found or invalid response', 'warning');
      }
      const topic = topics.find(t => t.id === topicId);
      if (!topic) {
        showMessage('Topic not found. It may have been deleted.', 'warning');
        setSelectedTopic(null);
        return;
      }
      setSelectedTopic(topic);
    } catch (error) {
      console.error('Error loading posts:', error);
      showMessage(`Error loading posts: ${error.message || 'Unknown error'}`, 'error');
      setPosts([]);
      setSelectedTopic(null);
    } finally {
      setLoading(false);
    }
  };

  // Delete a post
  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    
    setLoading(true);
    try {
      await deletePost(postId);
      showMessage('Post deleted successfully', 'success');
      if (selectedTopic) {
        loadPosts(selectedTopic.id);
      }
    } catch (error) {
      showMessage(`Error deleting post: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Delete a topic
  const handleDeleteTopic = async (topicId) => {
    if (!window.confirm('Are you sure you want to delete this topic? All posts will be lost.')) return;
    
    setLoading(true);
    try {
      await deleteTopic(topicId);
      showMessage('Topic deleted successfully', 'success');
      loadTopics();
      if (selectedTopic && selectedTopic.id === topicId) {
        setSelectedTopic(null);
        setPosts([]);
      }
    } catch (error) {
      showMessage(`Error deleting topic: ${error.message || 'Unknown error'}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Start editing a post
  const startEditing = (post) => {
    setEditPostId(post.id);
    setEditContent(post.content);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditPostId(null);
    setEditContent('');
  };

  // Save edited post
  const saveEditedPost = async () => {
    setLoading(true);
    try {
      await updatePost(editPostId, editContent);
      showMessage('Post updated successfully', 'success');
      if (selectedTopic) {
        loadPosts(selectedTopic.id);
      }
      cancelEditing();
    } catch (error) {
      showMessage(`Error updating post: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Toggle comments for a post
  const handleToggleComments = async (postId, currentlyEnabled) => {
    setLoading(true);
    try {
      await togglePostComments(postId, !currentlyEnabled);
      showMessage(`Comments ${!currentlyEnabled ? 'enabled' : 'disabled'} successfully`, 'success');
      if (selectedTopic) {
        loadPosts(selectedTopic.id);
      }
    } catch (error) {
      showMessage(`Error toggling comments: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Display a message
  const showMessage = (text, type = 'info') => {
    setMessage({ text, type });
    // Auto-clear messages after 5 seconds
    setTimeout(() => {
      setMessage({ text: '', type: '' });
    }, 5000);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Forum Management</h1>
      
      {/* Display messages */}
      {message.text && (
        <div className={`p-3 mb-4 rounded ${
          message.type === 'success' ? 'bg-green-100 text-green-700' : message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
        }`}>
          {message.text}
        </div>
      )}
      
      {/* Topics list */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Topics</h2>
        {loading && !selectedTopic ? (
          <p className="text-gray-500">Loading topics...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 text-left">Title</th>
                  <th className="px-4 py-2 text-left">Author</th>
                  <th className="px-4 py-2 text-left">Category</th>
                  <th className="px-4 py-2 text-left">Votes</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {topics.map(topic => (
                  <tr key={topic.id} className="border-t border-gray-200">
                    <td className="px-4 py-2">{topic.title}</td>
                    <td className="px-4 py-2">{topic.author}</td>
                    <td className="px-4 py-2">{topic.category}</td>
                    <td className="px-4 py-2">
                      <span className="text-green-600">+{topic.upvotes || 0}</span> / 
                      <span className="text-red-600">-{topic.downvotes || 0}</span>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => loadPosts(topic.id)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                        >
                          View Posts
                        </button>
                        <button 
                          onClick={() => handleDeleteTopic(topic.id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {topics.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-4 py-2 text-center">No topics found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Posts for selected topic */}
      {selectedTopic && (
        <div>
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-semibold">
              Posts in "{selectedTopic.title}"
            </h2>
            <button 
              onClick={() => setSelectedTopic(null)}
              className="bg-gray-300 hover:bg-gray-400 px-3 py-1 rounded text-sm"
            >
              Back to Topics
            </button>
          </div>
          
          {loading ? (
            <p className="text-gray-500">Loading posts...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-2 text-left">Author</th>
                    <th className="px-4 py-2 text-left">Content</th>
                    <th className="px-4 py-2 text-left">Votes</th>
                    <th className="px-4 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map(post => (
                    <tr key={post.id} className="border-t border-gray-200">
                      <td className="px-4 py-2">{post.author}</td>
                      <td className="px-4 py-2">
                        {editPostId === post.id ? (
                          <textarea 
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded"
                            rows="3"
                          />
                        ) : (
                          <div>
                            {post.content}
                            {post.imageUrl && (
                              <div className="mt-2">
                                <img 
                                  src={post.imageUrl} 
                                  alt="Post attachment" 
                                  className="max-w-xs max-h-32 object-cover"
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        <span className="text-green-600">+{post.upvotes}</span> / 
                        <span className="text-red-600">-{post.downvotes}</span>
                      </td>
                      <td className="px-4 py-2">
                        {editPostId === post.id ? (
                          <div className="flex space-x-2 mb-2">
                            <button 
                              onClick={saveEditedPost}
                              className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                            >
                              Save
                            </button>
                            <button 
                              onClick={cancelEditing}
                              className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col space-y-2">
                            <div className="flex space-x-2">
                              <button 
                                onClick={() => startEditing(post)}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                              >
                                Edit
                              </button>
                              <button 
                                onClick={() => handleDeletePost(post.id)}
                                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                              >
                                Delete
                              </button>
                            </div>
                            <button 
                              onClick={() => handleToggleComments(post.id, post.commentsEnabled)}
                              className={`${
                                post.commentsEnabled ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600'
                              } text-white px-3 py-1 rounded text-sm`}
                            >
                              {post.commentsEnabled ? 'Disable Comments' : 'Enable Comments'}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {posts.length === 0 && (
                    <tr>
                      <td colSpan="4" className="px-4 py-2 text-center">No posts found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ForumManagement; 