// // /src/dashboard/pages/Login.jsx
// import React, { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import axios from "axios";
// import "bootstrap/dist/css/bootstrap.min.css";

// function DashboardLogin() {
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [error, setError] = useState("");
//   const navigate = useNavigate();

//   // Hàm xử lý đăng nhập
//   const handleLogin = async (e) => {
//     e.preventDefault();
//     setError("");
//     try {
//       // Gửi request tới endpoint xác thực của backend
//       const response = await axios.post("http://localhost:8080/api/dashboard/login", {
//         email,
//         password,
//       });

//       // Ví dụ: nếu đăng nhập thành công, backend trả về một token trong response.data.token
//       localStorage.setItem("token", response.data.token);

//       // Điều hướng tới trang dashboard (hoặc trang admin) sau khi đăng nhập thành công
//       navigate("/dashboard");
//     } catch (err) {
//       console.error(err);
//       setError("Invalid credentials or insufficient permissions!");
//     }
//   };

//   return (
//     <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
//       <div className="card shadow" style={{ width: "400px" }}>
//         <div className="card-body">
//           <h3 className="card-title text-center mb-4">Admin / Dev Login</h3>
//           {error && <div className="alert alert-danger">{error}</div>}
//           <form onSubmit={handleLogin}>
//             <div className="mb-3">
//               <label htmlFor="email" className="form-label">Email</label>
//               <input 
//                 type="email" 
//                 className="form-control" 
//                 id="email" 
//                 placeholder="Enter email"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 required 
//               />
//             </div>
//             <div className="mb-3">
//               <label htmlFor="password" className="form-label">Password</label>
//               <input 
//                 type="password"
//                 className="form-control" 
//                 id="password" 
//                 placeholder="Enter password"
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//                 required 
//               />
//             </div>
//             <button type="submit" className="btn btn-primary w-100">Login</button>
//           </form>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default DashboardLogin;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../../services/api';
import useAuth from '../../auth/hooks/useAuth';

function DashboardLogin() {
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { user, isAdmin, isModerator } = useAuth();

  // If already logged in as admin/moderator, redirect to appropriate dashboard
  useEffect(() => {
    if (user) {
      if (isAdmin) {
        navigate('/dashboard/admin');
      } else if (isModerator) {
        navigate('/dashboard/moder');
      }
    }
  }, [user, isAdmin, isModerator, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const response = await API.post('/api/auth/login', credentials);
      
      if (response.data.result === 'SUCCESS') {
        const { token, user } = response.data.data;
        
        // Store token
        localStorage.setItem('token', token);
        
        // Check role and redirect
        redirectBasedOnRole(user.role);
      } else {
        setError('Login failed. Please check your credentials.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'An error occurred during login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const redirectBasedOnRole = (role) => {
    if (role.includes('ROLE_ADMIN')) {
      navigate('/dashboard/admin');
    } else if (role.includes('ROLE_MODERATOR')) {
      navigate('/dashboard/moder');
    } else {
      // Non-admin/moderator users don't have dashboard access
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Admin Dashboard
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to access the administration panel
          </p>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={credentials.email}
                onChange={handleChange}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={credentials.password}
                onChange={handleChange}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                isLoading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
            >
              {isLoading ? (
                <>
                  <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                    <svg className="animate-spin h-5 w-5 text-indigo-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </span>
                  Processing...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </div>
        </form>
        
        <div className="text-center mt-4">
          <a href="/" className="text-sm text-indigo-600 hover:text-indigo-500">
            Return to homepage
          </a>
        </div>
      </div>
    </div>
  );
}

export default DashboardLogin;
