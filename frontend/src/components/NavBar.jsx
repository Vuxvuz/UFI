// frontend/src/components/NavBar.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaMoon, FaSun, FaUserCircle, FaSignOutAlt } from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

export default function NavBar() {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/signin");
  };

  const toggleDark = () => {
    setDarkMode((d) => !d);
    document.body.classList.toggle("dark-mode");
  };

  return (
    <nav className={`navbar fixed-top navbar-expand-lg ${darkMode ? "navbar-dark bg-dark" : "navbar-light bg-light"}`}>
      <div className="container">
        <Link className="navbar-brand me-4" to="/home">UFit</Link>

        <button className="navbar-toggler" type="button" data-bs-toggle="collapse"
                data-bs-target="#main-nav" aria-controls="main-nav" aria-expanded="false"
                aria-label="Toggle navigation">
          <span className="navbar-toggler-icon" />
        </button>

        <div className="collapse navbar-collapse" id="main-nav">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <Link className="nav-link" to="/forum">Forum</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/chatbot">Chatbot</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/plans">My Plans</Link>
            </li>
          </ul>

          <ul className="navbar-nav ms-auto align-items-center">
            <li className="nav-item me-3">
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={toggleDark}
                title="Toggle Dark Mode"
                aria-label="Toggle Dark Mode"
              >
                {darkMode ? <FaSun /> : <FaMoon />}
              </button>
            </li>
            <li className="nav-item dropdown">
              <a className="nav-link dropdown-toggle d-flex align-items-center" href="/" id="accountMenu" role="button"
                 data-bs-toggle="dropdown" aria-expanded="false">
                <FaUserCircle size={20} className="me-1" /> Account
              </a>
              <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="accountMenu">
                <li>
                  <Link className="dropdown-item" to="/profile">
                    My Profile
                  </Link>
                  <Link className="dropdown-item" to="/account">
                    My Account
                  </Link>
                </li>
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <button className="dropdown-item d-flex align-items-center" onClick={handleLogout}>
                    <FaSignOutAlt className="me-1" /> Logout
                  </button>
                </li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}