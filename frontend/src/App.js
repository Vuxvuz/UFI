// src/App.js
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

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

import PlanList    from "./plans/pages/PlanList";
import PlanDetail  from "./plans/pages/PlanDetail";

import NewsPage      from "./info_news/pages/NewsPage";
import NewsFullPage  from "./info_news/pages/News";
import Diet          from "./info_news/pages/Recipe";
import Drug          from "./info_news/pages/Drug";
import Mind          from "./info_news/pages/Mind";
import Nutrition     from "./info_news/pages/Nutrition";
import Health        from "./info_news/pages/Health";
import ArticleDetail from "./info_news/components/ArticleDetails";

import DashboardRoutes from "./routes/DashboardRoutes";

export default function App() {
  return (
    <BrowserRouter>
      {/* NavBar phải nằm trong BrowserRouter để hoạt động đúng */}
      <NavBar />

      <div className="mt-5 pt-3">
        <Routes>
          {/* === Các route công khai (public) === */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/otp" element={<OTP />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* === Forum (public) === */}
          <Route path="/forum" element={<Forum />} />
          <Route path="/forum/:topicId" element={<TopicDetail />} />

          {/* === Info News (public) === */}
          <Route path="/news" element={<NewsPage />} />
          <Route path="/info-news" element={<NewsPage />} />
          <Route path="/info-news/news" element={<NewsPage />} />
          <Route path="/news/full" element={<NewsFullPage />} />
          <Route path="/info-news/full-news" element={<NewsFullPage />} />
          <Route path="/info-news/diet" element={<Diet />} />
          <Route path="/info-news/drug" element={<Drug />} />
          <Route path="/info-news/mental" element={<Mind />} />
          <Route path="/info-news/nutrition" element={<Nutrition />} />
          <Route path="/info-news/health" element={<Health />} />

          {/* === Public Homepage === */}
          <Route path="/home" element={<Homepage />} />

          {/* === Article Detail (public) === */}
          <Route path="/article/:id" element={<ArticleDetail />} />

          {/* === Các route yêu cầu đăng nhập (authenticated) === */}
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

          {/* === Dashboard (chỉ Admin hoặc Moderator) === */}
          <Route
            path="/dashboard/*"
            element={
              <PrivateRoute requiredRoles={["ROLE_ADMIN", "ROLE_MODERATOR"]}>
                <DashboardRoutes />
              </PrivateRoute>
            }
          />

          {/* === Fallback: mọi đường dẫn khác chuyển về /signin === */}
          <Route path="*" element={<Navigate to="/signin" replace />} />
        </Routes>
      </div>

      <ChatIcon />
      <Footer />
    </BrowserRouter>
  );
}
