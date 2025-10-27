# React Native Testing App

A comprehensive React Native application with full testing coverage including unit tests, integration tests, E2E tests, and manual QA procedures.

## Features

- 📸 Math problem capture and AI-powered solution generation
- 💬 Interactive chat for problem clarification (with AI tutor)
- 🎯 Personalized quiz generation
- 🏆 Gamification with XP, levels, and achievements
- 💰 Apple In-App Purchase subscriptions (StoreKit 2)
  - Free tier with limited features
  - Pro Monthly: Unlimited problems and premium features
  - Tutor Pack: All premium features + unlimited AI tutor chat
- 🔐 Receipt validation and secure storage
- 🎁 Restore purchases functionality
- ♿ Full accessibility support
- 🌐 Offline functionality

## Testing Strategy

### Unit Tests (Jest)

Located in `src/services/__tests__/`, covering:
- **GeminiService**: AI integration, problem analysis, quiz generation
- **StorageService**: Local data persistence
- **AnalyticsService**: Event tracking and user identification
- **GamificationService**: XP, levels, achievements, streaks

**Coverage Targets:**
- Global: 70% (branches, functions, lines, statements)
- Services: 80% (branches, functions, lines, statements)

**Run unit tests:**
```bash
npm run test:unit           # Run once
npm run test:watch          # Watch mode
npm run test:coverage       # With coverage report
```

### Integration Tests (React Native Testing Library)

Located in `src/screens/integration/`, covering:
- **OnboardingScreen**: Navigation flow, analytics tracking
- **CaptureScreen**: Image capture, analysis workflow
- **SolutionScreen**: Solution display, navigation
- **ChatScreen**: Message sending, AI responses

**Run integration tests:**
```bash
npm run test:integration
```

### E2E Tests (Detox)

Located in `e2e/`, covering critical user flows:
- **Onboarding**: Complete flow, skip functionality
- **Problem Solving**: Capture → Analyze → Solution
- **Quiz Taking**: Start → Answer → Complete → Results
- **Purchase Flow**: Plan selection → Subscription → Confirmation

**Setup Detox (iOS):**
```bash
# Install dependencies
npm install

# Build app for testing
npm run test:e2e:build

# Run E2E tests
npm run test:e2e
```

**Run specific test suite:**
```bash
detox test e2e/onboarding.e2e.js -c ios.sim.debug
detox test e2e/problemSolving.e2e.js -c ios.sim.debug
```

### Manual QA

Comprehensive checklist in `QA_CHECKLIST.md` covering:
- ✅ Core functionality
- 📊 Performance benchmarks
- 🌐 Offline scenarios
- ♿ Accessibility compliance
- 💰 Monetization flows
- 🔐 Security and privacy
- 📱 Device compatibility

## Project Structure

```
.
├── src/
│   ├── services/           # Business logic services
│   │   ├── __tests__/     # Unit tests
│   │   ├── GeminiService.ts
│   │   ├── StorageService.ts
│   │   ├── AnalyticsService.ts
│   │   ├── GamificationService.ts
│   │   ├── IAPService.ts          # In-App Purchase service
│   │   └── SubscriptionService.ts # Subscription management
│   ├── screens/            # UI screens
│   │   ├── integration/    # Integration tests
│   │   ├── OnboardingScreen.tsx
│   │   ├── CaptureScreen.tsx
│   │   ├── SolutionScreen.tsx
│   │   ├── ChatScreen.tsx
│   │   └── PaywallScreen.tsx      # Subscription paywall
│   └── types/              # TypeScript types
├── docs/                   # Documentation
│   ├── IAP_IMPLEMENTATION.md      # IAP implementation guide
│   └── IAP_QA_GUIDE.md           # IAP testing guide
├── e2e/                    # End-to-end tests
│   ├── onboarding.e2e.js
│   ├── problemSolving.e2e.js
│   ├── quiz.e2e.js
│   └── purchase.e2e.js
├── jest.config.js          # Jest configuration
├── .detoxrc.js            # Detox configuration
└── QA_CHECKLIST.md        # Manual testing checklist
```

## CI/CD Pipeline

GitHub Actions workflow (`.github/workflows/ci.yml`) runs:

1. **Lint**: ESLint checks
2. **TypeCheck**: TypeScript compilation
3. **Unit Tests**: Jest with coverage
4. **Integration Tests**: RTL tests
5. **E2E Tests**: Detox on iOS simulator
6. **Coverage Check**: Verify thresholds
7. **Build**: Android APK and iOS build

**Pipeline triggers:**
- Push to `main` or `develop`
- Pull requests to `main` or `develop`

## Coverage Reports

Coverage reports are generated in `coverage/` directory:
- `coverage/lcov-report/index.html` - HTML report
- `coverage/coverage-summary.json` - JSON summary
- `coverage/lcov.info` - LCOV format

View coverage:
```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

## Running All Tests

Run the complete test suite:
```bash
npm run test:all
```

This executes:
1. Unit tests with coverage
2. Integration tests
3. E2E tests (requires iOS simulator)

## Test Commands Summary

| Command | Description |
|---------|-------------|
| `npm test` | Run unit tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage |
| `npm run test:unit` | Run only unit tests |
| `npm run test:integration` | Run only integration tests |
| `npm run test:e2e:build` | Build app for E2E testing |
| `npm run test:e2e` | Run E2E tests |
| `npm run test:all` | Run all test suites |

## Prerequisites

- Node.js 16+
- npm or yarn
- Xcode 14+ (for iOS)
- CocoaPods (for iOS dependencies)
- Android Studio (for Android)
- iOS Simulator or physical device

## Installation

```bash
# Clone repository
git clone <repository-url>
cd rn-testing-app

# Install dependencies
npm install

# iOS only: Install pods
cd ios && pod install && cd ..

# Start Metro bundler
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android
```

## In-App Purchases (IAP)

### Testing IAP in Sandbox

1. **Configure Products in App Store Connect**
   - Product IDs: `com.studymate.pro.monthly`, `com.studymate.tutor.pack`
   - See `docs/IAP_IMPLEMENTATION.md` for detailed setup

2. **Create Sandbox Tester Account**
   - App Store Connect → Users and Access → Sandbox Testers
   - Use unique email NOT associated with real Apple ID

3. **Test Purchase Flow**
   - Sign out of production Apple ID (Settings → App Store)
   - Run app from Xcode
   - Navigate to Profile → Upgrade
   - Make test purchase with sandbox account

4. **Comprehensive Testing**
   - See `docs/IAP_QA_GUIDE.md` for 20+ test cases
   - Includes edge cases, error handling, and grace periods

### IAP Features
- 3 subscription tiers: Free, Pro Monthly, Tutor Pack
- Client-side receipt validation
- Grace period support (16 days)
- Restore purchases functionality
- Feature gating (chat limits, premium banners)

## Environment Variables

Create `.env` file in root:
```
GEMINI_API_KEY=your_api_key_here
ANALYTICS_KEY=your_analytics_key
```

## Known Issues

- Detox tests require iOS simulator to be running
- Coverage collection may slow down test execution
- E2E tests may be flaky on slow machines (increase timeouts if needed)

## Contributing

1. Write tests for new features
2. Ensure all tests pass before submitting PR
3. Maintain coverage thresholds (70% global, 80% services)
4. Update QA checklist for new user flows

## License

MIT

## Support

For issues and questions, please open a GitHub issue.
