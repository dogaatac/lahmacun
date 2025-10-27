# Apple In-App Purchase Implementation Guide

## Overview

StudyMate now supports Apple in-app purchases (IAP) using StoreKit 2 through the `react-native-iap` library. This implementation includes three subscription tiers: Free, Pro Monthly, and Tutor Pack.

## Product Identifiers

The following product IDs are configured for Apple App Store:

- **Pro Monthly**: `com.studymate.pro.monthly` - $9.99/month
- **Tutor Pack**: `com.studymate.tutor.pack` - $19.99/month

### Subscription Tiers

1. **Free Tier**
   - 5 problems per day
   - Basic step-by-step solutions
   - Access to community forum
   - 3 free AI tutor chat messages

2. **Pro Monthly** (`premium` tier)
   - Unlimited problems
   - Detailed explanations
   - Practice quizzes
   - Progress tracking
   - No ads

3. **Tutor Pack** (`pro` tier)
   - All Pro Monthly features
   - Unlimited AI Tutor chat
   - Teacher mode
   - Advanced analytics
   - Export capabilities
   - API access
   - Priority support

## Architecture

### Services

#### IAPService
Located at `src/services/IAPService.ts`, handles:
- IAP connection initialization and teardown
- Product fetching from App Store
- Purchase flow management
- Receipt validation (client-side, best effort)
- Purchase restoration
- Subscription status tracking with grace periods
- Receipt storage in AsyncStorage (secure)
- Purchase history tracking
- Logging with sensitive data scrubbing

#### SubscriptionService
Located at `src/services/SubscriptionService.ts`, handles:
- Integration with IAPService
- Entitlement checks throughout the app
- Subscription tier mapping
- Feature availability checks

### Screens

#### PaywallScreen
Located at `src/screens/PaywallScreen.tsx`, features:
- Display of all subscription tiers with benefits
- Purchase buttons for each tier
- Restore purchases functionality
- Terms of Service and Privacy Policy links
- Automatic price localization from App Store

#### Feature Gates
- **CaptureScreen**: Premium banner for free users
- **ChatScreen**: Message limit (3 free messages) with upgrade prompt
- **ProfileScreen**: Subscription status display with grace period warnings

## Receipt Validation

The implementation includes client-side receipt validation with the following checks:
- Transaction ID presence
- Product ID validation against configured products
- Transaction date verification (not in future)
- Receipt data integrity

**Note**: This is "best effort" validation. For production, consider implementing server-side receipt validation with Apple's App Store Server API.

## Subscription Status & Grace Periods

The system tracks subscription status with the following states:
- `active`: Subscription is valid and current
- `grace_period`: Payment failed but user retains access (16 days)
- `expired`: Subscription and grace period have ended
- `cancelled`: User manually cancelled subscription

Grace period handling:
- Default grace period: 16 days after subscription end date
- Users retain full access during grace period
- UI displays warning indicator during grace period
- Grace period end date stored in subscription data

## Local Persistence

Subscription data is stored securely using:
- **AsyncStorage** for receipt data and subscription status
- Receipt data is stored with sensitive fields (receipt strings, tokens) available only to the IAP service
- Purchase history maintained for audit purposes

Storage keys:
- `iap_receipts`: Current receipts
- `iap_purchase_history`: Historical purchases
- `user_subscription`: Current subscription details

## Feature Entitlement Checks

### Usage Example

```typescript
// Check if user has premium access
const hasPremium = await SubscriptionService.hasPremiumAccess();

// Check if user has pro access
const hasPro = await SubscriptionService.hasProAccess();

// Check specific feature
const hasFeature = await SubscriptionService.checkEntitlement("unlimited problems");
```

### Implemented Gates

1. **AI Tutor Chat** (ChatScreen)
   - Free users: 3 messages
   - Pro/Tutor Pack: Unlimited

2. **Premium Banner** (CaptureScreen)
   - Shown to free users only
   - Links to paywall

## Sandbox Testing

### Prerequisites

1. **Apple Developer Account**
   - App registered in App Store Connect
   - In-App Purchases configured with the product IDs above

2. **Sandbox Tester Account**
   - Created in App Store Connect → Users and Access → Sandbox Testers
   - Use a unique email that is NOT associated with a real Apple ID

### Setup Steps

1. **Configure Products in App Store Connect**
   ```
   Product ID: com.studymate.pro.monthly
   Type: Auto-Renewable Subscription
   Duration: 1 month
   Price: $9.99
   
   Product ID: com.studymate.tutor.pack
   Type: Auto-Renewable Subscription
   Duration: 1 month
   Price: $19.99
   ```

2. **Build and Install App**
   ```bash
   # Install dependencies
   npm install
   cd ios && pod install && cd ..
   
   # Build for iOS
   npm run ios
   ```

3. **Sign Out of Production Apple ID**
   - Go to Settings → App Store → Sign Out
   - DO NOT sign in with sandbox account here

4. **Test Purchase Flow**
   - Open app and navigate to Paywall
   - Select a subscription tier
   - Tap "Subscribe Now"
   - When prompted, sign in with sandbox tester account
   - Approve the purchase

### Testing Checklist

- [ ] Products load correctly from App Store
- [ ] Prices display in local currency
- [ ] Purchase flow completes successfully
- [ ] Subscription status updates in Profile screen
- [ ] Premium features unlock after purchase
- [ ] Restore purchases works for existing subscriptions
- [ ] Feature gates work correctly (Chat message limit)
- [ ] Grace period display shows when applicable
- [ ] Network error handling works (airplane mode test)

### Accelerated Subscription Testing

In sandbox environment, subscriptions renew faster:
- 1 week subscription = 3 minutes
- 1 month subscription = 5 minutes
- 2 months subscription = 10 minutes
- 3 months subscription = 15 minutes
- 6 months subscription = 30 minutes
- 1 year subscription = 1 hour

Subscriptions auto-renew 6 times maximum in sandbox, then expire.

## Edge Cases & Error Handling

### Network Errors
- All IAP operations wrapped in try-catch
- User-friendly error messages displayed
- Analytics tracking for failures
- Offline state: last known subscription status used

### Purchase Interruptions
- Purchase listeners set up to handle background/foreground transitions
- Unfinished transactions automatically finished on app launch
- Receipt validation before finishing transaction

### Cancellation Handling
- User must cancel in App Store settings
- App checks subscription status on launch
- Expired subscriptions revert to free tier
- Grace period allows continued access during payment issues

### Restore Purchases Scenarios
1. **New Device**: User can restore on new device
2. **Reinstall**: Previous purchases restored
3. **No Purchases**: Friendly message shown
4. **Multiple Purchases**: Latest active subscription applied

## Logging & Debugging

### Enable Debug Logs
Logs are automatically enabled in development mode (`__DEV__`).

### Log Scrubbing
Sensitive data is automatically scrubbed from logs:
- Transaction receipts (only first 10 characters shown)
- Purchase tokens
- Android signature data

Example log output:
```
[IAPService] Purchase updated {
  transactionReceipt: "[REDACTED_base64dat...]",
  productId: "com.studymate.pro.monthly",
  transactionId: "1000000123456789"
}
```

## Production Considerations

### Before Launch

1. **Server-Side Receipt Validation**
   - Implement backend validation using Apple's App Store Server API
   - Verify receipt authenticity with Apple servers
   - Store validated receipts in secure database

2. **Subscription Group Setup**
   - Configure subscription group in App Store Connect
   - Set upgrade/downgrade behavior
   - Configure introductory offers if desired

3. **Legal Requirements**
   - Implement Terms of Service
   - Implement Privacy Policy
   - Add GDPR compliance if applicable
   - Display required App Store subscription information

4. **Analytics Enhancement**
   - Track conversion funnel (view → click → purchase)
   - Monitor failed purchases and reasons
   - Track restoration success rate
   - A/B test pricing and messaging

5. **Security Hardening**
   - Move to Keychain storage for receipts (iOS)
   - Implement certificate pinning for API calls
   - Add jailbreak detection
   - Obfuscate product IDs if needed

### Monitoring

Track the following metrics:
- Purchase success rate
- Restoration success rate
- Failed transaction reasons
- Grace period entry/exit
- Subscription churn rate
- Average subscription lifetime

## Troubleshooting

### Common Issues

1. **Products Not Loading**
   - Verify products configured in App Store Connect
   - Check product IDs match exactly
   - Ensure agreements signed in App Store Connect
   - Wait 2-4 hours after creating products

2. **Purchase Fails Immediately**
   - Check sandbox tester account is valid
   - Ensure not signed into production Apple ID
   - Verify app bundle ID matches App Store Connect
   - Check subscription is available in tester's region

3. **Receipt Validation Fails**
   - Ensure transaction completed successfully
   - Check receipt data is present
   - Verify product ID in receipt matches expected

4. **Restore Purchases Returns Nothing**
   - Verify previous purchases in sandbox account
   - Check purchase wasn't refunded
   - Ensure signed in with correct sandbox account

## Testing Commands

```bash
# Run with debug logging
npm run ios

# Test with network disabled
# Enable Airplane Mode on device/simulator

# Reset sandbox account purchases (iOS Settings → App Store → Sandbox Account → Manage → Reset)

# Clear app data
# Delete app and reinstall
```

## Code Examples

### Making a Purchase
```typescript
import SubscriptionService from "./services/SubscriptionService";

// Initialize IAP
await SubscriptionService.initializeIAP();

// Get available products
const products = await SubscriptionService.getAvailableProducts();

// Purchase a product
const success = await SubscriptionService.purchaseSubscription(
  "com.studymate.pro.monthly"
);
```

### Checking Entitlements
```typescript
import SubscriptionService from "./services/SubscriptionService";

// Check premium access
const hasPremium = await SubscriptionService.hasPremiumAccess();

if (!hasPremium) {
  // Show upgrade prompt
  navigation.navigate("Paywall");
}
```

### Restoring Purchases
```typescript
import SubscriptionService from "./services/SubscriptionService";

const restored = await SubscriptionService.restorePurchases();

if (restored) {
  Alert.alert("Success", "Your purchases have been restored!");
} else {
  Alert.alert("No Purchases Found", "You have no previous purchases.");
}
```

## Support Resources

- [react-native-iap Documentation](https://github.com/dooboolab/react-native-iap)
- [Apple StoreKit Documentation](https://developer.apple.com/documentation/storekit)
- [App Store Connect Help](https://help.apple.com/app-store-connect/)
- [Sandbox Testing Guide](https://developer.apple.com/documentation/storekit/in-app_purchase/testing_in-app_purchases_with_sandbox)

## Changelog

- **v1.0.0** - Initial IAP implementation with StoreKit 2
  - Three subscription tiers configured
  - Client-side receipt validation
  - Grace period support (16 days)
  - Feature gating for AI chat and premium features
  - Restore purchases functionality
  - Comprehensive error handling and logging
