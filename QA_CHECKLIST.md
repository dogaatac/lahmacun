# Manual QA Checklist

## Pre-Release Testing Checklist

### 🎯 Core Functionality

#### Onboarding
- [ ] First launch shows onboarding screens
- [ ] Can navigate through all onboarding steps
- [ ] Skip button works and proceeds to main app
- [ ] Pagination dots update correctly
- [ ] "Get Started" button on final step navigates to home
- [ ] Onboarding is not shown on subsequent launches

#### Problem Capture & Analysis
- [ ] Camera permissions requested appropriately
- [ ] Camera preview displays correctly
- [ ] Capture button responds and captures image
- [ ] Image preview shows captured photo
- [ ] Retake button clears image and shows camera again
- [ ] Analyze button triggers problem analysis
- [ ] Loading indicator shown during analysis
- [ ] Error handling works when analysis fails
- [ ] Solution screen displays with correct data
- [ ] All solution steps render correctly
- [ ] Difficulty badge displays appropriate color

#### Chat Functionality
- [ ] Chat screen opens from solution
- [ ] Initial greeting message displays
- [ ] Can type messages in input field
- [ ] Send button is disabled when input is empty
- [ ] Send button is enabled with text input
- [ ] Messages send successfully
- [ ] AI responses appear in chat
- [ ] Typing indicator shows while waiting
- [ ] Chat history persists during session
- [ ] Error messages display on failure
- [ ] Keyboard dismisses appropriately

#### Quiz System
- [ ] Quiz selection screen displays available topics
- [ ] Quiz starts with correct number of questions
- [ ] Questions display properly
- [ ] Answer options are selectable
- [ ] Progress indicator updates correctly
- [ ] Quiz completion shows results screen
- [ ] Score is calculated and displayed accurately
- [ ] XP rewards are granted
- [ ] Can retake quiz

### 📊 Gamification

#### Progress & XP
- [ ] XP is awarded for solving problems
- [ ] XP is awarded for completing quizzes
- [ ] Level-up animation triggers at threshold
- [ ] Progress bar updates correctly
- [ ] XP values are accurate

#### Achievements
- [ ] First problem achievement unlocks
- [ ] Streak achievements unlock appropriately
- [ ] Quiz completion achievements unlock
- [ ] Achievement notifications display
- [ ] Achievement list shows all achievements
- [ ] Locked achievements are visible but grayed out

#### Streaks
- [ ] Streak increments on consecutive days
- [ ] Streak resets when day is missed
- [ ] Streak counter displays correctly
- [ ] Streak achievements unlock at milestones

### 💰 Monetization

#### Subscription Flow
- [ ] Free tier limitations are enforced
- [ ] Upgrade prompts appear appropriately
- [ ] Subscription screen displays all plans
- [ ] Plan features are clearly listed
- [ ] Plan prices display correctly
- [ ] Free trial information is clear
- [ ] Plan selection works correctly
- [ ] Purchase flow initiates successfully
- [ ] Payment processing displays status
- [ ] Purchase confirmation shows
- [ ] Premium features unlock after purchase
- [ ] Restore purchases works correctly

#### Paywall
- [ ] Paywall appears at appropriate limits
- [ ] Premium features are gated correctly
- [ ] Paywall can be dismissed
- [ ] Premium badge shows for subscribers

### 📱 Performance

#### Load Times
- [ ] App launches within 3 seconds
- [ ] Screen transitions are smooth (<300ms)
- [ ] Image capture is instantaneous
- [ ] Analysis completes within 10 seconds
- [ ] Chat responses appear within 5 seconds
- [ ] Quiz loads within 2 seconds

#### Memory Usage
- [ ] App uses <150MB RAM on average
- [ ] No memory leaks during extended use
- [ ] Images are properly disposed after use
- [ ] Chat history doesn't cause memory bloat

#### Battery Impact
- [ ] App doesn't drain battery excessively
- [ ] Background processes are minimal
- [ ] Camera usage is optimized

### 🌐 Offline Functionality

#### Core Features
- [ ] App launches without internet
- [ ] Cached solutions are accessible offline
- [ ] Offline mode indicator displays
- [ ] Queue syncs when connectivity returns
- [ ] Error messages are clear for offline actions

#### Data Persistence
- [ ] User progress saves offline
- [ ] Achievements persist offline
- [ ] Quiz results save offline
- [ ] Settings changes persist

### ♿ Accessibility

#### Screen Reader Support
- [ ] All buttons have accessibility labels
- [ ] Images have meaningful descriptions
- [ ] Screen reader announces navigation
- [ ] Forms are properly labeled
- [ ] Error messages are announced

#### Visual Accessibility
- [ ] Text contrast meets WCAG AA standards
- [ ] Font sizes are adjustable
- [ ] Color is not the only indicator
- [ ] Touch targets are at least 44x44 points
- [ ] Focus indicators are visible

#### Motor Accessibility
- [ ] All functionality accessible via touch
- [ ] No time-based interactions required
- [ ] Buttons have adequate spacing
- [ ] Gestures have alternatives

### 🔐 Security & Privacy

#### Data Protection
- [ ] User data is encrypted at rest
- [ ] API keys are not exposed
- [ ] Sensitive data not logged
- [ ] Privacy policy is accessible
- [ ] Terms of service are clear

#### Authentication
- [ ] Login works correctly
- [ ] Logout clears session
- [ ] Password reset functions
- [ ] Session expires appropriately

### 🌍 Localization

#### Language Support
- [ ] All text strings are translatable
- [ ] Date/time formats are localized
- [ ] Currency displays correctly
- [ ] RTL languages supported (if applicable)

### 📱 Device Compatibility

#### iOS
- [ ] Tested on iPhone SE (small screen)
- [ ] Tested on iPhone 14 (standard)
- [ ] Tested on iPhone 14 Pro Max (large screen)
- [ ] Tested on iOS 14.0 (minimum version)
- [ ] Tested on latest iOS version
- [ ] Safe area insets respected
- [ ] Notch/Dynamic Island handled correctly

#### Android (if applicable)
- [ ] Tested on small screen device
- [ ] Tested on standard device
- [ ] Tested on tablet
- [ ] Tested on Android 8.0 (minimum)
- [ ] Tested on latest Android
- [ ] Back button works correctly
- [ ] Status bar configured properly

### 🐛 Error Handling

#### Network Errors
- [ ] Timeout errors show appropriate message
- [ ] Network loss handled gracefully
- [ ] Retry mechanism works
- [ ] Offline mode activates correctly

#### Input Validation
- [ ] Empty inputs are validated
- [ ] Invalid inputs show error messages
- [ ] Form validation is clear
- [ ] Error messages are helpful

#### Edge Cases
- [ ] Extremely long text handled
- [ ] Special characters work correctly
- [ ] Multiple rapid taps don't cause issues
- [ ] Low storage handled gracefully

### 📊 Analytics & Tracking

#### Events
- [ ] Screen views are tracked
- [ ] Button taps are tracked
- [ ] Errors are tracked
- [ ] Conversions are tracked
- [ ] Custom events fire correctly

#### User Properties
- [ ] User ID is set correctly
- [ ] User properties update
- [ ] Anonymous users tracked
- [ ] Opt-out respected

## Release Readiness Criteria

### ✅ All Tests Pass
- [ ] Unit tests: 100% pass rate, >70% coverage
- [ ] Integration tests: 100% pass rate
- [ ] E2E tests: 100% pass rate, no flaky tests
- [ ] Manual tests: All critical paths verified

### ✅ Performance Benchmarks
- [ ] App size: <50MB
- [ ] Launch time: <3s
- [ ] Screen transitions: <300ms
- [ ] Memory usage: <150MB average

### ✅ Quality Metrics
- [ ] Zero critical bugs
- [ ] <5 high-priority bugs
- [ ] Code coverage >70% (services >80%)
- [ ] No console errors in production

### ✅ Compliance
- [ ] Privacy policy updated
- [ ] Terms of service reviewed
- [ ] App Store guidelines compliance
- [ ] COPPA compliance (if applicable)
- [ ] GDPR compliance (if applicable)

### ✅ Documentation
- [ ] README updated
- [ ] CHANGELOG updated
- [ ] API documentation current
- [ ] User guide available
- [ ] Known issues documented

## Notes

- Test on actual devices when possible, not just simulators
- Verify in both light and dark mode
- Test with various network conditions (3G, 4G, WiFi, offline)
- Check with different system settings (font sizes, reduced motion, etc.)
- Perform regression testing for all bug fixes
- Document any issues found with reproduction steps
- Retest critical paths after any bug fixes

## Sign-off

- [ ] QA Lead approval
- [ ] Product Manager approval
- [ ] Engineering Lead approval
- [ ] Stakeholder approval

---

**Last Updated:** [Date]  
**Release Version:** [Version Number]  
**Tester:** [Name]  
**Date Completed:** [Date]
