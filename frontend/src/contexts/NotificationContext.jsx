import React, {
	createContext,
	useContext,
	useEffect,
	useState,
	useCallback,
} from "react";
import {
	getNotifications,
	getUnreadCount,
	markAsRead,
	markAllAsRead,
} from "../services/notificationService";

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
	const [notifications, setNotifications] = useState([]);
	const [unreadCount, setUnreadCount] = useState(0);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [toast, setToast] = useState(null);

	// Fetch notifications (latest 10)
	const fetchNotifications = useCallback(async () => {
		setLoading(true);
		try {
			const data = await getNotifications(0, 10);
			setNotifications(data.content || []);
			setError(null);
		} catch (err) {
			setError(err.message || "Failed to fetch notifications");
		} finally {
			setLoading(false);
		}
	}, []);

	// Fetch unread count
	const fetchUnreadCount = useCallback(async () => {
		try {
			const data = await getUnreadCount();
			setUnreadCount(data || 0);
		} catch {
			setUnreadCount(0);
		}
	}, []);

	// Polling
	useEffect(() => {
		fetchNotifications();
		fetchUnreadCount();
		const interval = setInterval(() => {
			fetchNotifications();
			fetchUnreadCount();
		}, 10000);
		return () => clearInterval(interval);
	}, [fetchNotifications, fetchUnreadCount]);

	// Mark as read
	const handleMarkAsRead = async (id) => {
		await markAsRead(id);
		fetchNotifications();
		fetchUnreadCount();
	};

	// Mark all as read
	const handleMarkAllAsRead = async () => {
		await markAllAsRead();
		fetchNotifications();
		fetchUnreadCount();
	};

	// Show toast
	const showToast = (notification) => {
		setToast(notification);
		setTimeout(() => setToast(null), 4000);
	};

	return (
		<NotificationContext.Provider
			value={{
				notifications,
				unreadCount,
				loading,
				error,
				fetchNotifications,
				fetchUnreadCount,
				handleMarkAsRead,
				handleMarkAllAsRead,
				showToast,
				toast,
			}}
		>
			{children}
		</NotificationContext.Provider>
	);
}

export function useNotification() {
	return useContext(NotificationContext);
}
