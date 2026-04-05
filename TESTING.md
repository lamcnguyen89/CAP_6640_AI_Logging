# VERA Testing Guide

This document outlines the testing structure and practices for the VERA project.

## Testing Architecture

The VERA project uses a comprehensive testing approach with the following components:

### Server-Side Tests

- **Framework**: Jest with TypeScript support (ts-jest)
- **Location**: `/server/tests/` directory
- **Structure**: Tests are organized by functionality, primarily by API routes
- **Coverage Requirements**: 50% coverage for branches, functions, lines, and statements

### Client-Side Tests

- **Framework**: Jest/Vitest with React Testing Library
- **Location**: Tests are co-located with their respective components with `.test.tsx` extension
- **Structure**: Tests verify UI components, forms, and user interactions

## Running Tests

### Server Tests

#### Using VS Code Tasks (Recommended)

The project includes VS Code task integration for seamless testing:

1. **Run All Tests**: `Ctrl+Shift+P` → `Tasks: Run Task` → `Test: Run All Server Tests`
2. **Watch Mode**: `Ctrl+Shift+P` → `Tasks: Run Task` → `Test: Run Server Tests (Watch Mode)`
3. **Specific Test**: `Ctrl+Shift+P` → `Tasks: Run Task` → `Test: Run Specific Test File`
4. **Current File**: `Ctrl+Shift+P` → `Tasks: Run Task` → `Quick Test: Current File`

#### Using Command Line

You can also run server tests using the provided script:

```bash
./scripts/run-server-tests.sh
```

Options:

- `--path=tests/Routes/specific-test.ts` - Run specific tests
- `--watch` - Run tests in watch mode (uses --watchAll for Git-free operation)

Alternatively, you can run tests directly with Docker:

```bash
docker-compose -f docker-compose.dev.yml exec api npm test
```

### Client Tests

To run client tests:

```bash
docker-compose -f docker-compose.dev.yml exec client npm test
```

## VS Code Integration

### Available Tasks

The project includes comprehensive VS Code task integration for Docker and testing:

#### Test Tasks

- **Test: Run All Server Tests** - Runs all tests with automatic Docker startup
- **Test: Run Server Tests (Watch Mode)** - Continuous testing with file watching
- **Test: Run Specific Test File** - Run tests for a specific file or directory
- **Quick Test: Current File** - Test the file you're currently working on
- **Jest: Run Tests in Docker (VS Code Extension)** - For Jest extension integration
- **Jest: Debug Test in Docker** - Debug tests with VS Code debugger

#### Docker Tasks

- **Docker: Start Development Environment** - Start all Docker services
- **Docker: Stop Development Environment** - Stop all Docker services
- **Docker: Ensure Development Environment** - Auto-start if not running
- **Docker: Check Development Environment** - Verify Docker is running
- **Docker: View API Logs** - Real-time API container logs
- **Docker: Shell into API Container** - Open terminal in API container

### Automatic Docker Management

All test tasks automatically ensure Docker is running:

- If Docker containers are not running, they start automatically
- No need to manually start Docker before running tests
- Intelligent detection prevents unnecessary restarts

### Helper Scripts

- **`scripts/run-server-tests.sh`** - Main test runner with Docker integration
- **`scripts/run-jest-docker.sh`** - Jest-specific runner for VS Code extension
- **`scripts/jest-setup.sh`** - Environment setup helper

### Debug Configuration

Available debug configurations in `.vscode/launch.json`:

1. **Debug Jest Tests in Docker** - Auto-launch with debugging
2. **Attach to Jest Tests (Manual)** - Manual attachment to running tests
3. **Attach to Node** - Debug the main API application

#### Debug Workflow

1. Set breakpoints in your test files
2. Press `F5` → Select "Debug Jest Tests in Docker"
3. VS Code will:
   - Start the Docker environment
   - Launch Jest with debugging enabled
   - Attach the debugger automatically

#### Debug Ports

- **9229**: Jest debugging port
- **9230**: Main API debugging port

## Test Structure Best Practices

Our tests follow these best practices:

1. **Arrange-Act-Assert (AAA) Pattern**:

   ```typescript
   // Arrange
   const user = {
     /* test data */
   }
   mockFunction.mockResolvedValue(user)

   // Act
   const result = await functionUnderTest()

   // Assert
   expect(result).toBe(expectedValue)
   ```

2. **Mock External Dependencies**:

   - Use Jest mocks for database models and external services
   - Reset mocks between tests using `beforeEach(jest.clearAllMocks())`

3. **Test Both Success and Failure Cases**:

   - Test happy path (successful operations)
   - Test edge cases and error conditions
   - Verify appropriate error handling

4. **Isolated Tests**:
   - Each test should be independent and not rely on other tests
   - Use `beforeEach` to set up a clean environment for each test

## Standardized Mock Patterns (VP1-956)

The project uses standardized mock utilities located in `server/tests/utils/mockUtils.ts`:

### Available Mock Functions

```typescript
import {
  mockPassport,
  mockCrypto,
  mockBcrypt,
  setupStandardMocks,
} from "../utils/mockUtils"

// Setup all standard mocks
beforeEach(() => {
  setupStandardMocks()
})
```

### Key Mock Utilities

1. **Passport Authentication Mock**:

   ```typescript
   mockPassport() // Mocks req.user = { id: "testUserId", admin: true }
   ```

2. **Crypto Module Mock**:

   ```typescript
   mockCrypto() // For Express ETag generation
   ```

3. **Bcrypt Mock**:

   ```typescript
   mockBcrypt() // Password hashing for tests
   ```

4. **Database Model Mocks**:
   ```typescript
   // Individual model mocking with typed functions
   const mockUser = User as jest.MockedFunction<typeof User>
   mockUser.findById.mockResolvedValue(testUser)
   ```

### Testing Standards

- Use `jest.MockedFunction<T>` for type-safe mocking
- Reset mocks between tests with `setupStandardMocks()`
- Follow the patterns established in `tests/utils/mockUtils.ts`
- All new tests should use these standardized patterns

## Current Test Coverage

The project includes tests for:

1. **API Routes**:

   - User authentication and management
   - Email verification
   - Experiments management
   - Participant handling
   - Site management

2. **UI Components**:
   - Form components
   - Navigation
   - Modals and notifications
   - Authentication flows

## Docker Integration

All tests can be run within Docker containers to ensure a consistent testing environment. The project's Docker Compose configuration includes services for both development and testing.

## Troubleshooting

### Common Issues

**Jest Extension Not Working**

- Ensure Docker is running: `docker-compose -f docker-compose.dev.yml ps`
- Check script permissions: `ls -la scripts/run-jest-docker.sh`
- Reload VS Code window: `Ctrl+Shift+P` → "Developer: Reload Window"

**Docker Services Not Starting**

- Check Docker daemon: `docker --version`
- View Docker logs: Use "Docker: View API Logs" task
- Manual restart: `docker-compose -f docker-compose.dev.yml down && docker-compose -f docker-compose.dev.yml up -d`

**Tests Failing in Docker**

- Check MongoDB connection in logs
- Verify environment variables in `.env` file
- Use "Shell into API Container" to debug manually

**Watch Mode Issues**

- The project uses `--watchAll` instead of `--watch` for Git-free operation
- If watch mode isn't detecting changes, try restarting the task

**Debugging Not Working**

- Ensure debug port 9229 is available
- Check if debugger attachment is successful in VS Code
- Verify Docker port forwarding

### Support Commands

```bash
# Check Docker status
docker-compose -f docker-compose.dev.yml ps

# View all logs
docker-compose -f docker-compose.dev.yml logs

# Restart services
docker-compose -f docker-compose.dev.yml restart

# Clean restart
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up -d
```
