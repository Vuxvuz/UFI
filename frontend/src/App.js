// src/App.js
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import NavBar       from "./components/NavBar";
import ChatIcon     from "./components/ChatIcon";
import PrivateRoute from "./components/PrivateRoute";

import LandingPage    from "./auth/pages/LandingPage";
import SignIn         from "./auth/pages/SignIn";
import Register       from "./auth/pages/Register";
import ForgotPassword from "./auth/pages/ForgotPassword";
import OTP            from "./auth/pages/OTP";
import ResetPassword  from "./auth/pages/ResetPassword";
import Unauthorized   from "./auth/pages/Unauthorized";

import Account from "./account/pages/Account";

import Homepage    from "./auth/pages/Homepage";
import Profile     from "./profile/pages/Profile";
import Forum       from "./forum/pages/Forum";
import TopicDetail from "./forum/pages/TopicDetail";
import Chatbot     from "./chatbot/pages/Chatbot";
import Dashboard   from "./dashboard/pages/Dashboard";


export default function App() {
  return (
    <BrowserRouter>
      {/* Navbar cố định */}
      <NavBar />

      {/* Đẩy nội dung xuống khỏi navbar */}
      <div className="mt-5 pt-3">
        <Routes>
          {/* Public */}
          <Route path="/"                   element={<LandingPage />} />
          <Route path="/signin"             element={<SignIn />} />
          <Route path="/register"           element={<Register />} />
          <Route path="/forgot-password"    element={<ForgotPassword />} />
          <Route path="/otp"                element={<OTP />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/unauthorized"       element={<Unauthorized />} />

          {/* Private (bất kỳ user nào đã login) */}
          <Route
            path="/home"
            element={
              <PrivateRoute>
                <Homepage />
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            }
          />
          <Route
            path="/forum"
            element={
              <PrivateRoute>
                <Forum />
              </PrivateRoute>
            }
          />

             {/* Account page */}
        <Route
          path="/account"
          element={
            <PrivateRoute>
              <Account />
            </PrivateRoute>
          }
       />

          <Route
            path="/forum/:topicId"
            element={
              <PrivateRoute>
                <TopicDetail />
              </PrivateRoute>
            }
          />

          
          <Route
            path="/chatbot"
            element={
              <PrivateRoute>
                <Chatbot />
              </PrivateRoute>
            }
          />

          {/* Chỉ ADMIN mới vào Dashboard */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute requiredRoles={["ROLE_ADMIN"]}>
                <Dashboard />
              </PrivateRoute>
            }
          />
        </Routes>
      </div>

      {/* Chat icon cố định */}
      <ChatIcon />
    </BrowserRouter>
  );
}
