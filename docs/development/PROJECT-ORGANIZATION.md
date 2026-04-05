# Project Organization

## 🏗️ **Architecture Overview**

VERA (Virtual Experience Research Accelerator) is a cloud-based platform for interactive media and biosignals research, built as a containerized full-stack application.

### **Tech Stack**

- **Frontend**: React + TypeScript (Vite)
- **Backend**: Node.js + Express + TypeScript
- **Database**: MongoDB with Mongoose
- **Infrastructure**: Docker, Nginx
- **Testing**: Jest (backend), Vitest (frontend)

## 📁 **Directory Structure**

```
vera/
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/           # Page-level components
│   │   ├── helpers/         # API client helpers
│   │   ├── store/           # Redux state management
│   │   └── styles/          # Global styles
│   └── tests/               # Frontend test setup
│
├── server/                   # Express backend
│   ├── src/
│   │   ├── models/          # Mongoose data models
│   │   ├── routes/api/      # API endpoints
│   │   ├── utils/           # Shared utilities
│   │   └── server.ts        # Main entry point
│   └── tests/               # Backend test suite
│       ├── Routes/          # API route tests
│       └── utils/           # Mock utilities
│
├── docker-compose.*.yml      # Environment configs
├── scripts/                  # Build & deploy scripts
└── docs/                     # Documentation
```

## **Development Workflow**

### **1. Quick Start**

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up -d

# Services available at:
# - Frontend: http://localhost:3000
# - API: http://localhost:5000
# - MongoDB: mongodb://localhost:27017
```

### **2. Testing Workflow**

**VS Code Integration** (Recommended):

- `Ctrl+Shift+P` → `Tasks: Run Task`
- Select from available test tasks

**Manual Testing**:

```bash
# Backend tests
cd server && npm test

# Frontend tests
cd client && npm test

# Watch mode
npm run test:watch
```

**Test Organization**:

- Mock utilities: `/server/tests/utils/mockUtils.ts`
- Route tests: `/server/tests/Routes/*.test.ts`
- Coverage requirements: 50% minimum

### **3. API Routes**

All API routes are in `/server/src/routes/api/`:

| Route                | Purpose                          |
| -------------------- | -------------------------------- |
| `/users`             | User authentication & management |
| `/experiments`       | Experiment CRUD operations       |
| `/participants`      | Participant data management      |
| `/sites`             | Research site configuration      |
| `/institutions`      | Institution management           |
| `/columndefinitions` | Data schema definitions          |
| `/dropbox`           | File storage integration         |

### **4. Key Development Patterns**

**Logging**:

- Use unified logger: `import logger from '@/utils/logger'`
- Levels: ERROR, WARN, INFO, DEBUG

**Authentication**:

- JWT for web clients
- Unity tokens for Unity integration
- Passport.js middleware

**Testing**:

- AAA pattern (Arrange-Act-Assert)
- Mock all external dependencies
- Test both success and error cases

## 🐳 **Docker Environments**

| File                       | Purpose           | When to Use           |
| -------------------------- | ----------------- | --------------------- |
| `docker-compose.dev.yml`   | Local development | Daily development     |
| `docker-compose.prod.yml`  | Production base   | Production deployment |
| `docker-compose.azure.yml` | Azure deployment  | Azure environments    |
| `docker-compose.sreal.yml` | SREAL lab setup   | Lab deployments       |

## **Essential Resources**

- **Main README**: Project overview and setup
- **TESTING.md**: Comprehensive testing guide
- **VSCODE-TESTING-SUMMARY.md**: VS Code integration
- **WINDOWS-SETUP.md**: Windows-specific setup
- **Live Site**: https://sreal.ucf.edu/vera-portal

## **Common Tasks**

### **Adding a New API Route**

1. Create route file in `/server/src/routes/api/`
2. Add route tests in `/server/tests/Routes/`
3. Update API documentation
4. Register route in `/server/src/server.ts`

### **Adding a New Model**

1. Define schema in `/server/src/models/`
2. Create mock factory in `/server/tests/utils/mockUtils.ts`
3. Add TypeScript types
4. Write model tests

### **Frontend Development**

1. Components go in `/client/src/components/`
2. Use API helpers from `/client/src/helpers/`
3. Update Redux store if needed
4. Write component tests

## **Tips**

1. **Use VS Code Tasks**: Integrated testing saves time
2. **Check Coverage**: Run `npm run test:coverage`
3. **Follow Patterns**: Study existing code for conventions
4. **Test First**: Write tests alongside new features
5. **Use Logger**: Replace `console.log` with `logger.info`
