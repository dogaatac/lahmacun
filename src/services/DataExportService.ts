import StorageService from "./StorageService";
import UserService from "./UserService";
import GamificationService from "./GamificationService";
import SettingsService from "./SettingsService";
import SubscriptionService from "./SubscriptionService";
import { Share, Platform } from "react-native";

export interface ExportData {
  version: string;
  exportDate: number;
  profile: any;
  settings: any;
  progress: any;
  achievements: any;
  subscription: any;
}

export class DataExportService {
  async exportDataAsJSON(): Promise<string> {
    const profile = await UserService.getProfile();
    const settings = await SettingsService.getSettings();
    const progress = await GamificationService.getUserProgress();
    const achievements = await GamificationService.getAchievements();
    const subscription = await SubscriptionService.getSubscription();

    const exportData: ExportData = {
      version: "1.0.0",
      exportDate: Date.now(),
      profile,
      settings,
      progress,
      achievements,
      subscription,
    };

    return JSON.stringify(exportData, null, 2);
  }

  async exportDataAsPDF(): Promise<string> {
    const profile = await UserService.getProfile();
    const settings = await SettingsService.getSettings();
    const progress = await GamificationService.getUserProgress();
    const achievements = await GamificationService.getUnlockedAchievements();
    const subscription = await SubscriptionService.getSubscription();

    let pdfContent = `
=== USER PROFILE REPORT ===
Generated: ${new Date().toLocaleString()}

--- Profile Information ---
Name: ${profile?.name || "Not set"}
Email: ${profile?.email || "Not set"}
Goals: ${profile?.goals.join(", ") || "None"}
Subjects: ${profile?.subjects.join(", ") || "None"}

--- Learning Progress ---
Level: ${progress.level}
XP: ${progress.xp} / ${progress.xpToNextLevel}
Current Streak: ${progress.streak} days
Problems Solved: ${progress.totalProblemsolved}
Quizzes Completed: ${progress.totalQuizzesCompleted}

--- Achievements ---
${achievements.map((a) => `${a.icon} ${a.name}: ${a.description}`).join("\n")}

--- Subscription ---
Tier: ${subscription.tier}
Status: ${subscription.status}
Auto-Renew: ${subscription.autoRenew ? "Yes" : "No"}

--- Settings ---
Theme: ${settings.theme}
Language: ${settings.language}
Notifications: ${settings.notificationsEnabled ? "Enabled" : "Disabled"}
Privacy Mode: ${settings.privacyMode ? "Enabled" : "Disabled"}
Analytics: ${settings.analyticsConsent ? "Enabled" : "Disabled"}
Teacher Mode: ${settings.teacherMode ? "Enabled" : "Disabled"}

=== END OF REPORT ===
    `;

    return pdfContent.trim();
  }

  async shareData(format: "json" | "pdf" = "json"): Promise<void> {
    try {
      const data =
        format === "json"
          ? await this.exportDataAsJSON()
          : await this.exportDataAsPDF();

      const fileName = `profile_export_${Date.now()}.${format === "json" ? "json" : "txt"}`;

      if (Platform.OS === "web") {
        // Web implementation - download file
        const blob = new Blob([data], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        // Mobile implementation - use Share API
        await Share.share({
          message: data,
          title: `Profile Export - ${format.toUpperCase()}`,
        });
      }
    } catch (error) {
      throw new Error(`Failed to share data: ${(error as Error).message}`);
    }
  }

  async resetAllData(): Promise<void> {
    try {
      await StorageService.clear();
      await GamificationService.resetProgress();
      await SettingsService.resetSettings();
    } catch (error) {
      throw new Error(
        `Failed to reset all data: ${(error as Error).message}`
      );
    }
  }

  async backupData(): Promise<void> {
    const settings = await SettingsService.getSettings();
    if (!settings.autoBackup) {
      return;
    }

    try {
      const data = await this.exportDataAsJSON();
      const backupKey = `backup_${Date.now()}`;
      await StorageService.set(backupKey, data);

      // Keep only last 5 backups
      await this.cleanupOldBackups();
    } catch (error) {
      console.error("Backup failed:", error);
    }
  }

  async getBackups(): Promise<string[]> {
    const allKeys = await StorageService.getAllKeys();
    return allKeys.filter((key) => key.startsWith("backup_")).sort().reverse();
  }

  async restoreFromBackup(backupKey: string): Promise<void> {
    try {
      const backupData = await StorageService.get<string>(backupKey);
      if (!backupData) {
        throw new Error("Backup not found");
      }

      const data: ExportData = JSON.parse(
        typeof backupData === "string" ? backupData : JSON.stringify(backupData)
      );

      // Restore data
      if (data.profile) {
        await StorageService.set("user_profile", data.profile);
      }
      if (data.settings) {
        await StorageService.set("user_settings", data.settings);
      }
      if (data.progress) {
        await StorageService.set("user_progress", data.progress);
      }
      if (data.achievements) {
        await StorageService.set("user_achievements", data.achievements);
      }
      if (data.subscription) {
        await StorageService.set("user_subscription", data.subscription);
      }
    } catch (error) {
      throw new Error(`Failed to restore backup: ${(error as Error).message}`);
    }
  }

  private async cleanupOldBackups(): Promise<void> {
    const backups = await this.getBackups();
    if (backups.length > 5) {
      const toDelete = backups.slice(5);
      for (const backup of toDelete) {
        await StorageService.remove(backup);
      }
    }
  }
}

export default new DataExportService();
