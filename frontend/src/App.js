// src/App.js
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import NavBar       from "./components/NavBar";
import ChatIcon     from "./components/ChatIcon";
import PrivateRoute from "./components/PrivateRoute";
import Footer       from "./components/Footer";

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

import PlanList    from "./plans/pages/PlanList";
import PlanDetail  from "./plans/pages/PlanDetail";

export default function App() {
  return (
    <BrowserRouter>
      <NavBar />
      <div className="mt-5 pt-3">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/otp" element={<OTP />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/forum" element={<Forum />} />
          <Route path="/forum/:topicId" element={<TopicDetail />} />

          {/* Private routes */}
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
            path="/plans"
            element={
              <PrivateRoute>
                <PlanList />
              </PrivateRoute>
            }
          />
          <Route
            path="/plans/:planId"
            element={
              <PrivateRoute>
                <PlanDetail />
              </PrivateRoute>
            }
          />
          <Route
            path="/account"
            element={
              <PrivateRoute>
                <Account />
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
      <ChatIcon />
      <Footer />
    </BrowserRouter>
  );
}
