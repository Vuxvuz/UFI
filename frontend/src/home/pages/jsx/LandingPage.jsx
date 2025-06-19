// src/auth/pages/LandingPage.jsx
import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { useNavigate } from "react-router-dom";

const LandingPage = () => {
	const navigate = useNavigate();

	return (
		<div className="d-flex flex-column align-items-center justify-content-center vh-100 bg-light">
			<h1 className="mb-3">Welcome to Health Awareness Platform</h1>
			<p className="mb-4">Join us in raising awareness and improving health.</p>
			<div>
				<button
					type="button"
					className="btn btn-primary"
					onClick={() => navigate("/home")}
				>
					Explore Now
				</button>
			</div>
		</div>
	);
};

export default LandingPage;
