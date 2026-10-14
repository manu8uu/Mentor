# Mentor

**An AI-powered personal productivity mobile application.**

Mentor is a mobile application designed to help users organize their daily tasks, manage personal goals, track their progress, and receive personalized assistance through an AI-powered mentor.

The project combines a Java and Spring Boot backend with a React Native mobile application, integrating database persistence, task scheduling, and AI-powered interactions.

> **Status:** In development.

## Features

- **Task management:** Create, organize, update, and delete tasks.
- **Recurring tasks:** Manage tasks that repeat over time.
- **Goal tracking:** Define personal goals and monitor progress.
- **Calendar:** Visualize and organize tasks by date.
- **Reminders:** Configure reminders for planned activities.
- **Statistics and progress tracking:** Review activity and progress over time.
- **AI mentor:** Interact with an AI-powered assistant through a chat interface.
- **Secure backend:** Authentication and security components implemented with Spring Security, alongside request validation.

## Tech Stack

### Backend
- Java 21
- Spring Boot 3
- Spring Data JPA
- Spring Security
- REST API
- PostgreSQL
- Flyway for database migrations
- Maven

### Mobile Application
- React Native
- Expo
- TypeScript
- Expo Router

### Infrastructure and Development Tools
- Docker
- Docker Compose
- Git
- GitHub
- npm

### Testing and Code Quality
- JUnit
- Integration testing

## Architecture

The project is organized into two main components:

```text
Mentor/
├── app/                 # Java backend
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/    # Application source code
│   │   │   └── resources/
│   │   │       ├── db/
│   │   │       │   └── migration/
│   │   │       └── application.yml
│   │   └── test/        # Automated tests
│   ├── pom.xml
│   └── docker-compose.yml
│
├── mentor-mobile/       # React Native mobile application
│   ├── src/
│   │   ├── app/         # Screens and navigation
│   │   ├── components/  # Reusable UI components
│   │   ├── lib/         # API client and utilities
│   │   └── store.tsx
│   ├── package.json
│   └── app.json
│
├── .gitignore
└── README.md
```

The mobile application communicates with the backend through a REST API. The backend manages application logic, database operations, and communication with the AI service.

## Requirements

Before running the project, make sure you have the following installed:

- Java Development Kit (JDK) 21
- Node.js and npm
- Docker Desktop, if using the Docker-based environment
- A PostgreSQL database, unless provided by your Docker configuration
- An API key for the AI provider used by the backend

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/manu8uu/Mentor.git
cd Mentor
```

### 2. Configure the backend

Navigate to the backend directory:

```bash
cd app
```

Configure the required environment variables and database connection settings according to the backend configuration.

Do not commit API keys, database passwords, or other secrets to the repository.

### 3. Start the database

If using the provided Docker Compose configuration, review the configuration and start the required services:

```bash
docker compose up -d
```

Ensure that the database is running and that the backend connection settings match the configured database.

### 4. Run the backend

From the `app` directory, run:

```bash
./mvnw spring-boot:run
```

On Windows PowerShell, use:

```powershell
.\mvnw.cmd spring-boot:run
```

The backend uses port `8080` by default, unless configured otherwise.

### 5. Configure the mobile application

Open a new terminal and navigate to the mobile directory:

```bash
cd mentor-mobile
```

Install the dependencies:

```bash
npm install
```

Configure the environment variables required by the mobile application, including the backend API URL.

For local development on a physical device, use the computer's reachable local network IP address rather than `localhost`. Ensure that both devices can communicate over the network.

### 6. Start the mobile application

```bash
npx expo start
```

Follow the Expo CLI instructions to open the application in a compatible development environment.

## AI Integration

Mentor integrates an external language model through an API to provide conversational assistance.

The backend exposes the AI chat endpoint:

```http
POST /api/ai/chat
```

AI provider credentials must be configured on the backend and kept out of version control. The mobile application should communicate with the backend rather than exposing private provider credentials in the client.

## Database and Migrations

The backend uses PostgreSQL for persistent data storage and Flyway to manage database schema migrations.

Migration scripts are located in:

```text
app/src/main/resources/db/migration/
```

Flyway applies the configured migrations when the backend starts, according to the application's database configuration.

## Testing

Run the backend tests from the `app` directory:

```powershell
.\mvnw.cmd test
```

Integration tests that depend on Docker require a working Docker environment.

## Security

Security is an important consideration in the project. The backend includes Spring Security and request validation, and the application uses environment-based configuration for sensitive values.

Recommended practices:

- Never commit `.env` files or private API keys.
- Keep secrets on the backend whenever possible.
- Validate incoming requests.
- Avoid exposing sensitive information in logs or error responses.
- Verify security configuration before deploying to production.

## Roadmap

Potential areas for further development include:

- Expanding AI mentor capabilities.
- Improving automated test coverage.
- Enhancing application performance and error handling.
- Strengthening security and configuration management.
- Preparing a production deployment workflow.

## Author

Developed as a personal software engineering project to explore backend development, mobile applications, database integration, and artificial intelligence.

**Repository:** [github.com/manu8uu/Mentor](https://github.com/manu8uu/Mentor)

