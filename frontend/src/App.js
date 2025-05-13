import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./auth/hooks/useAuth";

import LandingPage   from "./auth/pages/LandingPage";
import Homepage      from "./auth/pages/Homepage";
import SignIn        from "./auth/pages/SignIn";
import ResetPassword from "./auth/pages/ResetPassword";
import ForgotPassword from "./auth/pages/ForgotPassword";
import OTP           from "./auth/pages/OTP";
import Register      from "./auth/pages/Register";
import Unauthorized  from "./auth/pages/Unauthorized";

import ChatIcon      from "./components/ChatIcon";
import PrivateRoute  from "./components/PrivateRoute";

import Profile       from "./profile/pages/Profile";
import Dashboard     from "./dashboard/pages/Dashboard";
import Forum         from "./forum/pages/Forum";
import Chatbot       from "./chatbot/pages/Chatbot";
import TopicDetail from "./forum/pages/TopicDetail";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/register" element={<Register />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/otp" element={<OTP />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            }
          />

          <Route
            path="/home"
            element={
              <PrivateRoute>
                <Homepage />
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

          <Route
            path="/forum/:topicId"
            element={
              <PrivateRoute>
                <TopicDetail />
              </PrivateRoute>
            }
          />

          <Route
            path="/forum/*"
            element={
              <PrivateRoute>
                <Forum />
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
              <PrivateRoute requiredRoles={["ADMIN"]}>
                <Dashboard />
              </PrivateRoute>
            }
          />
        </Routes>
        <ChatIcon />
      </BrowserRouter>
    </AuthProvider>
  );
}
