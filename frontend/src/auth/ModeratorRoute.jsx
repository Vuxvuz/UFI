import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import useAuth from "./hooks/useAuth";

const ModeratorRoute = ({ children }) => {
	const { isAuthenticated, roles, loading } = useAuth();

	// Add debugging for roles
	useEffect(() => {
		console.log("ModeratorRoute - Auth state:", {
			isAuthenticated,
			roles,
			loading,
		});
	}, [isAuthenticated, roles, loading]);

	if (loading) {
		return (
			<div
				className="d-flex justify-content-center align-items-center"
				style={{ height: "300px" }}
			>
				<div className="spinner-border text-primary" role="progressbar">
					<span className="visually-hidden">Loading...</span>
				</div>
			</div>
		);
	}

	if (!isAuthenticated) {
		console.log("ModeratorRoute - Not authenticated, redirecting to signin");
		return <Navigate to="/signin" replace />;
	}

	// Check if user has ROLE_ADMIN or ROLE_MODERATOR
	const hasAccess = roles.some(
		(role) => role === "ROLE_ADMIN" || role === "ROLE_MODERATOR",
	);

	console.log("ModeratorRoute - Access check:", { hasAccess, roles });

	if (!hasAccess) {
		console.log("ModeratorRoute - No admin/mod role, redirecting to home");
		return <Navigate to="/home" replace />;
	}

	return children;
};

export default ModeratorRoute;
