# Local Testing Guide

This guide helps you set up and run tests on your local machine.

## Prerequisites

### Required Software

1. **Node.js 16+**
   ```bash
   node --version  # Should be 16.x or higher
   ```

2. **npm or yarn**
   ```bash
   npm --version
   ```

3. **For iOS E2E tests**:
   - macOS only
   - Xcode 14+ with Command Line Tools
   - CocoaPods
   - iOS Simulator

4. **For Android E2E tests**:
   - Android Studio
   - Android SDK
   - Emulator or physical device

## Initial Setup

### 1. Install Dependencies

```bash
# Clone repository
git clone <repository-url>
cd rn-testing-app

# Install npm packages
npm install

# iOS only: Install CocoaPods dependencies
cd ios && pod install && cd ..
```

### 2. Environment Configuration

Create a `.env` file in the root directory:

```env
GEMINI_API_KEY=your_api_key_here
ANALYTICS_KEY=your_analytics_key
```

## Running Tests Locally

### Quick Start

```bash
# Run all non-E2E tests (recommended for quick feedback)
npm test

# Run with coverage
npm run test:coverage

# Open coverage report
open coverage/lcov-report/index.html
```

### Unit Tests

**Run all unit tests:**
```bash
npm run test:unit
```

**Run specific test file:**
```bash
npm test -- src/services/__tests__/GeminiService.test.ts
```

**Run tests matching pattern:**
```bash
npm test -- --testPathPattern=services
```

**Run in watch mode (recommended for development):**
```bash
npm run test:watch
```

**Run with coverage:**
```bash
npm run test:coverage
```

### Integration Tests

**Run all integration tests:**
```bash
npm run test:integration
```

**Run specific integration test:**
```bash
npm test -- src/screens/integration/OnboardingScreen.integration.test.tsx
```

### End-to-End Tests

#### iOS Setup

1. **Open simulator:**
   ```bash
   open -a Simulator
   ```

2. **Build the app:**
   ```bash
   npm run test:e2e:build
   ```
   
   This takes 5-10 minutes on first run.

3. **Run E2E tests:**
   ```bash
   npm run test:e2e
   ```

#### Run Specific E2E Test

```bash
detox test e2e/onboarding.e2e.js -c ios.sim.debug
```

#### Debug E2E Tests

```bash
detox test --debug-synchronization 500
```

#### Clean Build

If tests fail unexpectedly:
```bash
cd ios
xcodebuild clean
cd ..
npm run test:e2e:build
```

## Test Development Workflow

### 1. Write Unit Test

```bash
# Create test file
touch src/services/__tests__/NewService.test.ts

# Run in watch mode
npm run test:watch

# Make changes and tests re-run automatically
```

### 2. Test-Driven Development

```bash
# Write failing test first
npm test -- NewFeature.test.ts

# Implement feature until test passes
# Refactor while keeping tests green
```

### 3. Before Committing

```bash
# Run all tests
npm run test:all

# Or use the comprehensive script
./scripts/run-all-tests.sh
```

## Debugging Tests

### Debug Unit Tests in VS Code

Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": [
    "--runInBand",
    "--no-cache",
    "--watchAll=false"
  ],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

### Debug Specific Test

```bash
# Add debugger statement in test
it('should do something', () => {
  debugger;  // Add this
  // test code
});

# Run with node inspector
node --inspect-brk node_modules/.bin/jest --runInBand path/to/test.test.ts
```

### Debug E2E Tests

```bash
# Enable synchronization debug
detox test --debug-synchronization 500

# Record videos
detox test --record-videos all

# Take screenshots
detox test --take-screenshots all

# Artifacts saved in: artifacts/
```

## Common Issues and Solutions

### Issue: Tests Timing Out

**Solution**: Increase timeout in specific test
```typescript
it('slow test', async () => {
  // test code
}, 10000); // 10 second timeout
```

### Issue: Module Not Found

**Solution**: Clear Jest cache
```bash
npm test -- --clearCache
npm test
```

### Issue: Detox Build Fails

**Solution**: Clean and rebuild
```bash
cd ios
rm -rf build
xcodebuild clean
cd ..
npm run test:e2e:build
```

### Issue: Tests Pass Locally but Fail in CI

**Possible causes**:
- Different Node.js version
- Missing environment variables
- Race conditions (use more `waitFor`)
- Timezone differences

**Solution**:
```bash
# Match CI Node version
nvm use 18

# Run tests as CI does
CI=true npm test
```

### Issue: Flaky Tests

**Solution**: Add explicit waits
```typescript
await waitFor(() => {
  expect(element).toBeVisible();
}, {
  timeout: 5000,
  interval: 500,
});
```

## Performance Optimization

### Faster Test Runs

```bash
# Limit parallel workers
npm test -- --maxWorkers=2

# Run only changed tests
npm test -- --onlyChanged

# Skip coverage collection
npm test -- --coverage=false
```

### Faster E2E Tests

```bash
# Use debug build (faster than release)
detox test -c ios.sim.debug

# Run specific test suite
detox test e2e/onboarding.e2e.js
```

## Test Coverage Analysis

### Generate Coverage Report

```bash
npm run test:coverage
```

### View Coverage

```bash
# HTML report
open coverage/lcov-report/index.html

# Terminal summary
cat coverage/coverage-summary.json | json
```

### Check Specific File Coverage

```bash
npm test -- --coverage --collectCoverageFrom="src/services/GeminiService.ts"
```

### Coverage Badges

Generate badge with:
```bash
npx coverage-badge-creator
```

## Continuous Testing During Development

### Terminal 1: Watch Tests
```bash
npm run test:watch
```

### Terminal 2: Run Metro
```bash
npm start
```

### Terminal 3: Run App
```bash
npm run ios  # or npm run android
```

## Pre-Push Checklist

Before pushing code, ensure:

```bash
# 1. All tests pass
npm run test:all

# 2. No linting errors
npm run lint

# 3. TypeScript compiles
npm run typecheck

# 4. Coverage meets thresholds
npm run test:coverage
```

## CI/CD Integration

Your local tests should match CI behavior:

```bash
# Simulate CI environment
CI=true npm test -- --coverage --maxWorkers=2
```

## Getting Help

### View Test Logs

```bash
# Verbose output
npm test -- --verbose

# Debug output
npm test -- --debug
```

### Test Statistics

```bash
# Show test duration
npm test -- --verbose | grep "Time:"

# Show slowest tests
npm test -- --verbose | grep -A5 "SLOW"
```

## Best Practices

1. **Run tests frequently**: Use watch mode during development
2. **Write tests first**: TDD leads to better design
3. **Keep tests fast**: Mock slow dependencies
4. **Test behavior, not implementation**: Focus on user outcomes
5. **Clean test data**: Reset state between tests
6. **Use descriptive names**: Test names should explain intent
7. **One assertion per test**: Makes failures clear

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Testing Library](https://testing-library.com/)
- [Detox Documentation](https://wix.github.io/Detox/)
- Internal: `TESTING.md` for detailed testing guidelines

## Quick Reference

| Task | Command |
|------|---------|
| Run all tests | `npm test` |
| Watch mode | `npm run test:watch` |
| Unit tests only | `npm run test:unit` |
| Integration tests | `npm run test:integration` |
| E2E tests | `npm run test:e2e` |
| Coverage report | `npm run test:coverage` |
| Lint code | `npm run lint` |
| Type check | `npm run typecheck` |
| Run everything | `./scripts/run-all-tests.sh` |

---

**Need help?** Check `TESTING.md` or open an issue on GitHub.
