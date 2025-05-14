// src/auth/pages/ResetPassword.jsx
import React, { useState } from "react";
import authService from "../services/authService";
// import { useParams } from "react-router-dom"; // if your URL has a reset token

function ResetPassword() {
  // If you're passing the token via URL, you can retrieve it from params
  // const { token } = useParams();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleResetPassword = async (e) => {
    e.preventDefault();
    // Basic client-side check
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    try {
      setError("");
      setMessage("");
      // Call your reset password endpoint, passing in the token (if needed)
      const response = await authService.resetPassword({
        // token,
        newPassword,
      });
      console.log("Password reset successful:", response);
      setMessage("Your password has been updated successfully.");
    } catch (err) {
      console.error("Error resetting password:", err);
      setError("Failed to reset your password. Please try again.");
    }
  };

  return (
    <div className="resetpassword-container">
      <h2>Reset Password</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}
      <form onSubmit={handleResetPassword}>
        <div className="mb-3">
          <label>New Password</label>
          <input
            type="password"
            className="form-control"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label>Confirm New Password</label>
          <input
            type="password"
            className="form-control"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        <button className="btn btn-primary w-100">Update Password</button>
      </form>
    </div>
  );
}

export default ResetPassword;
