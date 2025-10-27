import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import TeacherModeService from "../services/TeacherModeService";
import SessionService from "../services/SessionService";
import StudyPlanService from "../services/StudyPlanService";
import AnalyticsService from "../services/AnalyticsService";
import { StudentSession, TeacherProfile } from "../types";

export const TeacherDashboardScreen: React.FC = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile | null>(null);
  const [sessions, setSessions] = useState<StudentSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<StudentSession | null>(null);
  const [showExitModal, setShowExitModal] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const profile = await TeacherModeService.getTeacherProfile();
      const allSessions = await SessionService.getAllSessions();

      setTeacherProfile(profile);
      setSessions(allSessions.sort((a, b) => b.createdAt - a.createdAt));

      AnalyticsService.trackScreen("TeacherDashboard");
    } catch (error) {
      Alert.alert("Error", "Failed to load dashboard data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSessionPress = (session: StudentSession) => {
    navigation.navigate("SessionDetail" as never, { sessionId: session.id } as never);
  };

  const handleExitTeacherMode = async () => {
    try {
      await TeacherModeService.disableTeacherMode();
      AnalyticsService.track("teacher_mode_exited");
      Alert.alert("Success", "Exited Teacher Mode", [
        {
          text: "OK",
          onPress: () => navigation.navigate("Home" as never),
        },
      ]);
    } catch (error) {
      Alert.alert("Error", "Failed to exit Teacher Mode");
    }
  };

  const getSessionStats = () => {
    const total = sessions.length;
    const completed = sessions.filter((s) => s.completed).length;
    const flagged = sessions.filter((s) => s.flaggedDifficulties.length > 0).length;
    const averageAccuracy =
      sessions.filter((s) => s.accuracy).reduce((sum, s) => sum + (s.accuracy || 0), 0) /
      sessions.filter((s) => s.accuracy).length || 0;

    return { total, completed, flagged, averageAccuracy };
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  const stats = getSessionStats();

  return (
    <View style={styles.container} testID="teacher-dashboard-screen">
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Teacher Dashboard</Text>
            <Text style={styles.headerSubtitle}>
              {teacherProfile?.name || "Teacher"}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.exitButton}
            onPress={() => setShowExitModal(true)}
            testID="exit-teacher-mode-button"
          >
            <Text style={styles.exitButtonText}>Exit Mode</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total Sessions</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.completed}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.flagged}</Text>
            <Text style={styles.statLabel}>Flagged</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {stats.averageAccuracy.toFixed(0)}%
            </Text>
            <Text style={styles.statLabel}>Avg Accuracy</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Sessions</Text>
          {sessions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No sessions yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Sessions will appear here when students solve problems
              </Text>
            </View>
          ) : (
            sessions.map((session) => (
              <TouchableOpacity
                key={session.id}
                style={styles.sessionCard}
                onPress={() => handleSessionPress(session)}
                testID={`session-card-${session.id}`}
              >
                <View style={styles.sessionHeader}>
                  <Text style={styles.sessionTitle}>{session.problemTitle}</Text>
                  {session.flaggedDifficulties.length > 0 && (
                    <View style={styles.flagBadge}>
                      <Text style={styles.flagBadgeText}>🚩</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.sessionStudent}>{session.studentName}</Text>
                {session.subject && (
                  <Text style={styles.sessionSubject}>{session.subject}</Text>
                )}
                <View style={styles.sessionFooter}>
                  <Text style={styles.sessionDate}>
                    {new Date(session.startTime).toLocaleDateString()}
                  </Text>
                  {session.completed ? (
                    <View style={styles.completedBadge}>
                      <Text style={styles.completedBadgeText}>✓ Completed</Text>
                    </View>
                  ) : (
                    <View style={styles.inProgressBadge}>
                      <Text style={styles.inProgressBadgeText}>In Progress</Text>
                    </View>
                  )}
                </View>
                {session.flaggedDifficulties.length > 0 && (
                  <View style={styles.difficultiesContainer}>
                    {session.flaggedDifficulties.map((difficulty, index) => (
                      <View key={index} style={styles.difficultyTag}>
                        <Text style={styles.difficultyTagText}>{difficulty}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      <Modal
        visible={showExitModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowExitModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Exit Teacher Mode?</Text>
            <Text style={styles.modalText}>
              You will be returned to student mode. You can re-enter teacher mode anytime.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowExitModal(false)}
                testID="cancel-exit-button"
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleExitTeacherMode}
                testID="confirm-exit-button"
              >
                <Text style={styles.modalConfirmButtonText}>Exit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
    backgroundColor: "#007AFF",
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.9,
    marginTop: 4,
  },
  exitButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  exitButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  statValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#007AFF",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  emptyState: {
    backgroundColor: "#fff",
    padding: 32,
    borderRadius: 12,
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#666",
    marginTop: 8,
    textAlign: "center",
  },
  sessionCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  sessionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  sessionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  flagBadge: {
    marginLeft: 8,
  },
  flagBadgeText: {
    fontSize: 20,
  },
  sessionStudent: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  sessionSubject: {
    fontSize: 12,
    color: "#999",
    marginBottom: 8,
  },
  sessionFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sessionDate: {
    fontSize: 12,
    color: "#999",
  },
  completedBadge: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  completedBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  inProgressBadge: {
    backgroundColor: "#FF9800",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  inProgressBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  difficultiesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
    gap: 8,
  },
  difficultyTag: {
    backgroundColor: "#FFE5E5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  difficultyTagText: {
    color: "#D32F2F",
    fontSize: 11,
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "80%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  modalText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
  },
  modalCancelButtonText: {
    color: "#666",
    fontWeight: "600",
  },
  modalConfirmButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#007AFF",
    alignItems: "center",
  },
  modalConfirmButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
});
