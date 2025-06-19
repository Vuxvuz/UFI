import { Navigate } from "react-router-dom";
import useAuth from "./hooks/useAuth";

const ProtectedRoute = ({ children }) => {
	const { isAuthenticated, loading } = useAuth();

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
		return <Navigate to="/signin" replace />;
	}

	return children;
};

export default ProtectedRoute;
