// src/App.js

import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Account from "./account/pages/Account";
import ForgotPassword from "./auth/pages/ForgotPassword";
import Homepage from "./auth/pages/Homepage";
import LandingPage from "./auth/pages/LandingPage";
import OTP from "./auth/pages/OTP";
import Register from "./auth/pages/Register";
import ResetPassword from "./auth/pages/ResetPassword";
import SignIn from "./auth/pages/SignIn";
import Unauthorized from "./auth/pages/Unauthorized";
import Chatbot from "./chatbot/pages/Chatbot";
import ChatIcon from "./components/ChatIcon";
import Footer from "./components/Footer";
import NavBar from "./components/NavBar";
import NotificationBell from "./components/NotificationBell";
import PrivateRoute from "./components/PrivateRoute";
import ToastNotification from "./components/ToastNotification";
import { NotificationProvider } from "./contexts/NotificationContext";
import Forum from "./forum/pages/Forum";
import TopicDetail from "./forum/pages/TopicDetail";
import ArticleDetail from "./info_news/components/ArticleDetails";
import Diseases from "./info_news/pages/Diseases";
import Drug from "./info_news/pages/Drug";
import General from "./info_news/pages/General";
import Health from "./info_news/pages/Health";
import Mind from "./info_news/pages/Mind";
import NewsFullPage from "./info_news/pages/News";
import NewsPage from "./info_news/pages/NewsPage";
import Nutrition from "./info_news/pages/Nutrition";
import Diet from "./info_news/pages/Recipe";
import Symptoms from "./info_news/pages/Symptoms";
import NotificationPage from "./pages/NotificationPage";
import PlanDetail from "./plans/pages/PlanDetail";
import PlanList from "./plans/pages/PlanList";
import Profile from "./profile/pages/Profile";
import DashboardRoutes from "./routes/DashboardRoutes";
import AboutUs from './auth/pages/AboutUs';

export default function App() {
	return (
		<NotificationProvider>
			<BrowserRouter>
				<NavBar />
				<ToastNotification />
				<main>
					<div className="mt-5 pt-3">
						<Routes>
							{/* === Public Routes === */}
							<Route path="/" element={<Navigate to="/home" replace />} />
							<Route path="/signin" element={<SignIn />} />
							<Route path="/register" element={<Register />} />
							<Route path="/forgot-password" element={<ForgotPassword />} />
							<Route path="/otp" element={<OTP />} />
							<Route
								path="/reset-password/:token"
								element={<ResetPassword />}
							/>
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
							<Route path="/info-news/diseases" element={<Diseases />} />
							<Route path="/info-news/general" element={<General />} />
							<Route path="/info-news/symptoms" element={<Symptoms />} />

							{/* === Public Homepage === */}
							<Route path="/home" element={<Homepage />} />

							{/* === Article Detail (public) === */}
							<Route path="/article/:id" element={<ArticleDetail />} />

							{/* === Authenticated Routes (requires login) === */}
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

							{/* === Dashboard (Admin/Moderator only) === */}
							<Route
								path="/dashboard/*"
								element={
									<PrivateRoute
										requiredRoles={["ROLE_ADMIN", "ROLE_MODERATOR"]}
									>
										<DashboardRoutes />
									</PrivateRoute>
								}
							/>

							<Route path="/notifications" element={<NotificationPage />} />

							<Route path="/about" element={<AboutUs />} />

							{/* === Fallback: everything else → /signin === */}
							<Route path="*" element={<Navigate to="/signin" replace />} />
						</Routes>
					</div>
				</main>

				<ChatIcon />
				<Footer />
			</BrowserRouter>
		</NotificationProvider>
	);
}
