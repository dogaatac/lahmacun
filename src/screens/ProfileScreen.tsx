import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Clipboard,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import UserService from "../services/UserService";
import GamificationService from "../services/GamificationService";
import SubscriptionService from "../services/SubscriptionService";
import AnalyticsService from "../services/AnalyticsService";
import { UserProfile, MasterySnapshot, UserSubscription, APIKey } from "../types";

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [mastery, setMastery] = useState<MasterySnapshot | null>(null);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [apiKey, setApiKey] = useState<APIKey | null>(null);
  const [editingGoals, setEditingGoals] = useState(false);
  const [editingSubjects, setEditingSubjects] = useState(false);
  const [goalsInput, setGoalsInput] = useState("");
  const [subjectsInput, setSubjectsInput] = useState("");

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      const [profileData, progress, subData, keyData] = await Promise.all([
        UserService.getProfile(),
        GamificationService.getUserProgress(),
        SubscriptionService.getSubscription(),
        UserService.getAPIKey(),
      ]);

      if (!profileData) {
        // Create default profile if none exists
        const defaultProfile = await UserService.createProfile(
          "User",
          "user@example.com",
          [],
          []
        );
        setProfile(defaultProfile);
      } else {
        setProfile(profileData);
      }

      // Build mastery snapshot
      const masteryData: MasterySnapshot = {
        totalProblems: progress.totalProblemsolved,
        totalQuizzes: progress.totalQuizzesCompleted,
        averageAccuracy: 85, // Mock data
        streak: progress.streak,
        level: progress.level,
        xp: progress.xp,
        subjects: {}, // Could be populated from historical data
      };

      setMastery(masteryData);
      setSubscription(subData);
      setApiKey(keyData);

      AnalyticsService.trackScreen("Profile");
    } catch (error) {
      Alert.alert("Error", "Failed to load profile data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGoals = async () => {
    if (!profile) return;

    try {
      const goals = goalsInput.split(",").map((g) => g.trim()).filter(Boolean);
      const updated = await UserService.updateGoals(goals);
      setProfile(updated);
      setEditingGoals(false);
      AnalyticsService.track("profile_goals_updated");
    } catch (error) {
      Alert.alert("Error", "Failed to update goals");
    }
  };

  const handleSaveSubjects = async () => {
    if (!profile) return;

    try {
      const subjects = subjectsInput.split(",").map((s) => s.trim()).filter(Boolean);
      const updated = await UserService.updateSubjects(subjects);
      setProfile(updated);
      setEditingSubjects(false);
      AnalyticsService.track("profile_subjects_updated");
    } catch (error) {
      Alert.alert("Error", "Failed to update subjects");
    }
  };

  const handleGenerateAPIKey = async () => {
    try {
      const newKey = await UserService.generateAPIKey();
      setApiKey(newKey);
      Alert.alert("Success", "New API key generated");
      AnalyticsService.track("api_key_generated");
    } catch (error) {
      Alert.alert("Error", "Failed to generate API key");
    }
  };

  const handleRotateAPIKey = async () => {
    Alert.alert(
      "Rotate API Key",
      "This will invalidate your current API key. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Rotate",
          style: "destructive",
          onPress: async () => {
            try {
              const newKey = await UserService.rotateAPIKey();
              setApiKey(newKey);
              Alert.alert("Success", "API key rotated successfully");
              AnalyticsService.track("api_key_rotated");
            } catch (error) {
              Alert.alert("Error", "Failed to rotate API key");
            }
          },
        },
      ]
    );
  };

  const handleCopyAPIKey = () => {
    if (apiKey) {
      Clipboard.setString(apiKey.key);
      Alert.alert("Copied", "API key copied to clipboard");
    }
  };

  const handleManageSubscription = () => {
    if (subscription?.tier === "free") {
      navigation.navigate("Paywall" as never);
    } else {
      Alert.alert(
        "Manage Subscription",
        "To manage your subscription, go to Settings > Apple ID > Subscriptions on your device.",
        [{ text: "OK" }]
      );
    }
    AnalyticsService.track("subscription_manage_clicked");
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} testID="profile-screen">
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {profile?.name?.charAt(0).toUpperCase() || "U"}
          </Text>
        </View>
        <Text style={styles.name}>{profile?.name || "User"}</Text>
        <Text style={styles.email}>{profile?.email || ""}</Text>
      </View>

      {/* Mastery Snapshot */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mastery Snapshot</Text>
        <View style={styles.masteryGrid}>
          <View style={styles.masteryItem}>
            <Text style={styles.masteryValue}>{mastery?.level || 0}</Text>
            <Text style={styles.masteryLabel}>Level</Text>
          </View>
          <View style={styles.masteryItem}>
            <Text style={styles.masteryValue}>{mastery?.totalProblems || 0}</Text>
            <Text style={styles.masteryLabel}>Problems</Text>
          </View>
          <View style={styles.masteryItem}>
            <Text style={styles.masteryValue}>{mastery?.totalQuizzes || 0}</Text>
            <Text style={styles.masteryLabel}>Quizzes</Text>
          </View>
          <View style={styles.masteryItem}>
            <Text style={styles.masteryValue}>{mastery?.streak || 0}🔥</Text>
            <Text style={styles.masteryLabel}>Streak</Text>
          </View>
        </View>
      </View>

      {/* Subscription */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Subscription</Text>
        <View style={styles.subscriptionCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.subscriptionTier}>
              {subscription?.tier.toUpperCase() || "FREE"}
            </Text>
            <Text style={styles.subscriptionStatus}>
              Status: {subscription?.status || "active"}
            </Text>
            {subscription?.isInGracePeriod && (
              <Text style={styles.gracePeriodText}>
                ⚠️ Grace period - payment issue
              </Text>
            )}
            {subscription?.endDate && (
              <Text style={styles.subscriptionEndDate}>
                {subscription.status === "active" 
                  ? `Renews: ${new Date(subscription.endDate).toLocaleDateString()}`
                  : `Expired: ${new Date(subscription.endDate).toLocaleDateString()}`
                }
              </Text>
            )}
          </View>
          <TouchableOpacity
            style={styles.manageButton}
            onPress={handleManageSubscription}
            testID="manage-subscription-button"
          >
            <Text style={styles.manageButtonText}>
              {subscription?.tier === "free" ? "Upgrade" : "Manage"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Goals */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Goals</Text>
          <TouchableOpacity
            onPress={() => {
              setEditingGoals(!editingGoals);
              setGoalsInput(profile?.goals.join(", ") || "");
            }}
            testID="edit-goals-button"
          >
            <Text style={styles.editButton}>
              {editingGoals ? "Cancel" : "Edit"}
            </Text>
          </TouchableOpacity>
        </View>
        {editingGoals ? (
          <View>
            <TextInput
              style={styles.input}
              value={goalsInput}
              onChangeText={setGoalsInput}
              placeholder="Enter goals (comma-separated)"
              testID="goals-input"
            />
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveGoals}
              testID="save-goals-button"
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={styles.listText}>
            {profile?.goals.join(", ") || "No goals set"}
          </Text>
        )}
      </View>

      {/* Subjects */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Subjects</Text>
          <TouchableOpacity
            onPress={() => {
              setEditingSubjects(!editingSubjects);
              setSubjectsInput(profile?.subjects.join(", ") || "");
            }}
            testID="edit-subjects-button"
          >
            <Text style={styles.editButton}>
              {editingSubjects ? "Cancel" : "Edit"}
            </Text>
          </TouchableOpacity>
        </View>
        {editingSubjects ? (
          <View>
            <TextInput
              style={styles.input}
              value={subjectsInput}
              onChangeText={setSubjectsInput}
              placeholder="Enter subjects (comma-separated)"
              testID="subjects-input"
            />
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveSubjects}
              testID="save-subjects-button"
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={styles.listText}>
            {profile?.subjects.join(", ") || "No subjects set"}
          </Text>
        )}
      </View>

      {/* API Key Management */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>API Key</Text>
        {apiKey ? (
          <View>
            <View style={styles.apiKeyContainer}>
              <Text style={styles.apiKey} numberOfLines={1}>
                {apiKey.key}
              </Text>
              <TouchableOpacity
                onPress={handleCopyAPIKey}
                testID="copy-api-key-button"
              >
                <Text style={styles.copyButton}>Copy</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.rotateButton}
              onPress={handleRotateAPIKey}
              testID="rotate-api-key-button"
            >
              <Text style={styles.rotateButtonText}>Rotate Key</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.generateButton}
            onPress={handleGenerateAPIKey}
            testID="generate-api-key-button"
          >
            <Text style={styles.generateButtonText}>Generate API Key</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Settings Navigation */}
      <TouchableOpacity
        style={styles.settingsButton}
        onPress={() => navigation.navigate("Settings" as never)}
        testID="navigate-settings-button"
      >
        <Text style={styles.settingsButtonText}>⚙️ Settings</Text>
      </TouchableOpacity>
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
  header: {
    backgroundColor: "#fff",
    alignItems: "center",
    paddingVertical: 32,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 36,
    color: "#fff",
    fontWeight: "bold",
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  email: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
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
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  editButton: {
    color: "#007AFF",
    fontSize: 16,
  },
  masteryGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  masteryItem: {
    alignItems: "center",
  },
  masteryValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#007AFF",
  },
  masteryLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  subscriptionCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
  },
  subscriptionTier: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#007AFF",
  },
  subscriptionStatus: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  subscriptionEndDate: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
  },
  gracePeriodText: {
    fontSize: 12,
    color: "#FF9800",
    marginTop: 4,
    fontWeight: "600",
  },
  manageButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  manageButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  saveButton: {
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  listText: {
    fontSize: 16,
    color: "#333",
  },
  apiKeyContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    marginBottom: 8,
  },
  apiKey: {
    flex: 1,
    fontFamily: "monospace",
    fontSize: 12,
    color: "#333",
  },
  copyButton: {
    color: "#007AFF",
    fontWeight: "600",
    marginLeft: 8,
  },
  rotateButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#007AFF",
    alignItems: "center",
  },
  rotateButtonText: {
    color: "#007AFF",
    fontWeight: "600",
  },
  generateButton: {
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  generateButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  settingsButton: {
    backgroundColor: "#fff",
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  settingsButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
});
