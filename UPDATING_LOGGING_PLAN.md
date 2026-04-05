# 📋 Unified Logging Implementation Plan

## **Phase 1: Foundation Setup** ✅

_Status: Completed_

### 1.1 Logger Implementation

- ✅ Created logger.ts with environment-aware logging
- ✅ Supports log levels: ERROR, WARN, INFO, DEBUG, SYSTEM
- ✅ Automatically silences logs during testing (`NODE_ENV=test`)
- ✅ Verbose logging in development (`MODE=development`)

### 1.2 Environment Configuration

- ✅ Respects existing `MODE=development` in docker-compose.dev.yml
- ✅ Detects test environment to prevent test output noise
- ✅ No additional dependencies required

---

## **Phase 2: Critical System Logs** 🎯

_Priority: High - Replace logs that affect system startup/shutdown_

### 2.1 Server Startup & Database Connection

**Files to update:**

- server.ts - MongoDB connection, server startup
- passport.ts - Authentication setup (if any logs)

**Log Categories:**

- `logger.system()` - Server startup, port binding, shutdown signals
- `logger.info()` - MongoDB connection success
- `logger.error()` - Database connection failures, critical errors

### 2.2 Authentication & Security

**Files to update:**

- users.ts - Login attempts, password resets
- passport.ts - Authentication strategies

**Log Categories:**

- `logger.warn()` - Failed login attempts, suspicious activity
- `logger.info()` - Successful authentication events
- `logger.error()` - Authentication failures, security issues

---

## **Phase 3: API Request Logging** 🔄

_Priority: Medium - Clean up noisy debug logs_

### 3.1 High-Noise Routes (Immediate)

**Files to update first:**

- experiments.ts - Request body/files logging (lines 54-55)
- participants.ts - Participant creation logs
- dropbox.ts - OAuth flow debugging

**Log Categories:**

- `logger.debug()` - Request body, file uploads, detailed debugging
- `logger.info()` - Successful operations, important state changes
- `logger.warn()` - Business logic warnings, validation issues

### 3.2 Remaining API Routes

**Files to update:**

- survey.ts
- emailroute.ts
- study.ts
- Other API routes as needed

---

## **Phase 4: Testing & Validation** 🧪

### 4.1 Test Logger Functionality

```bash
# Test in different environments
NODE_ENV=test npm test          # Should be silent
MODE=development npm start      # Should show debug logs
NODE_ENV=production npm start   # Should show info+ logs
```

### 4.2 Verify Test Output Cleanliness

- Run test suite and confirm no unwanted logs appear
- Verify test performance isn't impacted
- Check that error logs still appear when needed

---

## **Phase 5: Advanced Configuration** ⚙️

_Priority: Low - Future enhancements_

### 5.1 Structured Logging

- Add request IDs for request tracing
- Include timestamps in production
- Add log rotation for production environments

### 5.2 Monitoring Integration

- Consider adding log aggregation (if needed)
- Add performance metrics logging
- Health check endpoint logging

---

## **Implementation Commands**

### Step 1: Test Current Logger

```bash
# Test the logger in development
docker-compose -f docker-compose.dev.yml up -d
./scripts/run-server-tests.sh
```

### Step 2: Update Critical Files (Priority Order)

1. **server.ts** - System startup logs
2. **experiments.ts** - Fix test noise (lines 54-55)
3. **users.ts** - Authentication logs
4. **participants.ts** - High-frequency logs
5. **dropbox.ts** - OAuth debug logs

### Step 3: Systematic Replacement Pattern

```typescript
// Replace this pattern:
console.log("Debug info:", data)

// With this pattern:
logger.debug("Debug info:", data)

// Replace error patterns:
console.log(err) // or console.error(err)

// With:
logger.error("Operation failed", err)
```

---

## **Configuration Matrix**

| Environment     | Log Level  | Output       | Use Case         |
| --------------- | ---------- | ------------ | ---------------- |
| **Testing**     | ERROR only | Silent       | Clean test runs  |
| **Development** | DEBUG      | Console      | Full debugging   |
| **Production**  | INFO+      | Console/File | Operational logs |

---

## **Success Metrics**

### ✅ **Immediate Goals**

- [ ] Test output has no unwanted logs
- [ ] System startup/shutdown logs are clean and informative
- [ ] Authentication events are properly logged
- [ ] API debug logs don't appear in tests

### ✅ **Long-term Goals**

- [ ] All console.log statements replaced with appropriate log levels
- [ ] Structured logging format in production
- [ ] Log-based monitoring capabilities
- [ ] Performance impact is minimal

---
