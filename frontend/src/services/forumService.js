import { API } from "./api";

/**
 * List all topics, optionally filtered by category
 */
export async function listTopics(category = null) {
	try {
		const endpoint =
			category && category !== "ALL"
				? `/api/forum/topics?category=${encodeURIComponent(category)}`
				: "/api/forum/topics";
		const response = await API.get(endpoint);
		return response.data;
	} catch (error) {
		console.error("Error listing topics:", error.response?.data || error);
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
		console.error("Error creating topic:", error.response?.data || error);
		throw error;
	}
}

/**
 * Get details of a specific topic (with posts)
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
 * Create a post in a topic
 */
export async function createPost(topicId, formData) {
	try {
		const response = await API.post(
			`/api/forum/topics/${topicId}/posts`,
			formData,
			{
				headers: { "Content-Type": "multipart/form-data" },
			},
		);
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
		const response = await API.post(`/api/forum/posts/${postId}/reply`, {
			content,
		});
		return response.data;
	} catch (error) {
		console.error("Error replying to post:", error.response?.data || error);
		throw error;
	}
}

/**
 * Vote on a post or topic
 */
export async function votePost(entityId, isUpvote, entityType) {
	try {
		console.log("Sending vote request:", { isUpvote }); // Debug line
		const response = await API.post(
			`/api/forum/${entityType.toLowerCase()}/${entityId}/vote`,
			{ isUpvote },
		);
		return response.data;
	} catch (error) {
		console.error("Error voting on entity:", error.response?.data || error);
		throw error;
	}
}

/**
 * Report a post
 */
export async function reportPost(postId, reason) {
	try {
		const response = await API.post(`/api/forum/posts/${postId}/report`, {
			reason,
		});
		return response.data;
	} catch (error) {
		console.error("Error reporting post:", error.response?.data || error);
		throw error;
	}
}

/**
 * Report an article
 */
export async function reportArticle(articleId, reason) {
	try {
		const response = await API.post(`/api/forum/articles/${articleId}/report`, {
			reason,
		});
		return response.data;
	} catch (error) {
		console.error("Error reporting article:", error.response?.data || error);
		throw error;
	}
}

/**
 * Get all categories
 */
export async function listCategories() {
	try {
		const response = await API.get("/api/forum/forum-categories");
		return response.data;
	} catch (error) {
		console.error("Error listing categories:", error.response?.data || error);
		throw error;
	}
}

// --- ADMIN / MODERATOR FUNCTIONS ---

/**
 * Delete a post
 */
export async function deletePost(postId) {
	try {
		const response = await API.delete(`/api/admin/posts/${postId}`);
		return response.data;
	} catch (error) {
		console.error("Error deleting post:", error.response?.data || error);
		throw error;
	}
}

/**
 * Update post content
 */
export async function updatePost(postId, content) {
	try {
		const response = await API.put(`/api/admin/posts/${postId}`, { content });
		return response.data;
	} catch (error) {
		console.error("Error updating post:", error.response?.data || error);
		throw error;
	}
}

/**
 * Toggle comments on a post
 */
export async function togglePostComments(postId, commentsEnabled) {
	try {
		const response = await API.put(
			`/api/admin/posts/${postId}/toggle-comments`,
			{ commentsEnabled },
		);
		return response.data;
	} catch (error) {
		console.error(
			"Error toggling post comments:",
			error.response?.data || error,
		);
		throw error;
	}
}

/**
 * Delete a topic
 */
export async function deleteTopic(topicId) {
	try {
		const response = await API.delete(`/api/admin/topics/${topicId}`);
		return response.data;
	} catch (error) {
		console.error("Error deleting topic:", error.response?.data || error);
		throw error;
	}
}

/**
 * Add a category
 */
export async function addCategory(categoryData) {
	try {
		const response = await API.post(
			"/api/admin/forum-categories",
			categoryData,
		);
		return response.data;
	} catch (error) {
		console.error("Error adding category:", error.response?.data || error);
		throw error;
	}
}

/**
 * Update a category
 */
export async function updateCategory(categoryId, categoryData) {
	try {
		const response = await API.put(
			`/api/admin/forum-categories/${categoryId}`,
			categoryData,
		);
		return response.data;
	} catch (error) {
		console.error("Error updating category:", error.response?.data || error);
		throw error;
	}
}

/**
 * Delete a category
 */
export async function deleteCategory(categoryId) {
	try {
		const response = await API.delete(
			`/api/admin/forum-categories/${categoryId}`,
		);
		return response.data;
	} catch (error) {
		console.error("Error deleting category:", error.response?.data || error);
		throw error;
	}
}

// Alias
export const getCategories = listCategories;
