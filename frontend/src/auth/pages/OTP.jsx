// src/auth/pages/OTP.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../services/authService";
import "bootstrap/dist/css/bootstrap.min.css";

const OTP = () => {
	const [otp, setOtp] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();

	const handleOTPSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);
		setError("");
		try {
			// Verify the OTP using your auth service endpoint
			// This should return a success response if OTP is valid.
			const result = await authService.verifyOtp({ otp });
			console.log("OTP verified:", result);
			// If verification is successful, navigate to the Reset Password page.
			navigate("/resetpassword");
		} catch (err) {
			console.error("OTP verification failed:", err);
			setError("Invalid OTP. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="container d-flex flex-column align-items-center justify-content-center vh-100">
			<h2 className="mb-4">OTP Verification</h2>
			<p className="mb-4">
				Please enter the OTP sent to your email to verify your identity and
				proceed with resetting your password.
			</p>
			{error && <div className="alert alert-danger">{error}</div>}
			<form
				onSubmit={handleOTPSubmit}
				className="w-100"
				style={{ maxWidth: "400px" }}
			>
				<div className="mb-3">
					<input
						type="text"
						className="form-control"
						placeholder="Enter OTP"
						value={otp}
						onChange={(e) => setOtp(e.target.value)}
						required
					/>
				</div>
				<button
					type="submit"
					className="btn btn-primary w-100"
					disabled={loading}
				>
					{loading ? "Verifying..." : "Verify OTP"}
				</button>
			</form>
		</div>
	);
};

export default OTP;
