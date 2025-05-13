// src/auth/pages/Homepage.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

const Homepage = () => {
  const navigate = useNavigate();

  return (
    <div className="container mt-5">
      <h1 className="text-center mb-4">Homepage</h1>
      <div className="row">
        <div className="col-md-6">
          <h2>Our Mission</h2>
          <p>
            We provide quality services with a minimalist, user-friendly design.
            Our focus is on simplicity and elegance.
            
          </p>
          <p>
            Our AI-powered fitness coach helps you achieve your goals with personalized plans and expert advice.
          </p>
        </div>
        <div className="col-md-6">
          {/* Replace with your image or illustration */}
          <img
            src="https://via.placeholder.com/500x300"
            alt="Sample"
            className="img-fluid rounded"
          />
        </div>
      </div>
      <div className="text-center mt-5">
        <button
          className="btn btn-primary me-2"
          onClick={() => navigate("/register")}
        >
          <i className="fas fa-user-plus me-1"></i>
          Register
        </button>
        <button
          className="btn btn-outline-primary"
          onClick={() => navigate("/signin")}
        >
          <i className="fas fa-sign-in-alt me-1"></i>
          Sign In
        </button>
      </div>
    </div>
  );
};

export default Homepage;
