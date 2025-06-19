import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./Homepage.css";

const Homepage = () => {
	const navigate = useNavigate();

	// Initialize Bootstrap carousel
	useEffect(() => {
		// Check if Bootstrap is available
		if (typeof window !== "undefined" && window.bootstrap) {
			// Initialize all carousels
			const carouselElement = document.getElementById("homepageCarousel");
			if (carouselElement) {
				new window.bootstrap.Carousel(carouselElement, {
					interval: 5000,
					ride: "carousel",
					wrap: true,
				});
			}
		}
	}, []);

	// High-quality health and fitness related images for carousel
	const carouselSlides = [
		{
			heading: "Take Control of Your Health",
			sub: "Get personalized health advice from our AI assistant",
			img: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1600&q=80",
			action: "/chatbot",
		},
		{
			heading: "Discover Healthy Recipes",
			sub: "Nutritious and delicious meals for your wellness journey",
			img: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1600&q=80",
			action: "/info-news/nutrition",
		},
		{
			heading: "Join Our Health Community",
			sub: "Connect with experts and peers for better health outcomes",
			img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1600&q=80",
			action: "/signin",
		},
	];

	// Featured categories with icons and descriptions
	const featuredCategories = [
		{
			id: 1,
			title: "AI Chatbot",
			icon: "fa-robot",
			color: "#3498db",
			description: "24/7 health and fitness consultation with our smart AI assistant",
			link: "/chatbot"
		},
		{
			id: 2,
			title: "News & Articles",
			icon: "fa-newspaper",
			color: "#2ecc71",
			description: "Stay updated with the latest health and wellness information",
			link: "/info-news"
		},
		{
			id: 3,
			title: "Community",
			icon: "fa-comments",
			color: "#e74c3c",
			description: "Join discussions and share experiences with the community",
			link: "/forum"
		},
		{
			id: 4,
			title: "About Us",
			icon: "fa-info-circle",
			color: "#9b59b6",
			description: "Learn more about our mission and the team behind Ufit",
			link: "/about"
		}
	];

	const articles = [
		{
			id: 1,
			title: "Understanding Heart Disease",
			summary:
				"Stay informed with latest updates and research on heart disease.",
			image:
				"https://images.unsplash.com/photo-1505751172876-fa1923c5c528?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&q=80",
		},
		{
			id: 2,
			title: "Benefits of Regular Exercise",
			summary:
				"Explore the positive impact of physical activity on your health.",
			image:
				"https://images.unsplash.com/photo-1538805060514-97d9cc17730c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&q=80",
		},
		{
			id: 3,
			title: "Tips for a Balanced Diet",
			summary: "Learn how to maintain a nutritious and balanced diet.",
			image:
				"https://images.unsplash.com/photo-1490645935967-10de6ba17061?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&q=80",
		},
	];

	const topics = [
		{
			id: 1,
			title: "Managing stress effectively",
			replies: 24,
			category: "Mental Health",
		},
		{
			id: 2,
			title: "How to improve sleep quality",
			replies: 18,
			category: "Wellness",
		},
		{
			id: 3,
			title: "Best practices for weight loss",
			replies: 32,
			category: "Fitness",
		},
	];

	// Handle navigation
	const handleArticleClick = () => navigate("/info-news");
	const handleTopicClick = () => navigate("/forum");
	const handleCategoryClick = (category) => {
		switch (category.title.toLowerCase()) {
			case "mental wellness":
				navigate("/info-news/mental");
				break;
			case "nutrition & diet":
				navigate("/info-news/nutrition");
				break;
			case "physical health":
				navigate("/info-news/health");
				break;
			default:
				navigate("/forum");
		}
	};

	return (
		<div className="homepage bg-light">
			{/* Carousel */}
			<section className="container-fluid px-0">
				<div
					id="homepageCarousel"
					className="carousel slide"
					data-bs-ride="carousel"
				>
					<div className="carousel-indicators">
						{carouselSlides.map((_, idx) => (
							<button
								key={idx}
								type="button"
								data-bs-target="#homepageCarousel"
								data-bs-slide-to={idx}
								className={idx === 0 ? "active" : ""}
								aria-current={idx === 0 ? "true" : "false"}
								aria-label={`Slide ${idx + 1}`}
							></button>
						))}
					</div>
					<div className="carousel-inner">
						{carouselSlides.map((slide, idx) => (
							<div
								key={idx}
								className={`carousel-item${idx === 0 ? " active" : ""}`}
							>
								<div
									className="carousel-img"
									style={{ backgroundImage: `url(${slide.img})` }}
								>
									<div className="carousel-caption-custom">
										<h2>{slide.heading}</h2>
										<p className="lead">{slide.sub}</p>
										<button
											className="btn btn-primary btn-lg mt-2"
											onClick={() => navigate(slide.action)}
										>
											Learn More
										</button>
									</div>
								</div>
							</div>
						))}
					</div>
					<button
						className="carousel-control-prev"
						type="button"
						data-bs-target="#homepageCarousel"
						data-bs-slide="prev"
					>
						<span className="carousel-control-prev-icon" aria-hidden="true" />
						<span className="visually-hidden">Previous</span>
					</button>
					<button
						className="carousel-control-next"
						type="button"
						data-bs-target="#homepageCarousel"
						data-bs-slide="next"
					>
						<span className="carousel-control-next-icon" aria-hidden="true" />
						<span className="visually-hidden">Next</span>
					</button>
				</div>
			</section>

			{/* Main Features */}
			<section className="container py-5">
				<h2 className="text-center mb-5">Explore Ufit</h2>
				<div className="row g-4">
					{featuredCategories.map((feature) => (
						<div key={feature.id} className="col-md-6 col-lg-3">
							<div 
								className="card h-100 border-0 shadow-sm hover-lift" 
								onClick={() => navigate(feature.link)}
								style={{cursor: 'pointer'}}
							>
								<div className="card-body text-center p-4">
									<div 
										className="rounded-circle mx-auto mb-4 d-flex align-items-center justify-content-center"
										style={{
											width: '80px',
											height: '80px',
											backgroundColor: feature.color,
											color: 'white'
										}}
									>
										<i className={`fas ${feature.icon} fa-2x`}></i>
									</div>
									<h4 className="card-title mb-3">{feature.title}</h4>
									<p className="card-text text-muted">{feature.description}</p>
								</div>
							</div>
						</div>
					))}
				</div>
			</section>

			{/* News & Forum */}
			<section className="container py-5">
				<div className="row gx-5">
					{/* News & Articles */}
					<div className="col-lg-6 mb-4">
						<div className="d-flex justify-content-between align-items-center mb-4">
							<h3 className="section-title m-0">Latest Articles</h3>
							<div className="border-bottom border-primary" style={{ width: '50px', height: '3px' }}></div>
						</div>
						<div className="article-container">
							{articles.map((article) => (
								<div
									key={article.id}
									className="card hover-shadow mb-4 article-card"
									style={{ cursor: 'pointer' }}
								>
									<div className="card-body d-flex align-items-center">
										<div className="article-image me-3">
											<img
												src={article.image}
												alt={article.title}
												className="rounded"
												style={{ width: "120px", height: "120px", objectFit: "cover" }}
											/>
										</div>
										<div className="article-content">
											<h5 className="card-title mb-2">{article.title}</h5>
											<p className="card-text text-muted mb-0">
												{article.summary}
											</p>
										</div>
									</div>
								</div>
							))}
						</div>
						<div className="text-center mt-4">
							<button
								className="btn btn-outline-primary btn-lg"
								onClick={() => navigate('/info-news')}
							>
								<i className="fas fa-newspaper me-2"></i>
								Explore All Articles
							</button>
						</div>
					</div>

					{/* Forum Topics */}
					<div className="col-lg-6">
						<div className="d-flex justify-content-between align-items-center mb-4">
							<h3 className="section-title m-0">Popular Forum Topics</h3>
							<div className="border-bottom border-primary" style={{ width: '50px', height: '3px' }}></div>
						</div>
						<div className="topic-container">
							{topics.map((topic) => (
								<div
									key={topic.id}
									className="card hover-shadow mb-4 topic-card"
									style={{ cursor: 'pointer' }}
								>
									<div className="card-body">
										<div className="d-flex align-items-center mb-3">
											<div className="icon-circle-topic me-3">
												<i className="fas fa-comments fa-lg"></i>
											</div>
											<h5 className="mb-0">{topic.title}</h5>
										</div>
										<div className="d-flex justify-content-between align-items-center">
											<span className="badge bg-secondary">
												{topic.category}
											</span>
											<span className="text-muted">
												<i className="fas fa-reply me-1"></i> {topic.replies} replies
											</span>
										</div>
									</div>
								</div>
							))}
						</div>
						<div className="text-center mt-4">
							<button
								className="btn btn-outline-primary btn-lg"
								onClick={() => navigate('/forum')}
							>
								<i className="fas fa-comments me-2"></i>
								Join the Discussion
							</button>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
};

export default Homepage;
