# IAP QA Testing Guide

## Pre-Test Setup

### Sandbox Account Setup
1. Create sandbox tester in App Store Connect
2. Use unique email not associated with real Apple ID
3. Sign out of production Apple ID on device (Settings → App Store)
4. DO NOT sign in with sandbox account in Settings

### App Configuration
- Products configured in App Store Connect
- App built and installed from Xcode (not TestFlight for IAP sandbox testing)
- Debug logging enabled for detailed output

## Test Cases

### TC-001: Product Loading
**Priority**: Critical  
**Prerequisites**: Fresh app install

**Steps**:
1. Launch app
2. Navigate to Profile → Manage subscription → Paywall
3. Wait for products to load

**Expected Results**:
- Loading indicator shows briefly
- Two subscription options display: "Pro Monthly" and "Tutor Pack"
- Prices show in local currency
- Prices match App Store Connect configuration
- Product descriptions are visible
- Feature lists are complete

**Failure Scenarios**:
- Products don't load → Check App Store Connect configuration
- Wrong prices → Verify product IDs match
- Infinite loading → Check network connection and product status

---

### TC-002: Purchase Flow - Pro Monthly
**Priority**: Critical  
**Prerequisites**: Sandbox account ready

**Steps**:
1. Navigate to Paywall screen
2. Tap "Subscribe Now" on Pro Monthly card
3. Sign in with sandbox tester account when prompted
4. Confirm purchase

**Expected Results**:
- Apple payment sheet appears
- Correct product and price shown
- Purchase processes successfully
- Success alert displays
- Navigation returns to previous screen
- Subscription status updates in Profile screen to "PREMIUM"
- Premium banner removed from Capture screen
- Analytics event tracked: `purchase_completed`

**Test Data**:
- Product ID: `com.studymate.pro.monthly`
- Tier: Premium

---

### TC-003: Purchase Flow - Tutor Pack
**Priority**: Critical  
**Prerequisites**: Sandbox account ready

**Steps**:
1. Navigate to Paywall screen
2. Tap "Subscribe Now" on Tutor Pack card
3. Sign in with sandbox tester account when prompted
4. Confirm purchase

**Expected Results**:
- Apple payment sheet appears
- Correct product and price shown
- Purchase processes successfully
- Success alert displays
- Navigation returns to previous screen
- Subscription status updates in Profile screen to "PRO"
- Premium banner removed from Capture screen
- AI chat shows unlimited messages
- Analytics event tracked: `purchase_completed`

**Test Data**:
- Product ID: `com.studymate.tutor.pack`
- Tier: Pro

---

### TC-004: Restore Purchases - Valid Purchase
**Priority**: Critical  
**Prerequisites**: Previous purchase made in sandbox

**Steps**:
1. Delete and reinstall app (or clear app data)
2. Navigate to Paywall screen
3. Tap "Restore Purchases" button
4. Sign in with sandbox account that has previous purchase

**Expected Results**:
- Loading indicator shows
- Success alert displays: "Your purchases have been restored"
- Subscription status reflects restored purchase
- Premium features unlock
- Navigation returns to previous screen
- Analytics event tracked: `restore_purchases_success`

---

### TC-005: Restore Purchases - No Purchases
**Priority**: High  
**Prerequisites**: Sandbox account with no purchases

**Steps**:
1. Navigate to Paywall screen with new sandbox account
2. Tap "Restore Purchases" button
3. Sign in with sandbox account (no purchases)

**Expected Results**:
- Loading indicator shows
- Alert displays: "No Purchases Found"
- User remains on paywall screen
- Subscription status remains "FREE"
- Analytics event tracked: `restore_purchases_none_found`

---

### TC-006: Feature Gate - Chat Message Limit
**Priority**: Critical  
**Prerequisites**: Free tier account

**Steps**:
1. Navigate to Chat screen
2. Send 3 messages
3. Attempt to send 4th message

**Expected Results**:
- Banner shows "0/3 free messages used" initially
- Counter increments with each message: "1/3", "2/3", "3/3"
- After 3rd message, alert displays: "Upgrade to Tutor Pack"
- Alert offers "Cancel" and "Upgrade" options
- Tapping "Upgrade" navigates to Paywall
- Tapping "Cancel" closes alert
- Analytics event tracked: `chat_limit_reached`

---

### TC-007: Feature Gate - Unlimited Chat (Pro)
**Priority**: High  
**Prerequisites**: Pro tier subscription active

**Steps**:
1. Purchase Tutor Pack subscription
2. Navigate to Chat screen
3. Send 10+ messages

**Expected Results**:
- No message limit banner displayed
- All messages send successfully
- No upgrade prompts shown
- Messages tracked with `has_pro_access: true` in analytics

---

### TC-008: Premium Banner Display
**Priority**: Medium  
**Prerequisites**: None

**Steps**:
1. Test with free account - check Capture screen
2. Purchase any subscription
3. Return to Capture screen

**Expected Results**:
- **Free Tier**: Gold banner displays at top with text "⭐ Upgrade to Pro - Unlimited problems & AI tutor"
- Banner is tappable and navigates to Paywall
- **Premium/Pro Tier**: No banner displayed

---

### TC-009: Subscription Status Display
**Priority**: High  
**Prerequisites**: Active subscription

**Steps**:
1. Purchase subscription
2. Navigate to Profile screen
3. Check Subscription section

**Expected Results**:
- Tier displays correctly: "PREMIUM" or "PRO"
- Status shows: "active"
- Renewal date displays: "Renews: [date]"
- "Manage" button present
- No grace period warning shown

---

### TC-010: Grace Period Display
**Priority**: High  
**Prerequisites**: Subscription in grace period (requires special sandbox setup)

**Steps**:
1. Set up subscription to enter grace period
2. Navigate to Profile screen
3. Check Subscription section

**Expected Results**:
- Status shows: "grace_period"
- Warning displays: "⚠️ Grace period - payment issue"
- Renewal date still shown
- Premium features still accessible
- Orange warning color for grace period text

**Note**: Grace period in sandbox is accelerated (16 days → ~10 minutes)

---

### TC-011: Expired Subscription
**Priority**: High  
**Prerequisites**: Expired subscription

**Steps**:
1. Wait for sandbox subscription to expire (6 renewals maximum)
2. Relaunch app
3. Navigate to Profile screen

**Expected Results**:
- Status shows: "expired"
- Expiry date displays: "Expired: [date]"
- Features revert to free tier
- Chat message limit reinstated
- Premium banner reappears
- "Upgrade" button shown instead of "Manage"

---

### TC-012: Purchase Cancellation
**Priority**: Medium  
**Prerequisites**: None

**Steps**:
1. Initiate purchase flow
2. Tap "Subscribe Now"
3. When Apple payment sheet appears, tap "Cancel"

**Expected Results**:
- Payment sheet dismisses
- No error alert shown
- User remains on Paywall screen
- Subscription status unchanged
- No analytics error event (user cancellation is normal)

---

### TC-013: Network Error Handling
**Priority**: High  
**Prerequisites**: None

**Steps**:
1. Enable Airplane Mode on device
2. Navigate to Paywall screen
3. Attempt to load products
4. Attempt to purchase

**Expected Results**:
- Products fail to load
- Error alert displays: "Failed to load subscription options"
- Restore purchases fails gracefully with error message
- Last known subscription status maintained
- App doesn't crash
- Analytics event tracked: error logged

---

### TC-014: Concurrent Purchase Prevention
**Priority**: Medium  
**Prerequisites**: Slow network or debug pause

**Steps**:
1. Tap "Subscribe Now" on one product
2. While processing, tap another "Subscribe Now" button

**Expected Results**:
- First purchase processes
- Second tap has no effect (button disabled during processing)
- Loading indicator shows on first selected product
- Only one purchase completes

---

### TC-015: App Backgrounding During Purchase
**Priority**: High  
**Prerequisites**: Purchase in progress

**Steps**:
1. Initiate purchase
2. While Apple payment sheet is showing, press Home button
3. Wait 30 seconds
4. Return to app

**Expected Results**:
- Purchase completes or can be retried
- App state recovers gracefully
- Subscription status updates correctly
- Receipt stored properly

---

### TC-016: Multiple Restores
**Priority**: Low  
**Prerequisites**: Existing purchase

**Steps**:
1. Tap "Restore Purchases"
2. Wait for completion
3. Immediately tap "Restore Purchases" again

**Expected Results**:
- First restore completes successfully
- Second restore also completes without error
- Subscription status correct
- No duplicate receipts stored
- User notified appropriately both times

---

### TC-017: Upgrade Path (Pro Monthly → Tutor Pack)
**Priority**: High  
**Prerequisites**: Active Pro Monthly subscription

**Steps**:
1. Purchase Pro Monthly
2. Navigate to Paywall
3. Purchase Tutor Pack

**Expected Results**:
- Apple handles subscription upgrade
- Prorated credit applied automatically
- Subscription updates to Tutor Pack (Pro tier)
- All Pro features unlock
- Profile shows "PRO" tier
- Chat shows unlimited messages

---

### TC-018: Price Localization
**Priority**: Medium  
**Prerequisites**: Device set to non-USD region

**Steps**:
1. Change device region to UK, EU, or other
2. Navigate to Paywall screen
3. Check displayed prices

**Expected Results**:
- Prices display in local currency (£, €, etc.)
- Formatting follows local conventions
- Prices match App Store Connect regional pricing

---

### TC-019: Analytics Tracking
**Priority**: Medium  
**Prerequisites**: Analytics service configured

**Steps**:
1. Navigate to Paywall → Track: `trackScreen("Paywall")`
2. Initiate purchase → Track: `purchase_initiated`
3. Complete purchase → Track: `purchase_completed`
4. Restore purchases → Track: `restore_purchases_initiated`
5. Hit chat limit → Track: `chat_limit_reached`

**Expected Results**:
- All events tracked with correct data
- Product IDs included in purchase events
- Error events include error messages
- Screen views tracked properly

---

### TC-020: Receipt Logging Security
**Priority**: High  
**Prerequisites**: Debug mode enabled

**Steps**:
1. Enable console logging
2. Complete a purchase
3. Check logs for sensitive data

**Expected Results**:
- Transaction receipts show as `[REDACTED_xxx...]`
- Purchase tokens show as `[REDACTED_xxx...]`
- Product IDs visible (not sensitive)
- Transaction IDs visible (not sensitive)
- Android signatures redacted
- Full receipts never logged in plain text

---

## Edge Cases

### EC-001: Rapid Subscription Changes
Purchase → Cancel → Repurchase within 1 minute

### EC-002: Device Time Manipulation
Change device time to future/past during active subscription

### EC-003: Jailbroken/Rooted Device
Test on modified device (document behavior, don't necessarily block)

### EC-004: Low Storage
Test with device nearly full (<100MB available)

### EC-005: Multiple Devices
Purchase on Device A, restore on Device B simultaneously

---

## Regression Testing

After any IAP-related code changes, run:
1. TC-002 (Purchase Flow)
2. TC-004 (Restore Purchases)
3. TC-006 (Feature Gates)
4. TC-013 (Network Errors)

---

## Performance Benchmarks

- Product loading: < 3 seconds
- Purchase completion: < 10 seconds (network dependent)
- Restore purchases: < 5 seconds
- Subscription status check: < 500ms (cached)

---

## Test Data

### Sandbox Test Accounts
```
Account 1: sandbox1@studymate-test.com
Use for: Fresh purchase testing

Account 2: sandbox2@studymate-test.com
Use for: Restore testing

Account 3: sandbox3@studymate-test.com
Use for: Expired subscription testing
```

### Product IDs
```
Pro Monthly: com.studymate.pro.monthly
Tutor Pack: com.studymate.tutor.pack
```

---

## Bug Reporting Template

```
**Bug ID**: IAP-XXX
**Severity**: Critical/High/Medium/Low
**Test Case**: TC-XXX
**Device**: iPhone 14, iOS 17.0
**Sandbox Account**: sandbox1@studymate-test.com

**Steps to Reproduce**:
1. 
2. 
3. 

**Expected Result**:

**Actual Result**:

**Screenshots/Logs**:

**Workaround**:

**Notes**:
```

---

## Sign-Off Criteria

All Critical and High priority test cases must pass before release:
- [ ] TC-002: Purchase Flow - Pro Monthly
- [ ] TC-003: Purchase Flow - Tutor Pack  
- [ ] TC-004: Restore Purchases - Valid
- [ ] TC-006: Feature Gate - Chat Limit
- [ ] TC-009: Subscription Status Display
- [ ] TC-013: Network Error Handling
- [ ] TC-015: App Backgrounding During Purchase
- [ ] TC-020: Receipt Logging Security
