# Testing Documentation

## Overview

This document provides comprehensive information about the testing strategy, patterns, and best practices for the React Native Testing App.

## Table of Contents

1. [Testing Philosophy](#testing-philosophy)
2. [Test Types](#test-types)
3. [Running Tests](#running-tests)
4. [Writing Tests](#writing-tests)
5. [Coverage Requirements](#coverage-requirements)
6. [CI/CD Integration](#cicd-integration)
7. [Troubleshooting](#troubleshooting)

## Testing Philosophy

Our testing strategy follows the testing pyramid:

```
        /\
       /E2E\      ← Few, critical user flows
      /------\
     /  INT   \   ← More, screen/feature level
    /----------\
   /    UNIT    \ ← Many, service/utility level
  /--------------\
```

### Principles

- **Fast Feedback**: Unit tests run in < 1 second
- **Reliable**: No flaky tests in main branch
- **Maintainable**: Tests are easy to understand and update
- **Valuable**: Tests catch real bugs, not implementation details

## Test Types

### 1. Unit Tests

**Purpose**: Test individual functions and services in isolation

**Location**: `src/services/__tests__/`

**Framework**: Jest

**Coverage**: 80%+ for services, 70%+ global

**Examples**:
```typescript
// Testing a service method
it('should analyze problem and return parsed solution', async () => {
  const mockResponse = { /* ... */ };
  mockedAxios.create.mockReturnValue({
    post: jest.fn().mockResolvedValue(mockResponse),
  });

  const result = await service.analyzeProblem('imageData');
  
  expect(result).toHaveProperty('solution');
  expect(result).toHaveProperty('steps');
});
```

**Best Practices**:
- Mock external dependencies (API, storage, etc.)
- Test edge cases and error conditions
- Use descriptive test names
- Keep tests focused on one behavior

### 2. Integration Tests

**Purpose**: Test how components interact with services and state

**Location**: `src/screens/integration/`

**Framework**: React Native Testing Library

**Examples**:
```typescript
// Testing screen with service integration
it('should analyze problem and navigate to solution', async () => {
  const mockSolution = { /* ... */ };
  GeminiService.analyzeProblem.mockResolvedValue(mockSolution);

  const { getByTestId } = render(<CaptureScreen />);
  
  fireEvent.press(getByTestId('capture-button'));
  await waitFor(() => expect(getByTestId('analyze-button')).toBeTruthy());
  
  fireEvent.press(getByTestId('analyze-button'));
  
  await waitFor(() => {
    expect(mockNavigate).toHaveBeenCalledWith('Solution', {
      solution: mockSolution,
    });
  });
});
```

**Best Practices**:
- Test user interactions, not implementation
- Mock only external services, not React hooks
- Use `waitFor` for async operations
- Test accessibility attributes

### 3. End-to-End Tests

**Purpose**: Test complete user flows in real app environment

**Location**: `e2e/`

**Framework**: Detox

**Examples**:
```javascript
// Testing complete onboarding flow
it('should complete onboarding flow', async () => {
  await expect(element(by.id('onboarding-screen'))).toBeVisible();
  
  await element(by.id('next-button')).tap();
  await expect(element(by.text('Learn Step by Step'))).toBeVisible();
  
  await element(by.id('next-button')).tap();
  await element(by.id('next-button')).tap();
  
  await waitFor(element(by.id('home-screen')))
    .toBeVisible()
    .withTimeout(2000);
});
```

**Best Practices**:
- Test happy paths and critical flows
- Use testID for element selection
- Add appropriate timeouts
- Clean state between tests
- Keep tests independent

## Running Tests

### Local Development

```bash
# Unit tests - fast, run frequently
npm test                    # Run once
npm run test:watch          # Watch mode
npm run test:coverage       # With coverage

# Integration tests - run before commit
npm run test:integration

# E2E tests - run before push
npm run test:e2e:build      # Build app first
npm run test:e2e            # Run tests
```

### Selective Test Runs

```bash
# Run specific test file
npm test -- GeminiService.test.ts

# Run tests matching pattern
npm test -- --testPathPattern=services

# Run tests with specific name
npm test -- --testNamePattern="should analyze problem"

# Run only changed tests
npm test -- --onlyChanged
```

### Debug Mode

```bash
# Debug unit tests
node --inspect-brk node_modules/.bin/jest --runInBand

# Debug integration tests
npm test -- --testPathPattern=integration --runInBand

# Debug Detox tests
detox test --debug-synchronization 500
```

## Writing Tests

### Unit Test Template

```typescript
import { ServiceName } from '../ServiceName';

describe('ServiceName', () => {
  let service: ServiceName;

  beforeEach(() => {
    service = new ServiceName();
    jest.clearAllMocks();
  });

  describe('methodName', () => {
    it('should handle success case', async () => {
      // Arrange
      const input = 'test';
      
      // Act
      const result = await service.methodName(input);
      
      // Assert
      expect(result).toBe('expected');
    });

    it('should handle error case', async () => {
      // Arrange & Act & Assert
      await expect(service.methodName(null))
        .rejects.toThrow('Error message');
    });
  });
});
```

### Integration Test Template

```typescript
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ScreenName } from '../ScreenName';
import ServiceName from '../../services/ServiceName';

jest.mock('../../services/ServiceName');

describe('ScreenName Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render and interact correctly', async () => {
    // Arrange
    const mockData = { /* ... */ };
    ServiceName.method.mockResolvedValue(mockData);

    // Act
    const { getByTestId } = render(<ScreenName />);
    fireEvent.press(getByTestId('button-id'));

    // Assert
    await waitFor(() => {
      expect(ServiceName.method).toHaveBeenCalled();
      expect(getByTestId('result')).toBeTruthy();
    });
  });
});
```

### E2E Test Template

```javascript
describe('Feature Name', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should complete user flow', async () => {
    // Navigate
    await element(by.id('screen-id')).tap();
    
    // Interact
    await element(by.id('input')).typeText('text');
    await element(by.id('submit')).tap();
    
    // Verify
    await waitFor(element(by.id('result')))
      .toBeVisible()
      .withTimeout(5000);
    
    await expect(element(by.text('Success'))).toBeVisible();
  });
});
```

## Coverage Requirements

### Global Thresholds

```javascript
{
  global: {
    branches: 70,
    functions: 70,
    lines: 70,
    statements: 70,
  }
}
```

### Service-Specific Thresholds

```javascript
{
  './src/services/': {
    branches: 80,
    functions: 80,
    lines: 80,
    statements: 80,
  }
}
```

### Excluded from Coverage

- Type definition files (`*.d.ts`)
- Test files (`*.test.ts`, `*.spec.ts`)
- Story files (`*.stories.tsx`)
- Integration test directories

### Viewing Coverage

```bash
# Generate and open HTML report
npm run test:coverage
open coverage/lcov-report/index.html
```

### Coverage Tips

- **Focus on critical paths**: Not all code needs 100% coverage
- **Test behavior, not lines**: High coverage doesn't guarantee quality
- **Cover edge cases**: null, undefined, empty arrays, errors
- **Don't test libraries**: Focus on your code

## CI/CD Integration

### GitHub Actions Pipeline

Tests run automatically on:
- Push to `main` or `develop`
- Pull requests to `main` or `develop`

### Pipeline Stages

1. **Lint** (30s)
   - ESLint checks
   - Code style validation

2. **TypeCheck** (45s)
   - TypeScript compilation
   - Type error detection

3. **Unit Tests** (2-3 min)
   - All unit tests
   - Coverage generation
   - Codecov upload

4. **Integration Tests** (3-5 min)
   - React Native Testing Library tests
   - Component integration validation

5. **E2E Tests** (15-20 min)
   - iOS simulator tests
   - Critical user flows
   - Screenshot on failure

6. **Coverage Check** (10s)
   - Verify thresholds
   - Block merge if below

### Local Pre-Push Hook

Add to `.git/hooks/pre-push`:
```bash
#!/bin/sh

echo "Running tests before push..."

npm run test:unit
if [ $? -ne 0 ]; then
  echo "❌ Unit tests failed"
  exit 1
fi

npm run test:integration
if [ $? -ne 0 ]; then
  echo "❌ Integration tests failed"
  exit 1
fi

echo "✅ All tests passed"
```

## Troubleshooting

### Common Issues

#### Jest: Module not found

**Solution**: Clear Jest cache
```bash
npm test -- --clearCache
```

#### RTL: Element not found

**Solution**: Use `waitFor` for async rendering
```typescript
await waitFor(() => {
  expect(getByTestId('element')).toBeTruthy();
});
```

#### Detox: Test timeout

**Solution**: Increase timeout or check synchronization
```javascript
await waitFor(element(by.id('element')))
  .toBeVisible()
  .withTimeout(10000);
```

#### Detox: Build failed

**Solution**: Clean and rebuild
```bash
cd ios
xcodebuild clean
cd ..
npm run test:e2e:build
```

#### Coverage not generating

**Solution**: Ensure coverage is enabled in jest.config.js
```javascript
collectCoverage: true,
collectCoverageFrom: ['src/**/*.{js,jsx,ts,tsx}']
```

### Performance Issues

#### Slow unit tests

- Use `--maxWorkers=2` to limit parallelization
- Mock heavy dependencies
- Avoid actual API calls

#### Flaky E2E tests

- Increase timeouts
- Add explicit waits
- Check for race conditions
- Use `device.disableSynchronization()` if needed

### Debugging Tips

```bash
# Run single test file
npm test -- path/to/test.test.ts

# Run in band (no parallel)
npm test -- --runInBand

# Verbose output
npm test -- --verbose

# Watch specific test
npm test -- --watch --testNamePattern="specific test"
```

## Best Practices Summary

### ✅ Do

- Write tests before fixing bugs
- Test user-facing behavior
- Use descriptive test names
- Keep tests simple and focused
- Mock external dependencies
- Clean up after tests
- Run tests before committing

### ❌ Don't

- Test implementation details
- Copy-paste test code
- Ignore failing tests
- Skip E2E for critical flows
- Mock everything (integration tests)
- Leave debug code in tests
- Commit commented-out tests

## Resources

- [Jest Documentation](https://jestjs.io/)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Detox Documentation](https://wix.github.io/Detox/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## Contact

For questions or issues with testing:
- Open a GitHub issue
- Contact the QA team
- Check test logs in CI artifacts
