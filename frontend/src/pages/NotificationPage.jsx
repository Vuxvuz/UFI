import React, { useEffect, useState } from "react";
import { useNotification } from "../contexts/NotificationContext";

export default function NotificationPage() {
	const {
		notifications,
		loading,
		error,
		handleMarkAsRead,
		handleMarkAllAsRead,
		fetchNotifications,
	} = useNotification();
	const [page, setPage] = useState(0);
	const [size] = useState(20);

	useEffect(() => {
		fetchNotifications(page, size);
		// eslint-disable-next-line
	}, [page, size]);

	return (
		<div className="container py-4">
			<h2>Notifications</h2>
			<button
				className="btn btn-sm btn-outline-primary mb-3"
				onClick={handleMarkAllAsRead}
			>
				Mark all as read
			</button>
			{loading && <div>Loading...</div>}
			{error && <div className="text-danger">{error}</div>}
			<ul className="list-group">
				{notifications.map((n) => (
					<li
						key={n.id}
						className={`list-group-item d-flex justify-content-between align-items-center${n.status === "UNREAD" ? " fw-bold" : ""}`}
					>
						<div>
							<div>{n.title}</div>
							<small className="text-muted">{n.message}</small>
						</div>
						{n.status === "UNREAD" && (
							<button
								className="btn btn-sm btn-link"
								onClick={() => handleMarkAsRead(n.id)}
							>
								Mark as read
							</button>
						)}
					</li>
				))}
			</ul>
			{/* Pagination (tùy chỉnh nếu backend trả về totalPages) */}
			<div className="mt-3">
				<button
					className="btn btn-outline-secondary me-2"
					onClick={() => setPage((p) => Math.max(0, p - 1))}
					disabled={page === 0}
				>
					Previous
				</button>
				<span>Page {page + 1}</span>
				<button
					className="btn btn-outline-secondary ms-2"
					onClick={() => setPage((p) => p + 1)}
				>
					Next
				</button>
			</div>
		</div>
	);
}
