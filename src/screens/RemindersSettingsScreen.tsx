import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  Platform,
  Linking,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import SettingsService from "../services/SettingsService";
import RemindersService from "../services/RemindersService";
import NotificationService from "../services/NotificationService";
import CalendarService from "../services/CalendarService";
import AnalyticsService from "../services/AnalyticsService";
import { UserSettings, ReminderSettings } from "../types";

export const RemindersSettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [reminderSettings, setReminderSettings] = useState<ReminderSettings | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<string>('undetermined');
  const [calendarPermission, setCalendarPermission] = useState<string>('undetermined');

  useEffect(() => {
    loadSettings();
    checkPermissions();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const settingsData = await SettingsService.getSettings();
      setSettings(settingsData);
      setReminderSettings(settingsData.reminderSettings || getDefaultReminderSettings());
      AnalyticsService.trackScreen("RemindersSettings");
    } catch (error) {
      Alert.alert("Error", "Failed to load settings");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const checkPermissions = async () => {
    try {
      const notifStatus = await NotificationService.getPermissionStatus();
      setNotificationPermission(notifStatus.status);

      const calStatus = await CalendarService.getPermissionStatus();
      setCalendarPermission(calStatus.status);
    } catch (error) {
      console.error("Error checking permissions:", error);
    }
  };

  const getDefaultReminderSettings = (): ReminderSettings => ({
    defaultReminderTime: 30,
    quietHoursEnabled: false,
    quietHoursStart: "22:00",
    quietHoursEnd: "08:00",
    reminderDays: [1, 2, 3, 4, 5],
  });

  const handleToggleReminders = async (enabled: boolean) => {
    try {
      if (enabled) {
        const status = await NotificationService.requestPermissions();
        
        if (!status.granted) {
          Alert.alert(
            "Permission Required",
            "Please enable notifications in Settings to use reminders.",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Open Settings",
                onPress: () => {
                  if (Platform.OS === "ios") {
                    Linking.openURL("app-settings:");
                  } else {
                    Linking.openSettings();
                  }
                },
              },
            ]
          );
          return;
        }

        await RemindersService.enableReminders();
        setNotificationPermission(status.status);
      } else {
        await RemindersService.disableReminders();
      }

      const updatedSettings = await SettingsService.getSettings();
      setSettings(updatedSettings);
      AnalyticsService.track("reminders_toggled", { enabled });
    } catch (error) {
      Alert.alert("Error", "Failed to update reminders setting");
      console.error(error);
    }
  };

  const handleToggleCalendarSync = async (enabled: boolean) => {
    try {
      if (enabled) {
        const status = await CalendarService.requestPermissions();
        
        if (!status.granted) {
          Alert.alert(
            "Permission Required",
            "Please enable calendar access in Settings to sync study sessions.",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Open Settings",
                onPress: () => {
                  if (Platform.OS === "ios") {
                    Linking.openURL("app-settings:");
                  } else {
                    Linking.openSettings();
                  }
                },
              },
            ]
          );
          return;
        }

        await RemindersService.enableCalendarSync();
        setCalendarPermission(status.status);
      } else {
        Alert.alert(
          "Disable Calendar Sync",
          "This will remove all study sessions from your calendar. Continue?",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Disable",
              style: "destructive",
              onPress: async () => {
                await RemindersService.disableCalendarSync();
                const updatedSettings = await SettingsService.getSettings();
                setSettings(updatedSettings);
              },
            },
          ]
        );
        return;
      }

      const updatedSettings = await SettingsService.getSettings();
      setSettings(updatedSettings);
      AnalyticsService.track("calendar_sync_toggled", { enabled });
    } catch (error) {
      Alert.alert("Error", "Failed to update calendar sync setting");
      console.error(error);
    }
  };

  const handleToggleQuietHours = async (enabled: boolean) => {
    if (!reminderSettings) return;

    try {
      const updatedReminderSettings = {
        ...reminderSettings,
        quietHoursEnabled: enabled,
      };

      await SettingsService.updateSettings({
        reminderSettings: updatedReminderSettings,
      });

      setReminderSettings(updatedReminderSettings);
      AnalyticsService.track("quiet_hours_toggled", { enabled });
    } catch (error) {
      Alert.alert("Error", "Failed to update quiet hours setting");
    }
  };

  const handleChangeReminderTime = (minutes: number) => {
    if (!reminderSettings) return;

    Alert.alert(
      "Change Reminder Time",
      `Set default reminder to ${minutes} minutes before study session?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            try {
              const updatedReminderSettings = {
                ...reminderSettings,
                defaultReminderTime: minutes,
              };

              await SettingsService.updateSettings({
                reminderSettings: updatedReminderSettings,
              });

              setReminderSettings(updatedReminderSettings);
              AnalyticsService.track("reminder_time_changed", { minutes });
            } catch (error) {
              Alert.alert("Error", "Failed to update reminder time");
            }
          },
        },
      ]
    );
  };

  const handleSyncTimezone = async () => {
    try {
      Alert.alert(
        "Sync Timezone",
        "This will update all scheduled reminders and calendar events to match your current timezone.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Sync",
            onPress: async () => {
              setLoading(true);
              await RemindersService.syncWithTimezone();
              setLoading(false);
              Alert.alert("Success", "All reminders synced with current timezone");
              AnalyticsService.track("timezone_synced");
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert("Error", "Failed to sync timezone");
      console.error(error);
    }
  };

  const getPermissionStatusText = (status: string): string => {
    switch (status) {
      case "granted":
        return "✅ Granted";
      case "denied":
        return "❌ Denied";
      default:
        return "⚠️ Not Set";
    }
  };

  const getPermissionStatusColor = (status: string): string => {
    switch (status) {
      case "granted":
        return "#4CAF50";
      case "denied":
        return "#F44336";
      default:
        return "#FF9800";
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!settings || !reminderSettings) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load settings</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} testID="reminders-settings-screen">
      {/* Permissions Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Permissions</Text>

        <View style={styles.permissionRow}>
          <View style={styles.permissionInfo}>
            <Text style={styles.permissionLabel}>Notifications</Text>
            <Text
              style={[
                styles.permissionStatus,
                { color: getPermissionStatusColor(notificationPermission) },
              ]}
            >
              {getPermissionStatusText(notificationPermission)}
            </Text>
          </View>
          {notificationPermission === "denied" && (
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => {
                if (Platform.OS === "ios") {
                  Linking.openURL("app-settings:");
                } else {
                  Linking.openSettings();
                }
              }}
              testID="open-notification-settings-button"
            >
              <Text style={styles.settingsButtonText}>Settings</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.permissionRow}>
          <View style={styles.permissionInfo}>
            <Text style={styles.permissionLabel}>Calendar Access</Text>
            <Text
              style={[
                styles.permissionStatus,
                { color: getPermissionStatusColor(calendarPermission) },
              ]}
            >
              {getPermissionStatusText(calendarPermission)}
            </Text>
          </View>
          {calendarPermission === "denied" && (
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => {
                if (Platform.OS === "ios") {
                  Linking.openURL("app-settings:");
                } else {
                  Linking.openSettings();
                }
              }}
              testID="open-calendar-settings-button"
            >
              <Text style={styles.settingsButtonText}>Settings</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Features Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Features</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Study Reminders</Text>
            <Text style={styles.settingDescription}>
              Get notified before study sessions
            </Text>
          </View>
          <Switch
            value={settings.remindersEnabled || false}
            onValueChange={handleToggleReminders}
            testID="reminders-toggle"
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Calendar Sync</Text>
            <Text style={styles.settingDescription}>
              Sync study sessions with iOS Calendar
            </Text>
          </View>
          <Switch
            value={settings.calendarSyncEnabled || false}
            onValueChange={handleToggleCalendarSync}
            testID="calendar-sync-toggle"
          />
        </View>
      </View>

      {/* Reminder Settings Section */}
      {settings.remindersEnabled && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reminder Settings</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Default Reminder Time</Text>
              <Text style={styles.settingDescription}>
                {reminderSettings.defaultReminderTime} minutes before session
              </Text>
            </View>
          </View>

          <View style={styles.timeOptionsContainer}>
            {[15, 30, 60, 120].map((minutes) => (
              <TouchableOpacity
                key={minutes}
                style={[
                  styles.timeOption,
                  reminderSettings.defaultReminderTime === minutes &&
                    styles.timeOptionActive,
                ]}
                onPress={() => handleChangeReminderTime(minutes)}
                testID={`reminder-time-${minutes}`}
              >
                <Text
                  style={[
                    styles.timeOptionText,
                    reminderSettings.defaultReminderTime === minutes &&
                      styles.timeOptionTextActive,
                  ]}
                >
                  {minutes < 60 ? `${minutes}m` : `${minutes / 60}h`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Quiet Hours</Text>
              <Text style={styles.settingDescription}>
                {reminderSettings.quietHoursEnabled
                  ? `${reminderSettings.quietHoursStart} - ${reminderSettings.quietHoursEnd}`
                  : "No notifications during quiet hours"}
              </Text>
            </View>
            <Switch
              value={reminderSettings.quietHoursEnabled}
              onValueChange={handleToggleQuietHours}
              testID="quiet-hours-toggle"
            />
          </View>
        </View>
      )}

      {/* Actions Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions</Text>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleSyncTimezone}
          testID="sync-timezone-button"
        >
          <Text style={styles.actionButtonText}>🌍 Sync Timezone</Text>
        </TouchableOpacity>

        <Text style={styles.actionDescription}>
          Update all reminders and calendar events when traveling
        </Text>
      </View>

      {/* Info Section */}
      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>ℹ️ About Reminders</Text>
        <Text style={styles.infoText}>
          • Reminders notify you before study sessions{"\n"}
          • Calendar sync adds events to your iOS Calendar{"\n"}
          • Quiet hours prevent notifications during set times{"\n"}
          • Reminders automatically adjust for timezone changes
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    color: "#666",
  },
  section: {
    backgroundColor: "#fff",
    marginTop: 16,
    padding: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#e0e0e0",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  settingDescription: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  permissionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  permissionInfo: {
    flex: 1,
  },
  permissionLabel: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  permissionStatus: {
    fontSize: 13,
    marginTop: 4,
    fontWeight: "600",
  },
  settingsButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#007AFF",
    borderRadius: 8,
  },
  settingsButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  timeOptionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    gap: 8,
  },
  timeOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
    alignItems: "center",
  },
  timeOptionActive: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  timeOptionText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  timeOptionTextActive: {
    color: "#fff",
  },
  actionButton: {
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 8,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  actionDescription: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
    textAlign: "center",
  },
  infoSection: {
    backgroundColor: "#E3F2FD",
    margin: 16,
    padding: 16,
    borderRadius: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1976D2",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#1565C0",
    lineHeight: 20,
  },
});
