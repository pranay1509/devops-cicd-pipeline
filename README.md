# DevOps CI/CD Pipeline

A complete DevOps project demonstrating Continuous Integration and Continuous Delivery (CI/CD) practices using Docker, Jenkins, automated testing, and Node.js. This project showcases the implementation of a task management application with an automated Jenkins pipeline for building, testing, and deployment workflows.

## Project Overview

This project was built to gain hands-on experience with modern DevOps practices and tools. It includes containerization using Docker, automated testing using Jest and Supertest, and CI/CD automation using Jenkins.

## Features

* Task Management Application
* REST API Support
* Docker Containerization
* Jenkins CI/CD Pipeline
* Automated Testing using Jest and Supertest
* Docker Compose Support
* Modular Node.js Application Structure
* Persistent JSON-based Data Storage

## Technologies Used

| Technology     | Purpose                    |
| -------------- | -------------------------- |
| Node.js        | Backend Application        |
| Docker         | Containerization           |
| Jenkins        | CI/CD Automation           |
| Docker Compose | Multi-container Management |
| Jest           | Unit Testing               |
| Supertest      | API Testing                |
| Git & GitHub   | Version Control            |

## Repository Structure

```text
devops-cicd-pipeline
│
├── README.md
├── Jenkinsfile
│
├── app/
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── app.js
│   ├── server.js
│   ├── index.js
│   ├── package.json
│   ├── package-lock.json
│   ├── index.html
│   ├── index.css
│   ├── tests/
│   └── data/
│
└── jenkins/
    ├── Dockerfile
    └── docker-compose.yml
```

## Installation

Clone the repository.

```bash
git clone <repository-url>

cd devops-cicd-pipeline
```

## Running the Application

Navigate to the application directory.

```bash
cd app

npm install

npm start
```

The application will be available locally once the server starts successfully.

## Running Tests

```bash
cd app

npm test
```

Automated tests verify the application's API functionality using Jest and Supertest.

## Docker Setup

Build the Docker image:

```bash
docker build -t devops-node-app .
```

Run the Docker container:

```bash
docker run -p 3000:3000 devops-node-app
```

For Docker Compose:

```bash
docker compose up

docker compose down
```

## Jenkins Pipeline

The Jenkins pipeline performs the following stages:

1. Verify Project Structure
2. Install Dependencies
3. Execute Automated Tests
4. Build Docker Image
5. Complete Pipeline Execution

The CI/CD workflow ensures that code changes are automatically validated before deployment processes are initiated.

## Future Improvements

The following technologies are planned for future implementation:

* GitHub Actions
* Terraform
* Kubernetes
* Prometheus
* Grafana
* Google Cloud Platform (GCP) Deployment
* Infrastructure as Code (IaC)
* Monitoring and Logging

## Learning Outcomes

This project demonstrates practical experience with:

* CI/CD Pipelines
* Docker Containerization
* Automated Testing
* Jenkins Automation
* Git and GitHub Workflows
* DevOps Best Practices
* Application Deployment Strategies

## Author

**Pranay Dadi**
