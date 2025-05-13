// src/auth/pages/Unauthorized.jsx
import React from "react";

export default function Unauthorized() {
  return (
    <div className="container mt-5">
      <h2 className="text-danger">403 — You do not have access to this page.</h2>
      <p>If you believe this is an error, please contact support.</p>
    </div>
  );
}
