# VS Code Testing Integration with Docker

This document explains how to use the newly configured VS Code tasks and Jest extension integration with Docker for the Vera project.

## 🚀 Quick Start

### Running Tests

1. **Run All Tests**: Press `Ctrl+Shift+P` → `Tasks: Run Task` → `Test: Run All Server Tests`
2. **Watch Mode**: Press `Ctrl+Shift+P` → `Tasks: Run Task` → `Test: Run Server Tests (Watch Mode)`
3. **Specific Test**: Press `Ctrl+Shift+P` → `Tasks: Run Task` → `Test: Run Specific Test File`

### Docker Management

1. **Start Environment**: Press `Ctrl+Shift+P` → `Tasks: Run Task` → `Docker: Start Development Environment`
2. **Stop Environment**: Press `Ctrl+Shift+P` → `Tasks: Run Task` → `Docker: Stop Development Environment`
3. **View Logs**: Press `Ctrl+Shift+P` → `Tasks: Run Task` → `Docker: View API Logs`

## 📋 Available VS Code Tasks

### Test Tasks

- **Test: Run All Server Tests** - Runs all tests with automatic Docker startup
- **Test: Run Server Tests (Watch Mode)** - Continuous testing with file watching
- **Test: Run Specific Test File** - Run tests for a specific file or directory
- **Jest: Run Tests in Docker (VS Code Extension)** - For Jest extension integration
- **Jest: Debug Test in Docker** - Debug tests with VS Code debugger

### Docker Tasks

- **Docker: Start Development Environment** - Start all Docker services
- **Docker: Stop Development Environment** - Stop all Docker services
- **Docker: Ensure Development Environment** - Auto-start if not running
- **Docker: Check Development Environment** - Verify Docker is running
- **Docker: View API Logs** - Real-time API container logs
- **Docker: Shell into API Container** - Open terminal in API container

## VS Code Tasks (Recommended)

Use the built-in VS Code tasks for the best testing experience:

1. **Quick Testing**: Press `Ctrl+Shift+P` → `Tasks: Run Task` → `Test: Run All Server Tests`
2. **Watch Mode**: Press `Ctrl+Shift+P` → `Tasks: Run Task` → `Test: Run Server Tests (Watch Mode)`
3. **Current File**: Press `Ctrl+Shift+P` → `Tasks: Run Task` → `Quick Test: Current File`
4. **Command Palette**: `Ctrl+Shift+P` → `Tasks: Run Task` → Select test task

## 🐳 Docker Integration

### Automatic Startup

All test tasks automatically ensure Docker is running:

- If Docker containers are not running, they start automatically
- No need to manually start Docker before running tests
- Intelligent detection prevents unnecessary restarts

### Scripts

- **`scripts/run-server-tests.sh`** - Main test runner with Docker integration
- **`scripts/run-jest-docker.sh`** - Jest-specific runner for VS Code extension

### Container Access

```bash
# Manual Docker commands
docker-compose -f docker-compose.dev.yml up -d     # Start services
docker-compose -f docker-compose.dev.yml down      # Stop services
docker-compose -f docker-compose.dev.yml exec api bash  # Shell access
```

## 🔍 Debugging

### Debug Configuration

Available in `.vscode/launch.json`:

1. **Debug Jest Tests in Docker** - Auto-launch with debugging
2. **Attach to Jest Tests (Manual)** - Manual attachment to running tests
3. **Attach to Node** - Debug the main API application

### Debug Workflow

1. Set breakpoints in your test files
2. Press `F5` → Select "Debug Jest Tests in Docker"
3. VS Code will:
   - Start the Docker environment
   - Launch Jest with debugging enabled
   - Attach the debugger automatically

### Debug Ports

- **9229**: Jest debugging port
- **9230**: Main API debugging port

## 📁 File Structure

```
.vscode/
├── tasks.json          # VS Code tasks configuration
├── launch.json         # Debug configurations
└── settings.json       # Jest extension settings

scripts/
├── run-jest-docker.sh      # Jest runner script
└── run-server-tests.sh     # Main test runner script
```

## 🎯 Best Practices

### Test Organization

- Keep tests in `server/tests/` directory
- Use `.test.ts` extension for test files
- Follow the standardized mock patterns in `tests/utils/mockUtils.ts`

### Running Tests

1. **Development**: Use watch mode for continuous testing
2. **CI/CD**: Use the main test task for full test runs
3. **Debugging**: Use debug configurations for troubleshooting
4. **Specific Tests**: Use the specific test task for focused testing

### Docker Management

- Let tasks handle Docker startup automatically
- Use "View API Logs" for troubleshooting
- Use "Shell into API Container" for manual debugging
- Stop Docker when not needed to save resources

## 🚨 Troubleshooting

### Common Issues

**Jest Extension Not Working**

- Ensure Docker is running: `docker-compose -f docker-compose.dev.yml ps`
- Check script permissions: `ls -la run-jest-docker.sh`
- Reload VS Code window: `Ctrl+Shift+P` → "Developer: Reload Window"

**Docker Services Not Starting**

- Check Docker daemon: `docker --version`
- View Docker logs: Use "Docker: View API Logs" task
- Manual restart: `docker-compose -f docker-compose.dev.yml down && docker-compose -f docker-compose.dev.yml up -d`

**Tests Failing in Docker**

- Check MongoDB connection in logs
- Verify environment variables in `.env` file
- Use "Shell into API Container" to debug manually

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
