import React from 'react';

export default function AboutUs() {
    return (
        <div className="container py-5">
            <div className="row justify-content-center">
                <div className="col-lg-8">
                    <h1 className="text-center mb-5">About Ufit</h1>
                    
                    {/* Mission Section */}
                    <section className="mb-5">
                        <h2 className="h3 mb-4">Our Mission</h2>
                        <p className="lead mb-4">
                            At Ufit, we're dedicated to making health and fitness knowledge accessible to everyone. 
                            Our platform combines artificial intelligence, expert insights, and community support 
                            to help you achieve your health and fitness goals.
                        </p>
                    </section>

                    {/* What We Offer Section */}
                    <section className="mb-5">
                        <h2 className="h3 mb-4">What We Offer</h2>
                        <div className="row g-4">
                            <div className="col-md-6">
                                <div className="card h-100 border-0 shadow-sm">
                                    <div className="card-body">
                                        <h3 className="h5 mb-3">
                                            <i className="fas fa-robot text-primary me-2"></i>
                                            AI-Powered Assistance
                                        </h3>
                                        <p>24/7 personalized health and fitness guidance through our advanced AI chatbot.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="card h-100 border-0 shadow-sm">
                                    <div className="card-body">
                                        <h3 className="h5 mb-3">
                                            <i className="fas fa-newspaper text-success me-2"></i>
                                            Expert Content
                                        </h3>
                                        <p>Curated articles and news about health, nutrition, and fitness from reliable sources.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="card h-100 border-0 shadow-sm">
                                    <div className="card-body">
                                        <h3 className="h5 mb-3">
                                            <i className="fas fa-comments text-danger me-2"></i>
                                            Community Support
                                        </h3>
                                        <p>Connect with like-minded individuals, share experiences, and get motivated together.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="card h-100 border-0 shadow-sm">
                                    <div className="card-body">
                                        <h3 className="h5 mb-3">
                                            <i className="fas fa-shield-alt text-info me-2"></i>
                                            Trusted Platform
                                        </h3>
                                        <p>Built with security and privacy in mind, ensuring your data is safe and protected.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Our Team Section */}
                    <section className="mb-5">
                        <h2 className="h3 mb-4">Our Team</h2>
                        <p>
                            We are a dedicated team of health professionals, technology experts, and fitness 
                            enthusiasts working together to provide you with the best possible health and 
                            fitness platform.
                        </p>
                    </section>

                    {/* Contact Section */}
                    <section>
                        <h2 className="h3 mb-4">Contact Us</h2>
                        <p>
                            Have questions or suggestions? We'd love to hear from you. Reach out to us at{' '}
                            <a href="mailto:contact@ufit.com" className="text-decoration-none">
                                contact@ufit.com
                            </a>
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
} 