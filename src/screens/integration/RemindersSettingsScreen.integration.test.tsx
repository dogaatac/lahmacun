import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { RemindersSettingsScreen } from "../RemindersSettingsScreen";
import SettingsService from "../../services/SettingsService";
import RemindersService from "../../services/RemindersService";
import NotificationService from "../../services/NotificationService";
import CalendarService from "../../services/CalendarService";
import AnalyticsService from "../../services/AnalyticsService";
import { Alert } from "react-native";

jest.mock("../../services/SettingsService");
jest.mock("../../services/RemindersService");
jest.mock("../../services/NotificationService");
jest.mock("../../services/CalendarService");
jest.mock("../../services/AnalyticsService");

const mockNavigate = jest.fn();
jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

jest.spyOn(Alert, "alert");

describe("RemindersSettingsScreen Integration Tests", () => {
  const mockSettings = {
    theme: "auto" as const,
    language: "en",
    notificationsEnabled: true,
    pushNotifications: true,
    emailNotifications: false,
    privacyMode: false,
    analyticsConsent: true,
    teacherMode: false,
    autoBackup: true,
    remindersEnabled: false,
    calendarSyncEnabled: false,
    reminderSettings: {
      defaultReminderTime: 30,
      quietHoursEnabled: false,
      quietHoursStart: "22:00",
      quietHoursEnd: "08:00",
      reminderDays: [1, 2, 3, 4, 5],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (SettingsService.getSettings as jest.Mock).mockResolvedValue(mockSettings);
    (NotificationService.getPermissionStatus as jest.Mock).mockResolvedValue({
      granted: false,
      canAskAgain: true,
      status: "undetermined",
    });
    (CalendarService.getPermissionStatus as jest.Mock).mockResolvedValue({
      granted: false,
      canAskAgain: true,
      status: "undetermined",
    });
  });

  it("should render reminders settings screen", async () => {
    const { getByTestId } = render(<RemindersSettingsScreen />);

    await waitFor(() => {
      expect(getByTestId("reminders-settings-screen")).toBeTruthy();
    });
  });

  it("should display permission statuses", async () => {
    const { getByText } = render(<RemindersSettingsScreen />);

    await waitFor(() => {
      expect(getByText("Notifications")).toBeTruthy();
      expect(getByText("Calendar Access")).toBeTruthy();
    });
  });

  it("should enable reminders when permission granted", async () => {
    (NotificationService.requestPermissions as jest.Mock).mockResolvedValue({
      granted: true,
      canAskAgain: false,
      status: "granted",
    });
    (RemindersService.enableReminders as jest.Mock).mockResolvedValue(
      undefined
    );
    (SettingsService.getSettings as jest.Mock)
      .mockResolvedValueOnce(mockSettings)
      .mockResolvedValueOnce({
        ...mockSettings,
        remindersEnabled: true,
      });

    const { getByTestId } = render(<RemindersSettingsScreen />);

    await waitFor(() => {
      expect(getByTestId("reminders-toggle")).toBeTruthy();
    });

    fireEvent(getByTestId("reminders-toggle"), "onValueChange", true);

    await waitFor(() => {
      expect(RemindersService.enableReminders).toHaveBeenCalled();
      expect(AnalyticsService.track).toHaveBeenCalledWith("reminders_toggled", {
        enabled: true,
      });
    });
  });

  it("should show alert when notification permission denied", async () => {
    (NotificationService.requestPermissions as jest.Mock).mockResolvedValue({
      granted: false,
      canAskAgain: false,
      status: "denied",
    });

    const { getByTestId } = render(<RemindersSettingsScreen />);

    await waitFor(() => {
      expect(getByTestId("reminders-toggle")).toBeTruthy();
    });

    fireEvent(getByTestId("reminders-toggle"), "onValueChange", true);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Permission Required",
        expect.any(String),
        expect.any(Array)
      );
    });
  });

  it("should enable calendar sync when permission granted", async () => {
    (CalendarService.requestPermissions as jest.Mock).mockResolvedValue({
      granted: true,
      canAskAgain: false,
      status: "granted",
    });
    (RemindersService.enableCalendarSync as jest.Mock).mockResolvedValue(
      undefined
    );
    (SettingsService.getSettings as jest.Mock)
      .mockResolvedValueOnce(mockSettings)
      .mockResolvedValueOnce({
        ...mockSettings,
        calendarSyncEnabled: true,
      });

    const { getByTestId } = render(<RemindersSettingsScreen />);

    await waitFor(() => {
      expect(getByTestId("calendar-sync-toggle")).toBeTruthy();
    });

    fireEvent(getByTestId("calendar-sync-toggle"), "onValueChange", true);

    await waitFor(() => {
      expect(RemindersService.enableCalendarSync).toHaveBeenCalled();
      expect(AnalyticsService.track).toHaveBeenCalledWith(
        "calendar_sync_toggled",
        {
          enabled: true,
        }
      );
    });
  });

  it("should show confirmation when disabling calendar sync", async () => {
    const enabledSettings = {
      ...mockSettings,
      calendarSyncEnabled: true,
    };
    (SettingsService.getSettings as jest.Mock).mockResolvedValue(
      enabledSettings
    );

    const { getByTestId } = render(<RemindersSettingsScreen />);

    await waitFor(() => {
      expect(getByTestId("calendar-sync-toggle")).toBeTruthy();
    });

    fireEvent(getByTestId("calendar-sync-toggle"), "onValueChange", false);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Disable Calendar Sync",
        expect.any(String),
        expect.any(Array)
      );
    });
  });

  it("should display reminder time options", async () => {
    const enabledSettings = {
      ...mockSettings,
      remindersEnabled: true,
    };
    (SettingsService.getSettings as jest.Mock).mockResolvedValue(
      enabledSettings
    );

    const { getByTestId } = render(<RemindersSettingsScreen />);

    await waitFor(() => {
      expect(getByTestId("reminder-time-15")).toBeTruthy();
      expect(getByTestId("reminder-time-30")).toBeTruthy();
      expect(getByTestId("reminder-time-60")).toBeTruthy();
      expect(getByTestId("reminder-time-120")).toBeTruthy();
    });
  });

  it("should change reminder time", async () => {
    const enabledSettings = {
      ...mockSettings,
      remindersEnabled: true,
    };
    (SettingsService.getSettings as jest.Mock).mockResolvedValue(
      enabledSettings
    );
    (SettingsService.updateSettings as jest.Mock).mockResolvedValue(undefined);

    const { getByTestId } = render(<RemindersSettingsScreen />);

    await waitFor(() => {
      expect(getByTestId("reminder-time-60")).toBeTruthy();
    });

    fireEvent.press(getByTestId("reminder-time-60"));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Change Reminder Time",
        expect.any(String),
        expect.any(Array)
      );
    });
  });

  it("should toggle quiet hours", async () => {
    const enabledSettings = {
      ...mockSettings,
      remindersEnabled: true,
    };
    (SettingsService.getSettings as jest.Mock).mockResolvedValue(
      enabledSettings
    );
    (SettingsService.updateSettings as jest.Mock).mockResolvedValue(undefined);

    const { getByTestId } = render(<RemindersSettingsScreen />);

    await waitFor(() => {
      expect(getByTestId("quiet-hours-toggle")).toBeTruthy();
    });

    fireEvent(getByTestId("quiet-hours-toggle"), "onValueChange", true);

    await waitFor(() => {
      expect(SettingsService.updateSettings).toHaveBeenCalledWith({
        reminderSettings: expect.objectContaining({
          quietHoursEnabled: true,
        }),
      });
      expect(AnalyticsService.track).toHaveBeenCalledWith(
        "quiet_hours_toggled",
        {
          enabled: true,
        }
      );
    });
  });

  it("should sync timezone", async () => {
    (RemindersService.syncWithTimezone as jest.Mock).mockResolvedValue(
      undefined
    );

    const { getByTestId } = render(<RemindersSettingsScreen />);

    await waitFor(() => {
      expect(getByTestId("sync-timezone-button")).toBeTruthy();
    });

    fireEvent.press(getByTestId("sync-timezone-button"));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Sync Timezone",
        expect.any(String),
        expect.any(Array)
      );
    });
  });

  it("should track screen view", async () => {
    render(<RemindersSettingsScreen />);

    await waitFor(() => {
      expect(AnalyticsService.trackScreen).toHaveBeenCalledWith(
        "RemindersSettings"
      );
    });
  });

  it("should display info section", async () => {
    const { getByText } = render(<RemindersSettingsScreen />);

    await waitFor(() => {
      expect(getByText("ℹ️ About Reminders")).toBeTruthy();
    });
  });
});
