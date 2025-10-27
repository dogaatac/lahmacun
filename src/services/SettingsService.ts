import StorageService from "./StorageService";
import AnalyticsService from "./AnalyticsService";
import { UserSettings } from "../types";

export class SettingsService {
  private readonly STORAGE_KEY_SETTINGS = "user_settings";

  async getSettings(): Promise<UserSettings> {
    const settings = await StorageService.get<UserSettings>(
      this.STORAGE_KEY_SETTINGS
    );

    if (!settings) {
      return this.createDefaultSettings();
    }

    return settings;
  }

  async updateSettings(
    updates: Partial<UserSettings>
  ): Promise<UserSettings> {
    const currentSettings = await this.getSettings();
    const updatedSettings: UserSettings = {
      ...currentSettings,
      ...updates,
    };

    await StorageService.set(this.STORAGE_KEY_SETTINGS, updatedSettings);

    // Apply analytics consent immediately
    if (updates.analyticsConsent !== undefined) {
      if (updates.analyticsConsent) {
        AnalyticsService.enable();
      } else {
        AnalyticsService.disable();
      }
    }

    return updatedSettings;
  }

  async toggleNotifications(enabled: boolean): Promise<void> {
    await this.updateSettings({ notificationsEnabled: enabled });
  }

  async togglePushNotifications(enabled: boolean): Promise<void> {
    await this.updateSettings({ pushNotifications: enabled });
  }

  async toggleEmailNotifications(enabled: boolean): Promise<void> {
    await this.updateSettings({ emailNotifications: enabled });
  }

  async togglePrivacyMode(enabled: boolean): Promise<void> {
    await this.updateSettings({ privacyMode: enabled });
  }

  async toggleAnalyticsConsent(enabled: boolean): Promise<void> {
    await this.updateSettings({ analyticsConsent: enabled });
  }

  async toggleTeacherMode(enabled: boolean): Promise<void> {
    await this.updateSettings({ teacherMode: enabled });
  }

  async toggleAutoBackup(enabled: boolean): Promise<void> {
    await this.updateSettings({ autoBackup: enabled });
  }

  async setTheme(theme: "light" | "dark" | "auto"): Promise<void> {
    await this.updateSettings({ theme });
  }

  async setLanguage(language: string): Promise<void> {
    await this.updateSettings({ language });
  }

  async resetSettings(): Promise<void> {
    const defaultSettings = this.createDefaultSettings();
    await StorageService.set(this.STORAGE_KEY_SETTINGS, defaultSettings);
  }

  private createDefaultSettings(): UserSettings {
    return {
      theme: "auto",
      language: "en",
      notificationsEnabled: true,
      pushNotifications: true,
      emailNotifications: false,
      privacyMode: false,
      analyticsConsent: true,
      teacherMode: false,
      autoBackup: true,
    };
  }
}

export default new SettingsService();
