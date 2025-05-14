// src/auth/pages/ForgotPassword.jsx
import React, { useState } from "react";
import authService from "../services/authService";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    try {
      setError("");
      setMessage("");
      // Call your forgot password endpoint
      const response = await authService.forgotPassword({ email });
      setMessage("A link to reset your password has been sent to your email.");
      console.log(response);
    } catch (err) {
      console.error("Error sending reset link:", err);
      setError("Unable to send password reset link. Please try again.");
    }
  };

  return (
    <div className="forgotpassword-container">
      <h2>Forgot Password</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}
      <form onSubmit={handleForgotPassword}>
        <div className="mb-3">
          <label>Enter Your Email</label>
          <input
            type="email"
            className="form-control"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <button className="btn btn-primary w-100">Send Reset Link</button>
      </form>
    </div>
  );
}

export default ForgotPassword;
