// src/account/pages/AccountPage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API } from "../../services/api"; // hoặc đúng path của bạn

export default function AccountPage() {
	const [profile, setProfile] = useState(null);
	const [passwords, setPasswords] = useState({
		current: "",
		new1: "",
		new2: "",
	});
	const [msg, setMsg] = useState("");
	const navigate = useNavigate();

	useEffect(() => {
		API.get("/api/user/profile")
			.then((res) => setProfile(res.data))
			.catch(() => navigate("/signin"));
	}, [navigate]);

	const handleChange = (e) => {
		setProfile({ ...profile, [e.target.name]: e.target.value });
	};

	const saveProfile = () => {
		API.put("/api/user/profile", profile)
			.then(() => setMsg("Profile updated successfully!"))
			.catch(() => setMsg("Error, please try again later."));
	};

	const changePassword = () => {
		if (passwords.new1 !== passwords.new2) {
			setMsg("New passwords do not match!");
			return;
		}

		// Sử dụng endpoint đổi mật khẩu cho user đã đăng nhập
		API.post("/api/user/change-password", {
			currentPassword: passwords.current,
			newPassword: passwords.new1,
		})
			.then(() => {
				setMsg("Password changed successfully!");
				setPasswords({ current: "", new1: "", new2: "" }); // Reset form
			})
			.catch((error) => {
				if (error.response?.status === 400) {
					setMsg("Current password is incorrect!");
				} else {
					setMsg("Password change failed. Please try again.");
				}
			});
	};

	if (!profile) return <div className="p-5 text-center">Loading...</div>;

	return (
		<div className="container mt-5 pt-5">
			<h2>Account Settings</h2>
			{msg && <div className="alert alert-info">{msg}</div>}

			<div className="card mb-4">
				<div className="card-header">Personal Information</div>
				<div className="card-body">
					<div className="row g-3">
						<div className="col-md-6">
							<label htmlFor="email" className="form-label">
								Email
							</label>
							<input
								id="email"
								type="email"
								name="email"
								className="form-control"
								value={profile.email}
								disabled
							/>
						</div>
						<div className="col-md-6">
							<label htmlFor="username" className="form-label">
								Username
							</label>
							<input
								id="username"
								type="text"
								name="username"
								className="form-control"
								value={profile.username}
								disabled
							/>
						</div>
						<div className="col-md-6">
							<label htmlFor="firstName" className="form-label">
								First Name
							</label>
							<input
								id="firstName"
								type="text"
								name="firstName"
								className="form-control"
								value={profile.firstName || ""}
								onChange={handleChange}
							/>
						</div>
						<div className="col-md-6">
							<label htmlFor="lastName" className="form-label">
								Last Name
							</label>
							<input
								id="lastName"
								type="text"
								name="lastName"
								className="form-control"
								value={profile.lastName || ""}
								onChange={handleChange}
							/>
						</div>
						<div className="col-md-6">
							<label htmlFor="phone" className="form-label">
								Phone
							</label>
							<input
								id="phone"
								type="text"
								name="phone"
								className="form-control"
								value={profile.phone || ""}
								onChange={handleChange}
							/>
						</div>
						<div className="col-12">
							<button
								type="button"
								className="btn btn-primary"
								onClick={saveProfile}
							>
								Save Profile
							</button>
						</div>
					</div>
				</div>
			</div>

			<div className="card mb-4">
				<div className="card-header">Change Password</div>
				<div className="card-body">
					<div className="row g-3">
						<div className="col-md-4">
							<label htmlFor="currentPassword" className="form-label">Current Password</label>
							<input
								id="currentPassword"
								type="password"
								className="form-control"
								value={passwords.current}
								onChange={(e) =>
									setPasswords((p) => ({ ...p, current: e.target.value }))
								}
							/>
						</div>
						<div className="col-md-4">
							<label htmlFor="newPassword" className="form-label">New Password</label>
							<input
								id="newPassword"
								type="password"
								className="form-control"
								value={passwords.new1}
								onChange={(e) =>
									setPasswords((p) => ({ ...p, new1: e.target.value }))
								}
							/>
						</div>
						<div className="col-md-4">
							<label htmlFor="confirmPassword" className="form-label">Confirm New Password</label>
							<input
								id="confirmPassword"
								type="password"
								className="form-control"
								value={passwords.new2}
								onChange={(e) =>
									setPasswords((p) => ({ ...p, new2: e.target.value }))
								}
							/>
						</div>
						<div className="col-12">
							<button type="button" className="btn btn-warning" onClick={changePassword}>
								Change Password
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
