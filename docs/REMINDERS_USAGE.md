# Study Reminders Feature

This document describes how to use the study reminders and calendar sync features.

## Overview

The reminders feature provides:
- Local push notifications for study sessions
- iOS Calendar integration
- Customizable reminder settings
- Quiet hours support
- Timezone-aware scheduling

## Architecture

### Services

1. **NotificationService** - Handles local notifications
   - Permission management
   - Notification scheduling and cancellation
   - Quiet hours logic

2. **CalendarService** - Handles iOS Calendar integration
   - Calendar permission management
   - Event creation/update/deletion
   - Calendar sync

3. **RemindersService** - Orchestrates study sessions
   - Study session management
   - Combines notifications and calendar
   - Settings integration

## Usage

### Creating a Study Session

```typescript
import RemindersService from './services/RemindersService';

// Create a study session
const startTime = new Date('2024-12-01T10:00:00');
const endTime = new Date('2024-12-01T11:00:00');

const session = await RemindersService.createStudySession(
  'Math Study Session',
  startTime,
  endTime,
  {
    description: 'Review algebra concepts',
    subject: 'Mathematics',
  }
);
```

### Enabling Reminders

```typescript
import RemindersService from './services/RemindersService';

try {
  await RemindersService.enableReminders();
  console.log('Reminders enabled');
} catch (error) {
  console.error('Permission denied:', error);
}
```

### Enabling Calendar Sync

```typescript
import RemindersService from './services/RemindersService';

try {
  await RemindersService.enableCalendarSync();
  console.log('Calendar sync enabled');
} catch (error) {
  console.error('Permission denied:', error);
}
```

### Managing Study Sessions

```typescript
import RemindersService from './services/RemindersService';

// Get upcoming sessions
const upcoming = await RemindersService.getUpcomingSessions(10);

// Update a session
await RemindersService.updateStudySession('session-id', {
  title: 'Updated Title',
  startTime: newStartTime.getTime(),
});

// Delete a session
await RemindersService.deleteStudySession('session-id');
```

### Configuring Reminder Settings

```typescript
import SettingsService from './services/SettingsService';

await SettingsService.updateSettings({
  reminderSettings: {
    defaultReminderTime: 30, // minutes before session
    quietHoursEnabled: true,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
    reminderDays: [1, 2, 3, 4, 5], // Monday to Friday
  },
});
```

### Syncing After Timezone Change

```typescript
import RemindersService from './services/RemindersService';

// Call this when the user travels to a different timezone
await RemindersService.syncWithTimezone();
```

## User Interface

### Accessing Reminders Settings

1. Navigate to Settings screen
2. Tap on "Study Reminders" under Features section
3. Configure permissions, reminders, and calendar sync

### Permissions

The app will request permissions when you first enable:
- **Notifications**: Required for reminders
- **Calendar**: Required for calendar sync

If permissions are denied, you'll see a button to open device Settings.

### Features

#### Reminders Toggle
Enable/disable study session reminders

#### Calendar Sync Toggle
Enable/disable iOS Calendar integration

#### Default Reminder Time
Choose when to receive notifications (15m, 30m, 1h, 2h before session)

#### Quiet Hours
Prevent notifications during specified times

#### Timezone Sync
Update all scheduled reminders when timezone changes

## Testing

### Running Tests

```bash
# Unit tests
npm run test -- NotificationService.test.ts
npm run test -- RemindersService.test.ts

# Integration tests
npm run test -- RemindersSettingsScreen.integration.test.tsx
```

### Testing on Simulator

1. Enable reminders in the app
2. Create a study session with a near-future time
3. Background the app
4. Wait for notification to appear

### Testing Calendar Sync

1. Enable calendar sync in the app
2. Create a study session
3. Open iOS Calendar app
4. Verify event appears in calendar

## Permissions

### iOS

Add these keys to `Info.plist`:

```xml
<key>NSCalendarsUsageDescription</key>
<string>We need access to your calendar to sync study sessions</string>
<key>NSRemindersUsageDescription</key>
<string>We need access to reminders to schedule study notifications</string>
```

### Android

Add these permissions to `AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
<uses-permission android:name="android.permission.READ_CALENDAR"/>
<uses-permission android:name="android.permission.WRITE_CALENDAR"/>
```

## Troubleshooting

### Notifications Not Appearing

1. Check notification permissions in device Settings
2. Verify reminders are enabled in app Settings
3. Ensure notification is not scheduled during quiet hours
4. Check that the scheduled time is in the future

### Calendar Events Not Syncing

1. Check calendar permissions in device Settings
2. Verify calendar sync is enabled in app Settings
3. Check that a compatible calendar exists on the device

### Timezone Issues

1. Use the "Sync Timezone" button after traveling
2. Verify device timezone is set correctly
3. Check that study sessions have correct timestamps

## Future Enhancements

- Recurring study sessions
- Smart reminder timing based on user behavior
- Integration with Study Plan feature
- Notification customization (sound, vibration)
- Weekly summary notifications
