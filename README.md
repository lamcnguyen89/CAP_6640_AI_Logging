# VERA (Virtual Experience Research Accelerator)

VERA is a cloud-based data analytics platform for interactive media and biosignals research. It enables researchers to collect, analyze, and visualize data from virtual reality experiences and biometric sensors.

## Project Objectives

- **Data Collection**: Capture and process biometric data from VR/AR experiences
- **Research Analytics**: Provide tools for statistical analysis and visualization
- **User Management**: Secure participant and researcher account management
- **Experiment Management**: Design, deploy, and monitor research studies

## Architecture Overview

VERA is a containerized full-stack application with clear separation of concerns:

```
├── /client          # React + TypeScript frontend (Vite)
├── /server          # Node.js + Express API (TypeScript)
├── /docs            # Sphinx documentation
├── /scripts         # Build, deployment, and utility scripts
├── /mongo           # MongoDB configuration
└── docker-compose.* # Multiple environment configurations
```

### Core Components

**Frontend (`/client`)**

- React with TypeScript and Vite build system
- Redux for state management
- Component-based architecture with reusable UI elements

**Backend (`/server`)**

- Express.js API with TypeScript
- MongoDB with Mongoose ODM
- JWT authentication with Passport.js
- Comprehensive test suite (Jest)

**Infrastructure**

- Docker Compose for environment management
- MongoDB for data persistence
- Nginx reverse proxy for production

## Quick Start

### Prerequisites

- Docker Desktop
- VS Code (recommended for development workflow)

### Development Environment

```bash
# Clone and start development environment
git clone [repository-url]
cd vera
docker-compose -f docker-compose.dev.yml up -d

# Verify services are running
docker-compose -f docker-compose.dev.yml ps
```

**Services Available:**

- **Frontend**: http://localhost:3000 (React dev server with hot reload)
- **Backend API**: http://localhost:5000 (Express server)
- **Database**: localhost:27017 (MongoDB)

### VS Code Integration (Recommended)

VERA includes comprehensive VS Code tasks for streamlined development:

1. **Command Palette**: `Ctrl+Shift+P`
2. **Select**: `Tasks: Run Task`
3. **Available Tasks**:
   - `Docker: Start Development Environment`
   - `Test: Run All Server Tests`
   - `Test: Run Server Tests (Watch Mode)`
   - `Docker: View API Logs`

## Development Workflow

### Testing

Current status: ✅ **116/116 tests passing** (100% success rate)

**Quick Commands:**

```bash
# Via VS Code: Ctrl+Shift+P → Tasks: Run Task → Test: Run All Server Tests
# Via CLI:
./scripts/run-server-tests.sh                    # Run all tests
./scripts/run-server-tests.sh --watch           # Watch mode
./scripts/run-server-tests.sh --path=tests/Routes/users.test.ts  # Specific file
```

For comprehensive testing documentation including mock patterns and debugging, see **[TESTING.md](TESTING.md)**.

### Container Management

```bash
# View logs
docker-compose -f docker-compose.dev.yml logs -f api

# Shell into containers
docker-compose -f docker-compose.dev.yml exec api bash
docker-compose -f docker-compose.dev.yml exec client bash

# Rebuild services
docker-compose -f docker-compose.dev.yml up -d --build

# Stop environment
docker-compose -f docker-compose.dev.yml down
```

### Frontend Development

```bash
# Inside client container
npm install           # Install dependencies
npm start            # Start dev server (auto-started)
npm run build        # Production build
npm test             # Run frontend tests
```

### Backend Development

```bash
# Inside API container
npm install          # Install dependencies
npm run dev          # Start dev server (auto-started)
npm test             # Run backend tests
npm test -- tests/Routes/users.test.ts  # Specific test file
```

## Environment Configurations

- **`docker-compose.dev.yml`** - Local development with hot reload
- **`docker-compose.prod.yml`** - Production deployment
- **`docker-compose.azure.yml`** - Azure-specific configuration
- **`docker-compose.sreal.yml`** - SREAL deployment configuration

## Deployment

**Live Site**: [https://sreal.ucf.edu/vera-portal](https://sreal.ucf.edu/vera-portal)  
**Test Site**: [https://sherlock.gaim.ucf.edu/vera-portal](https://sherlock.gaim.ucf.edu/vera-portal)

```bash
# Production build
docker-compose -f docker-compose.dev.yml exec client npm run build

# Deploy (requires environment setup)
./scripts/deploy.sh

# Build documentation
./scripts/build-docs.sh
```

## Development Setup

### Windows Development

For detailed Windows setup including WSL, Docker Desktop, and VS Code configuration, see **[WINDOWS-SETUP.md](WINDOWS-SETUP.md)**.

### External Integrations

For Dropbox integration setup and other external service configurations, see **[INTEGRATIONS.md](INTEGRATIONS.md)**.

## Principle Investigators

- Greg WELCH (Lead PI), University of Central Florida
- Shiri AZENKOT, Cornell Tech / XR Access
- Jeremy BAILENSON (Director of Community Outreach), Stanford University
- Gerd BRUDER, University of Central Florida
- John MURRAY, (Director of Software Engineering), University of Central Florida
- Tabitha PECK, Davidson College
- Valerie Jones TAYLOR, Rutgers University

## Investigators

- Jonathan BEEVER (Ethics and Privacy), University of Central Florida
- Nicholas Alvaro COLES (Big Team Science), University of Florida
- Carolina Cruz-NEIRA (Partnerships, Sustainability), University of Central Florida
- Rui XIE (Statistics and Data Science), University of Central Florida

# Development and Operations

- Ali HASKINS LISLE, Director of Development and Operations, University of Central Florida
- John MURRAY, Director of Software Engineering, University of Central Florida
- Chloe BEATO, Development Project Manager, University of Central Florida
- Dylan FOX, XR Access Director of Operations, Cornell Tech / XR Access
- Jaz DEGUZMAN, Pre-Release Experiment Coordinator, University of Central Florida

## Software Engineering Team

- Corey CLEMENTS (Associate Lead Software Engineer)
- Zubin CHOUDHARY, Developer
- Hiroshi FURUYA, Developer
- Lam NGUYEN, Developer

## Former Engineering Team Members

- Akhil Pavan Sai MACHAVARAM, Developer, 2024–2025
- Dharini CHANDRASHEKAR, UX/UI Designer, 2024–2025

## Former Community Advisory Board

- Mar Gonzale-Franco, 2024
- Missie Smith, 2024

---

**Note**: This README focuses on core development workflow. For detailed setup guides, API documentation, and advanced configurations, see the `/docs` directory and project wiki.
