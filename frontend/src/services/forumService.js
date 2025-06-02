import { API } from "./api";

/**
 * Get list of topics (optionally filtered by category)
 */
export async function listTopics(category = null) {
  try {
    const endpoint = category && category !== "ALL"
      ? `/api/forum/topics?category=${encodeURIComponent(category)}`
      : '/api/forum/topics';
    const response = await API.get(endpoint);
    return response.data;
  } catch (error) {
    console.error("Error listing topics:", error);
    throw error;
  }
}

/**
 * Create a new topic
 */
export async function createTopic(topicData) {
  try {
    const response = await API.post("/api/forum/topics", topicData);
    return response.data;
  } catch (error) {
    console.error("Error creating topic:", error);
    throw error;
  }
}

/**
 * Get details of a topic (with posts)
 */
export async function getTopicDetail(topicId) {
  try {
    const response = await API.get(`/api/forum/topics/${topicId}`);
    return response.data;
  } catch (error) {
    console.error("Error getting topic detail:", error.response?.data || error);
    throw error;
  }
}

/**
 * Get posts for a topic
 */
export async function listPosts(topicId) {
  try {
    const response = await API.get(`/api/forum/topics/${topicId}/posts`);
    return response.data;
  } catch (error) {
    console.error("Error listing posts:", error);
    throw error;
  }
}

/**
 * Create a post in a topic
 */
export async function createPost(topicId, formData) {
  try {
    const response = await API.post(`/api/forum/topics/${topicId}/posts`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  } catch (error) {
    console.error("Error creating post:", error.response?.data || error);
    throw error;
  }
}

/**
 * Reply to a specific post
 */
export async function replyToPost(postId, content) {
  try {
    const response = await API.post(`/api/forum/posts/${postId}/reply`, { content });
    return response.data;
  } catch (error) {
    console.error("Error replying to post:", error);
    throw error;
  }
}

/**
 * Vote on a post
 */
export async function votePost(postId, isUpvote) {
  try {
    const response = await API.post(`/api/forum/posts/${postId}/vote`, { isUpvote });
    return response.data;
  } catch (error) {
    console.error("Error voting on post:", error);
    throw error;
  }
}

/**
 * Get comments for a post
 */
export function getComments(postId) {
  return API.get(`/api/forum/posts/${postId}/comments`);
}

/**
 * Add a comment to a post
 */
export function addComment(postId, content, imageFile) {
  const form = new FormData();
  form.append("content", content);
  if (imageFile) {
    form.append("image", imageFile);
  }
  return API.post(`/api/forum/posts/${postId}/comments`, form, {
    headers: { "Content-Type": "multipart/form-data" }
  });
}

// --- ADMIN / MODERATOR FUNCTIONS ---

/**
 * Delete a post
 */
export function deletePost(postId) {
  return API.delete(`/api/forum/posts/${postId}`);
}

/**
 * Update post content
 */
export function updatePost(postId, content) {
  return API.put(`/api/forum/posts/${postId}`, null, {
    params: { content }
  });
}

/**
 * Toggle comments on a post
 */
export function togglePostComments(postId, enabled) {
  return API.put(`/api/forum/posts/${postId}/toggle-comments`, null, {
    params: { enabled }
  });
}

/**
 * Delete a topic
 */
export function deleteTopic(topicId) {
  return API.delete(`/api/forum/topics/${topicId}`);
}

/**
 * Get all categories
 */
export async function listCategories() {
  try {
    const response = await API.get('/api/forum/forum-categories');
    return response.data;
  } catch (error) {
    console.error("Error listing categories:", error);
    throw error;
  }
}

/**
 * Add a category
 */
export async function addCategory(name) {
  try {
    const response = await API.post('/api/admin/forum/categories', null, {
      params: { name }
    });
    return response.data;
  } catch (error) {
    console.error("Error adding category:", error);
    throw error;
  }
}

/**
 * Update category name
 */
export async function updateCategory(oldName, newName) {
  try {
    const response = await API.put(`/api/admin/forum/categories/${oldName}`, null, {
      params: { newName }
    });
    return response.data;
  } catch (error) {
    console.error("Error updating category:", error);
    throw error;
  }
}

/**
 * Delete a category
 */
export async function deleteCategory(name) {
  try {
    const response = await API.delete(`/api/admin/forum/categories/${name}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting category:", error);
    throw error;
  }
}

// Alias
export const getCategories = listCategories;
