import React, { useState } from "react";
import { Modal, Button, Form, Alert } from "react-bootstrap";
import { FaFlag } from "react-icons/fa";

export default function ReportModal({
	show,
	onHide,
	onReport,
	entityType = "content", // 'post', 'article', 'user'
	entityId,
	entityTitle = "",
}) {
	const [reason, setReason] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState("");

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!reason.trim()) {
			setError("Please provide a reason for reporting.");
			return;
		}

		setIsSubmitting(true);
		setError("");

		try {
			await onReport(entityId, reason.trim());
			setReason("");
			onHide();
		} catch (err) {
			setError(
				err.response?.data?.message ||
					"Failed to submit report. Please try again.",
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleClose = () => {
		setReason("");
		setError("");
		onHide();
	};

	const getEntityTypeText = () => {
		switch (entityType) {
			case "post":
				return "post";
			case "article":
				return "article";
			case "user":
				return "user";
			default:
				return "content";
		}
	};

	return (
		<Modal show={show} onHide={handleClose} centered>
			<Modal.Header closeButton>
				<Modal.Title>
					<FaFlag className="me-2 text-danger" />
					Report {getEntityTypeText()}
				</Modal.Title>
			</Modal.Header>

			<Form onSubmit={handleSubmit}>
				<Modal.Body>
					{entityTitle && (
						<div className="mb-3">
							<strong>Content:</strong> {entityTitle}
						</div>
					)}

					{error && (
						<Alert variant="danger" onClose={() => setError("")} dismissible>
							{error}
						</Alert>
					)}

					<Form.Group>
						<Form.Label>Reason for reporting *</Form.Label>
						<Form.Control
							as="textarea"
							rows={4}
							value={reason}
							onChange={(e) => setReason(e.target.value)}
							placeholder={`Please explain why you are reporting this ${getEntityTypeText()}...`}
							required
						/>
						<Form.Text className="text-muted">
							Your report will be reviewed by our moderation team.
						</Form.Text>
					</Form.Group>
				</Modal.Body>

				<Modal.Footer>
					<Button
						variant="secondary"
						onClick={handleClose}
						disabled={isSubmitting}
					>
						Cancel
					</Button>
					<Button
						variant="danger"
						type="submit"
						disabled={isSubmitting || !reason.trim()}
					>
						{isSubmitting ? "Submitting..." : "Submit Report"}
					</Button>
				</Modal.Footer>
			</Form>
		</Modal>
	);
}
