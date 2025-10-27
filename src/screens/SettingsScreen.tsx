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
  Linking,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import SettingsService from "../services/SettingsService";
import DataExportService from "../services/DataExportService";
import GamificationService from "../services/GamificationService";
import StorageService from "../services/StorageService";
import AnalyticsService from "../services/AnalyticsService";
import { UserSettings } from "../types";

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<UserSettings | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const settingsData = await SettingsService.getSettings();
      setSettings(settingsData);
      AnalyticsService.trackScreen("Settings");
    } catch (error) {
      Alert.alert("Error", "Failed to load settings");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (
    key: keyof UserSettings,
    value: any
  ): Promise<void> => {
    if (!settings) return;

    try {
      const updated = await SettingsService.updateSettings({ [key]: value });
      setSettings(updated);
      AnalyticsService.track("setting_changed", { setting: key, value });
    } catch (error) {
      Alert.alert("Error", "Failed to update setting");
    }
  };

  const handleThemeChange = (theme: "light" | "dark" | "auto") => {
    updateSetting("theme", theme);
  };

  const handleLanguageChange = (language: string) => {
    updateSetting("language", language);
  };

  const handleExportJSON = async () => {
    try {
      await DataExportService.shareData("json");
      AnalyticsService.track("data_exported", { format: "json" });
      Alert.alert("Success", "Data exported successfully");
    } catch (error) {
      Alert.alert("Error", "Failed to export data");
    }
  };

  const handleExportPDF = async () => {
    try {
      await DataExportService.shareData("pdf");
      AnalyticsService.track("data_exported", { format: "pdf" });
      Alert.alert("Success", "Data exported successfully");
    } catch (error) {
      Alert.alert("Error", "Failed to export data");
    }
  };

  const handleResetData = () => {
    Alert.alert(
      "Reset All Data",
      "This will permanently delete all your data. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            try {
              await DataExportService.resetAllData();
              AnalyticsService.track("data_reset");
              Alert.alert("Success", "All data has been reset", [
                {
                  text: "OK",
                  onPress: () => navigation.navigate("Onboarding" as never),
                },
              ]);
            } catch (error) {
              Alert.alert("Error", "Failed to reset data");
            }
          },
        },
      ]
    );
  };

  const handleRegenerateOnboarding = () => {
    Alert.alert(
      "Regenerate Onboarding",
      "This will take you back to the onboarding tutorial.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Continue",
          onPress: () => {
            AnalyticsService.track("onboarding_regenerated");
            navigation.navigate("Onboarding" as never);
          },
        },
      ]
    );
  };

  const handleContactSupport = () => {
    Alert.alert(
      "Contact Support",
      "How would you like to contact us?",
      [
        {
          text: "Email",
          onPress: () => {
            Linking.openURL("mailto:support@example.com");
            AnalyticsService.track("support_contact", { method: "email" });
          },
        },
        {
          text: "Chat",
          onPress: () => {
            Alert.alert("Chat Support", "Chat support coming soon!");
            AnalyticsService.track("support_contact", { method: "chat" });
          },
        },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  const handleBackup = async () => {
    try {
      await DataExportService.backupData();
      Alert.alert("Success", "Data backed up successfully");
      AnalyticsService.track("data_backed_up");
    } catch (error) {
      Alert.alert("Error", "Failed to backup data");
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!settings) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load settings</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} testID="settings-screen">
      {/* Preferences Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Theme</Text>
            <Text style={styles.settingDescription}>
              Current: {settings.theme}
            </Text>
          </View>
          <View style={styles.themeButtons}>
            <TouchableOpacity
              style={[
                styles.themeButton,
                settings.theme === "light" && styles.themeButtonActive,
              ]}
              onPress={() => handleThemeChange("light")}
              testID="theme-light-button"
            >
              <Text
                style={[
                  styles.themeButtonText,
                  settings.theme === "light" && styles.themeButtonTextActive,
                ]}
              >
                ☀️
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.themeButton,
                settings.theme === "dark" && styles.themeButtonActive,
              ]}
              onPress={() => handleThemeChange("dark")}
              testID="theme-dark-button"
            >
              <Text
                style={[
                  styles.themeButtonText,
                  settings.theme === "dark" && styles.themeButtonTextActive,
                ]}
              >
                🌙
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.themeButton,
                settings.theme === "auto" && styles.themeButtonActive,
              ]}
              onPress={() => handleThemeChange("auto")}
              testID="theme-auto-button"
            >
              <Text
                style={[
                  styles.themeButtonText,
                  settings.theme === "auto" && styles.themeButtonTextActive,
                ]}
              >
                ⚙️
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Language</Text>
            <Text style={styles.settingDescription}>
              {settings.language.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Notifications</Text>
            <Text style={styles.settingDescription}>
              Receive app notifications
            </Text>
          </View>
          <Switch
            value={settings.notificationsEnabled}
            onValueChange={(value) => updateSetting("notificationsEnabled", value)}
            testID="notifications-toggle"
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Push Notifications</Text>
            <Text style={styles.settingDescription}>
              Receive push notifications
            </Text>
          </View>
          <Switch
            value={settings.pushNotifications}
            onValueChange={(value) => updateSetting("pushNotifications", value)}
            disabled={!settings.notificationsEnabled}
            testID="push-notifications-toggle"
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Email Notifications</Text>
            <Text style={styles.settingDescription}>
              Receive email updates
            </Text>
          </View>
          <Switch
            value={settings.emailNotifications}
            onValueChange={(value) => updateSetting("emailNotifications", value)}
            testID="email-notifications-toggle"
          />
        </View>
      </View>

      {/* Privacy Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Privacy</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Privacy Mode</Text>
            <Text style={styles.settingDescription}>
              Hide sensitive information
            </Text>
          </View>
          <Switch
            value={settings.privacyMode}
            onValueChange={(value) => updateSetting("privacyMode", value)}
            testID="privacy-mode-toggle"
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Analytics Consent</Text>
            <Text style={styles.settingDescription}>
              Help improve the app
            </Text>
          </View>
          <Switch
            value={settings.analyticsConsent}
            onValueChange={(value) => updateSetting("analyticsConsent", value)}
            testID="analytics-consent-toggle"
          />
        </View>
      </View>

      {/* Features Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Features</Text>

        <TouchableOpacity
          style={styles.settingRow}
          onPress={() => navigation.navigate("RemindersSettings" as never)}
          testID="reminders-settings-button"
        >
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Study Reminders</Text>
            <Text style={styles.settingDescription}>
              Configure notifications and calendar sync
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Teacher Mode</Text>
            <Text style={styles.settingDescription}>
              Enable classroom features
            </Text>
          </View>
          <Switch
            value={settings.teacherMode}
            onValueChange={(value) => updateSetting("teacherMode", value)}
            testID="teacher-mode-toggle"
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Auto Backup</Text>
            <Text style={styles.settingDescription}>
              Automatically backup your data
            </Text>
          </View>
          <Switch
            value={settings.autoBackup}
            onValueChange={(value) => updateSetting("autoBackup", value)}
            testID="auto-backup-toggle"
          />
        </View>
      </View>

      {/* Data Management Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Management</Text>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleExportJSON}
          testID="export-json-button"
        >
          <Text style={styles.actionButtonText}>📄 Export as JSON</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleExportPDF}
          testID="export-pdf-button"
        >
          <Text style={styles.actionButtonText}>📋 Export as PDF</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleBackup}
          testID="backup-button"
        >
          <Text style={styles.actionButtonText}>💾 Backup Data</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.dangerButton]}
          onPress={handleResetData}
          testID="reset-data-button"
        >
          <Text style={[styles.actionButtonText, styles.dangerButtonText]}>
            🗑️ Reset All Data
          </Text>
        </TouchableOpacity>
      </View>

      {/* Support Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleRegenerateOnboarding}
          testID="regenerate-onboarding-button"
        >
          <Text style={styles.actionButtonText}>🔄 Regenerate Onboarding</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleContactSupport}
          testID="contact-support-button"
        >
          <Text style={styles.actionButtonText}>💬 Contact Support</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Version 1.0.0</Text>
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
  chevron: {
    fontSize: 24,
    color: "#999",
    fontWeight: "300",
  },
  themeButtons: {
    flexDirection: "row",
    gap: 8,
  },
  themeButton: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
  },
  themeButtonActive: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  themeButtonText: {
    fontSize: 20,
  },
  themeButtonTextActive: {
    opacity: 1,
  },
  actionButton: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  actionButtonText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  dangerButton: {
    backgroundColor: "#fff",
    borderColor: "#ff3b30",
  },
  dangerButtonText: {
    color: "#ff3b30",
  },
  footer: {
    padding: 24,
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    color: "#999",
  },
});
