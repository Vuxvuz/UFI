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

// Pages that have internal import errors or are not found by App.js
import Diet from "./info_news/pages/Recipe";             // Diet.jsx itself has an error finding '../../data/articles.json'
import Drug from "./info_news/pages/Drug";     // Changed from Diseases to Drug to match the actual component name
import Mental from "./info_news/pages/Mind";         // Mental.jsx itself has an error finding '../../data/articles.json'
import NewsPage from "./info_news/pages/NewsPage";     // NewsPage.jsx itself has an error finding '../components/CategoryList'
import Health from "./info_news/pages/Health";         // App.js cannot find this module. Ensure Health.jsx (or .js) exists at this exact path and casing.

export default function App() {
  return (
    <BrowserRouter>
      <NavBar />
      <div className="mt-5 pt-3"> {/* Consider making this dynamic based on NavBar height if NavBar is fixed */}
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
          
          {/* It seems you have multiple routes pointing to NewsPage for /info-news and /info-news/news. This is fine. */}
          <Route path="/info-news" element={<NewsPage />} />
          <Route path="/info-news/diet" element={<Diet />} />
          <Route path="/info-news/diseases" element={<Drug />} />
          <Route path="/info-news/mental" element={<Mental />} />
          <Route path="/info-news/news" element={<NewsPage />} />
          <Route path="/info-news/health" element={<Health />} />
          
          <Route path="/home" element={<Homepage />} />

          {/* Private routes */}
          {/* Your commented-out /home PrivateRoute is noted. The public /home route above will take precedence. */}
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