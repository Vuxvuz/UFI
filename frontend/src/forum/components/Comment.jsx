import React, { useState } from "react";
import { addComment } from "../../services/forumService";
import VoteButtons from "./VoteButtons";

export default function Comment({ comment, onReplyAdded }) {
	const [replyContent, setReplyContent] = useState("");
	const [replyImage, setReplyImage] = useState(null);
	const [showReplyForm, setShowReplyForm] = useState(false);
	const BASE_IMAGE_URL = "http://localhost:8080/";

	const getImageUrl = (imageUrl) => {
		if (!imageUrl) return null;
		if (imageUrl.startsWith("http")) return imageUrl;
		if (imageUrl.startsWith("/"))
			return `${BASE_IMAGE_URL}${imageUrl.substring(1)}`;
		return `${BASE_IMAGE_URL}uploads/${imageUrl}`;
	};

	const handleAddReply = async () => {
		if (!replyContent.trim() && !replyImage) return;

		try {
			await addComment(comment.id, replyContent, replyImage);
			setReplyContent("");
			setReplyImage(null);
			setShowReplyForm(false);
			if (onReplyAdded) onReplyAdded();
		} catch (err) {
			console.error("Error adding reply:", err);
			alert("Failed to add reply");
		}
	};

	return (
		<div className="comment mb-3">
			<div className="d-flex">
				<VoteButtons
					postId={comment.id}
					upvotes={comment.upvotes}
					downvotes={comment.downvotes}
					userVoted={comment.userVoted}
					userVoteIsUpvote={comment.userVoteIsUpvote}
					onVoteChange={onReplyAdded}
				/>

				<div className="flex-grow-1">
					<div className="p-3 border rounded">
						<div className="d-flex justify-content-between">
							<strong>{comment.author}</strong>
							<small className="text-muted">
								{new Date(comment.createdAt).toLocaleString()}
							</small>
						</div>

						<div>{comment.content}</div>

						{comment.imageUrl && (
							<div className="mt-2">
								<img
									src={getImageUrl(comment.imageUrl)}
									alt="comment"
									className="img-fluid rounded"
									style={{ maxWidth: 200, maxHeight: 200 }}
								/>
							</div>
						)}

						<button
							className="btn btn-sm btn-link mt-2"
							onClick={() => setShowReplyForm(!showReplyForm)}
						>
							Reply
						</button>
					</div>

					{showReplyForm && (
						<div className="mt-2 ms-4">
							<textarea
								className="form-control"
								rows="2"
								placeholder="Write a reply..."
								value={replyContent}
								onChange={(e) => setReplyContent(e.target.value)}
							/>
							<input
								type="file"
								className="form-control mt-1"
								accept="image/*"
								onChange={(e) => setReplyImage(e.target.files[0] || null)}
							/>
							<div className="mt-1">
								<button
									className="btn btn-sm btn-primary"
									onClick={handleAddReply}
								>
									Add Reply
								</button>
								<button
									className="btn btn-sm btn-secondary ms-2"
									onClick={() => setShowReplyForm(false)}
								>
									Cancel
								</button>
							</div>
						</div>
					)}

					{/* Render nested replies */}
					{comment.replies && comment.replies.length > 0 && (
						<div className="ms-4 mt-2">
							{comment.replies.map((reply) => (
								<Comment
									key={reply.id}
									comment={reply}
									onReplyAdded={onReplyAdded}
								/>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
