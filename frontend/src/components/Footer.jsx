/* eslint-disable jsx-a11y/anchor-is-valid */
import React from "react";
import { Link } from "react-router-dom";
import "./Footer.css";

export default function Footer() {
	const currentYear = new Date().getFullYear();

	return (
		<footer className="footer mt-auto py-4">
			<div className="container">
				<div className="row">
					<div className="col-md-4 mb-4 mb-md-0">
						<h5 className="mb-3">UFit</h5>
						<p className="mb-0">
							Your personal health and fitness companion. Get customized workout
							plans, nutrition advice, and connect with a community of fitness
							enthusiasts.
						</p>
					</div>
					<div className="col-md-2 mb-4 mb-md-0">
						<h5 className="mb-3">Links</h5>
						<ul className="list-unstyled">
							<li className="mb-2">
								<Link to="/home">Home</Link>
							</li>
							<li className="mb-2">
								<Link to="/forum">Forum</Link>
							</li>
							<li className="mb-2">
								<Link to="/plans">Plans</Link>
							</li>
							<li className="mb-2">
								<Link to="/info-news">News</Link>
							</li>
						</ul>
					</div>
					<div className="col-md-2 mb-4 mb-md-0">
						<h5 className="mb-3">Support</h5>
						<ul className="list-unstyled">
							<li className="mb-2">
								<Link to="/faq">FAQ</Link>
							</li>
							<li className="mb-2">
								<Link to="/contact">Contact Us</Link>
							</li>
							<li className="mb-2">
								<Link to="/privacy">Privacy Policy</Link>
							</li>
							<li className="mb-2">
								<Link to="/terms">Terms of Service</Link>
							</li>
						</ul>
					</div>
					<div className="col-md-4">
						<h5 className="mb-3">Connect with Us</h5>
						<div className="social-links mb-3">
							<a href="#" className="me-3">
								<i className="fab fa-facebook-f"></i>
							</a>
							<a href="#" className="me-3">
								<i className="fab fa-twitter"></i>
							</a>
							<a href="#" className="me-3">
								<i className="fab fa-instagram"></i>
							</a>
							<a href="#" className="me-3">
								<i className="fab fa-youtube"></i>
							</a>
						</div>
						<p className="mb-0">
							Subscribe to our newsletter for latest updates
						</p>
						<div className="input-group mt-2">
							<input
								type="email"
								className="form-control"
								placeholder="Your email"
							/>
							<button className="btn btn-primary" type="button">
								Subscribe
							</button>
						</div>
					</div>
				</div>
				<hr className="mt-4" />
				<div className="row">
					<div className="col-md-6 text-center text-md-start">
						<p className="mb-0">
							&copy; {currentYear} UFit. All rights reserved.
						</p>
					</div>
					<div className="col-md-6 text-center text-md-end">
						<p className="mb-0">
							<Link to="/privacy" className="me-3">
								Privacy
							</Link>
							<Link to="/terms">Terms</Link>
						</p>
					</div>
				</div>
			</div>
		</footer>
	);
}
