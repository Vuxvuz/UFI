// src/auth/pages/LandingPage.jsx
import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { useNavigate } from "react-router-dom";

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="d-flex flex-column align-items-center justify-content-center vh-100 bg-light">
      <h1 className="mb-3">Welcome to Our Website</h1>
      <p className="mb-4">Experience minimalism and elegance at its finest.</p>
      <div>
        <button 
          className="btn btn-primary"
          onClick={() => navigate("/home")}
        >
          Let's start!
        </button>
      </div>
    </div>
  );
};

export default LandingPage;
