# UFit - Health  Platform

## Overview
UFit is a comprehensive health and fitness platform designed to provide users with reliable health information through an interactive forum and AI-powered chatbot. The platform aggregates content from trusted medical sources and allows users to search for health topics, participate in discussions, and receive personalized fitness guidance.

## Features

- **Health Information Forum**: Browse, search, and contribute to discussions on various health topics
- **AI-Powered Chatbot**: Get personalized health and fitness advice using OpenAI integration
- **User Profiles**: Track personal fitness goals, measurements, and progress
- **Content Aggregation**: Access verified health information from trusted sources
- **Responsive Design**: Optimized for both desktop and mobile devices

## Technology Stack

### Backend
- **Java Spring Boot 3** - Core framework for building the application
- **MySQLL** - Relational database for data storage
- **Spring Data JPA** - ORM for database interactions
- **Spring Security** - Authentication and authorization
- **WebClient** - For external API integration (OpenAI)
- **Lombok** - Reduces boilerplate code

### Frontend
- **React** - UI library for building interactive components
- **React Router** - Navigation and routing
- **Tailwind CSS** - Utility-first CSS framework for styling
- **Axios** - HTTP client for API requests

## Installation

### Prerequisites
- Java JDK 17
- React.js 
- npm 19
- MySQL database

### Backend Setup
1. Clone the repository
2. Configure database in `application.properties`
3. Run the server
mvn clean install
mvn spring-boot:run

### Frontend Setup
1. Clone the repository
2. Run the server
npm start

## Usage
After starting both backend and frontend servers:
1. Access the application at `http://localhost:3000`
2. Register for an account or log in (support Google Account)
3. Explore the forum, search for health topics, or interact with the chatbot
4. Update your profile with health goals and measurements

## Project Structure
```
ufit/
├── server/             # Backend code
│   ├── src/main/java/
│   │   ├── controller/ # REST controllers
│   │   ├── service/    # Business logic
│   │   ├── repository/ # Data access
│   │   ├── entity/     # Database entities
│   │   ├── dto/        # Data transfer objects
│   │   └── config/     # Configuration classes
│   └── src/main/resources/
│       └── application.properties
│
└── frontend/           # Frontend code
    ├── public/
    └── src/
        ├── components/ # React components
        ├── services/   # API services
        ├── pages/      # Page components
        └── App.js      # Main application component
```

## Future Enhancements
- Web scraping integration using Playwright for content aggregation
- Advanced analytics dashboard for health metrics
- Community features for group challenges and support
- Mobile application development

## License
[MIT License](LICENSE)