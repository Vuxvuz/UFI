// frontend/src/services/forumService.js
import { API } from "./api";  // <-- dùng chung instance đã cài interceptor

/**
 * Get list of topics, can filter by category (string) or get all (null/undefined)
 * @param {string|null} category 
 * @returns Promise<AxiosResponse<TopicResponse[]>>
 */
export async function listTopics(category = null) {
  try {
    const endpoint = category 
      ? `/api/forum/topics?category=${category}` 
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
 * @param {{ title: string, category: string }} body 
 * @returns Promise<AxiosResponse<TopicResponse>>
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
 * Get list of posts for a topic
 * @param {number|string} topicId 
 * @returns Promise<AxiosResponse<PostResponse[]>>
 */
export const listPosts = async (topicId) => {
  try {
    const response = await API.get(`/api/forum/topics/${topicId}/posts`);
    console.log("API Response in service:", response);
    console.log("Response data structure:", JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error("Error in listPosts service:", error);
    throw error;
  }
};

/**
 * Create a new post in a topic
 * @param {number|string} topicId - The ID of the topic
 * @param {FormData} formData - Form data containing content and optional image
 * @returns {Promise<Object>} - Response from the API
 */
export async function createPost(topicId, formData) {
  try {
    console.log(`Creating post for topic ${topicId} with data:`, {
      content: formData.get('content'),
      hasImage: formData.has('image')
    });
    
    // Make sure we're using the correct content type for FormData
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    };
    
    const response = await API.post(`/api/forum/topics/${topicId}/posts`, formData, config);
    console.log('Create post response:', response.data);
    return response.data;
  } catch (error) {
    console.error("Error creating post:", error);
    console.error("Error response:", error.response?.data || 'No response data');
    throw error;
  }
}

/**
 * Vote on a post
 * @param {number} postId 
 * @param {boolean} isUpvote 
 * @returns Promise<AxiosResponse>
 */
export async function votePost(postId, isUpvote) {
  try {
    const response = await API.post(`/api/forum/posts/${postId}/vote`, {
      isUpvote: isUpvote
    });
    return response.data;
  } catch (error) {
    console.error("Error voting on post:", error);
    throw error;
  }
}

/**
 * Get comments for a post
 * @param {number} postId 
 * @returns Promise<AxiosResponse<PostResponse[]>>
 */
export function getComments(postId) {
  return API.get(`/api/forum/posts/${postId}/comments`);
}

/**
 * Add a comment to a post
 * @param {number} postId 
 * @param {string} content 
 * @param {File|null} imageFile 
 * @returns Promise<AxiosResponse<PostResponse>>
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

/**
 * Delete a post (moderator/admin only)
 * @param {number} postId 
 * @returns Promise<AxiosResponse>
 */
export function deletePost(postId) {
  return API.delete(`/api/forum/posts/${postId}`);
}

/**
 * Update a post's content (moderator/admin only)
 * @param {number} postId 
 * @param {string} content 
 * @returns Promise<AxiosResponse>
 */
export function updatePost(postId, content) {
  return API.put(`/api/forum/posts/${postId}`, null, {
    params: { content }
  });
}

/**
 * Toggle comments on a post (moderator/admin only)
 * @param {number} postId 
 * @param {boolean} enabled 
 * @returns Promise<AxiosResponse>
 */
export function togglePostComments(postId, enabled) {
  return API.put(`/api/forum/posts/${postId}/toggle-comments`, null, {
    params: { enabled }
  });
}

/**
 * Delete a topic (moderator/admin only)
 * @param {number} topicId 
 * @returns Promise<AxiosResponse>
 */
export function deleteTopic(topicId) {
  return API.delete(`/api/forum/topics/${topicId}`);
}

/**
 * Get all available categories
 * @returns Promise<AxiosResponse<Category[]>>
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

// Add category management for admins
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

export async function deleteCategory(name) {
  try {
    const response = await API.delete(`/api/admin/forum/categories/${name}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting category:", error);
    throw error;
  }
}

export const getCategories = listCategories;

/**
 * Get topic details with posts
 * @param {number|string} topicId 
 * @returns Promise<AxiosResponse<TopicDetailResponse>>
 */
export async function getTopicDetail(topicId) {
  try {
    console.log(`Making API call to get topic detail for ID: ${topicId}`);
    const response = await API.get(`/api/forum/topics/${topicId}`);
    console.log('API response for topic detail:', response);
    return response.data;
  } catch (error) {
    console.error("Error getting topic detail:", error);
    console.error("Error response:", error.response?.data || 'No response data');
    throw error;
  }
}
