import { GoogleLogin } from "@react-oauth/google";
import authService from "../services/authService";

const GoogleLoginButton = ({ onSuccess, onError }) => {
	const handleGoogleSuccess = async (credentialResponse) => {
		try {
			// Get id_token from credentialResponse
			const { credential } = credentialResponse;

			// Decode JWT to get basic information
			const payload = JSON.parse(atob(credential.split(".")[1]));

			// Call backend API with necessary information
			const response = await authService.googleLogin({
				email: payload.email,
				googleId: payload.sub,
				token: credential,
			});

			// Call onSuccess callback if login is successful
			if (onSuccess) {
				onSuccess(response.data);
			}
		} catch (error) {
			console.error("Google login error:", error);
			if (onError) {
				onError(error.response?.data?.message || "Google login failed");
			}
		}
	};

	return (
		<div className="d-flex justify-content-center">
			<GoogleLogin
				onSuccess={handleGoogleSuccess}
				onError={() => onError("Google login failed")}
				useOneTap
				theme="outline"
				size="large"
				text="signin_with"
				shape="rectangular"
				width="100%"
			/>
		</div>
	);
};

export default GoogleLoginButton;
