import React from 'react';
import { useNotification } from '../contexts/NotificationContext';

export default function ToastNotification() {
	const { toast } = useNotification();

	if (!toast) return null;

	return (
		<div className={`toast show position-fixed top-0 end-0 m-3 bg-${toast.type}`} role="alert">
			<div className="toast-body text-white">
				{toast.message}
			</div>
		</div>
	);
}
