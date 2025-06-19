// src/auth/pages/SignIn.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import GoogleLoginButton from "../components/GoogleLoginButton";
import useAuth from "../hooks/useAuth";
import authService from "../services/authService";
import "bootstrap/dist/css/bootstrap.min.css";

export default function SignIn() {
	const { login } = useAuth();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");
		setLoading(true);
		try {
			const res = await authService.login({ email, password });
			login(res.data);
			const prof = await authService.getProfile();

			// Force a refresh to update the NavBar
			window.location.href = prof.data.profileCompleted
				? "/chatbot"
				: "/profile";
		} catch (err) {
			setError(err.response?.data?.message || "Login failed");
		} finally {
			setLoading(false);
		}
	};

	const handleGoogleSuccess = async (data) => {
		try {
			login(data);
			const prof = await authService.getProfile();

			// Force a refresh to update the NavBar
			window.location.href = prof.data.profileCompleted
				? "/chatbot"
				: "/profile";
		} catch (_err) {
			setError("Unable to retrieve profile information");
		}
	};

	const handleGoogleError = (errorMsg) => {
		setError(errorMsg);
	};

	return (
		<div className="container mt-5">
			<div className="row justify-content-center">
				<div className="col-md-6">
					<div className="card shadow">
						<div className="card-body p-4">
							<h2 className="text-center mb-4">Sign In</h2>

							{error && <div className="alert alert-danger">{error}</div>}

							<form onSubmit={handleSubmit}>
								<div className="mb-3">
									<label htmlFor="email" className="form-label">
										Email
									</label>
									<input
										type="email"
										className="form-control"
										id="email"
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										required
									/>
								</div>

								<div className="mb-3">
									<label htmlFor="password" className="form-label">
										Password
									</label>
									<input
										type="password"
										className="form-control"
										id="password"
										value={password}
										onChange={(e) => setPassword(e.target.value)}
										required
									/>
								</div>

								<div className="mb-3 text-end">
									<Link to="/forgot-password">Forgot password?</Link>
								</div>

								<button
									type="submit"
									className="btn btn-primary w-100"
									disabled={loading}
								>
									{loading ? "Processing..." : "Sign In"}
								</button>
							</form>

							<div className="text-center my-3">
								<span>or</span>
							</div>

							<GoogleLoginButton
								onSuccess={handleGoogleSuccess}
								onError={handleGoogleError}
							/>

							<div className="mt-3 text-center">
								<span>Don't have an account? </span>
								<Link to="/register">Sign up now</Link>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
