// src/auth/components/AuthForm.jsx
import React from 'react';
import PropTypes from 'prop-types';
import 'bootstrap/dist/css/bootstrap.min.css';

const AuthForm = ({ title, errorMessage, onSubmit, children, submitLabel }) => {
  return (
    <div className="auth-form-container container my-5" style={{ maxWidth: '500px' }}>
      <h2 className="text-center mb-4">{title}</h2>
      {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}
      <form onSubmit={onSubmit}>
        {children}
        <button type="submit" className="btn btn-primary w-100 mt-3">
          {submitLabel || 'Submit'}
        </button>
      </form>
    </div>
  );
};

AuthForm.propTypes = {
  title: PropTypes.string.isRequired,
  errorMessage: PropTypes.string,
  onSubmit: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
  submitLabel: PropTypes.string
};

export default AuthForm;
