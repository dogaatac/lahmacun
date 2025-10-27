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
import { useRoute } from "@react-navigation/native";
import SessionService from "../services/SessionService";
import StudyPlanService from "../services/StudyPlanService";
import TeacherModeService from "../services/TeacherModeService";
import DataExportService from "../services/DataExportService";
import AnalyticsService from "../services/AnalyticsService";
import {
  StudentSession,
  SessionAnnotation,
  TeacherFeedback,
} from "../types";

export const SessionDetailScreen: React.FC = () => {
  const route = useRoute();
  const { sessionId } = route.params as { sessionId: string };

  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<StudentSession | null>(null);
  const [annotations, setAnnotations] = useState<SessionAnnotation[]>([]);
  const [feedback, setFeedback] = useState<TeacherFeedback[]>([]);

  const [showAnnotationModal, setShowAnnotationModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);

  const [annotationType, setAnnotationType] = useState<"text" | "note" | "correction">("note");
  const [annotationContent, setAnnotationContent] = useState("");
  const [feedbackType, setFeedbackType] = useState<"text" | "audio" | "video">("text");
  const [feedbackContent, setFeedbackContent] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");

  useEffect(() => {
    loadSessionData();
  }, [sessionId]);

  const loadSessionData = async () => {
    try {
      setLoading(true);
      const sessionData = await SessionService.getSessionById(sessionId);
      const annotationsData = await SessionService.getAnnotationsForSession(sessionId);
      const feedbackData = await SessionService.getFeedbackForSession(sessionId);

      setSession(sessionData);
      setAnnotations(annotationsData);
      setFeedback(feedbackData);

      AnalyticsService.trackScreen("SessionDetail");
    } catch (error) {
      Alert.alert("Error", "Failed to load session data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAnnotation = async () => {
    if (!annotationContent.trim() || !session) {
      Alert.alert("Error", "Please enter annotation content");
      return;
    }

    try {
      const teacherProfile = await TeacherModeService.getTeacherProfile();
      if (!teacherProfile) {
        Alert.alert("Error", "Teacher profile not found");
        return;
      }

      const annotation = await SessionService.addAnnotation(
        sessionId,
        teacherProfile.id,
        annotationType,
        annotationContent.trim(),
        undefined,
        false
      );

      setAnnotations([...annotations, annotation]);
      setAnnotationContent("");
      setShowAnnotationModal(false);
      AnalyticsService.track("annotation_added", { type: annotationType });
    } catch (error) {
      Alert.alert("Error", "Failed to add annotation");
    }
  };

  const handleShareAnnotation = async (annotationId: string) => {
    try {
      const updated = await SessionService.shareAnnotation(annotationId);
      setAnnotations(
        annotations.map((a) => (a.id === annotationId ? updated : a))
      );
      Alert.alert("Success", "Annotation shared with student");
      AnalyticsService.track("annotation_shared");
    } catch (error) {
      Alert.alert("Error", "Failed to share annotation");
    }
  };

  const handleAddFeedback = async () => {
    if (!feedbackContent.trim() && feedbackType === "text") {
      Alert.alert("Error", "Please enter feedback content");
      return;
    }

    try {
      const teacherProfile = await TeacherModeService.getTeacherProfile();
      if (!teacherProfile) {
        Alert.alert("Error", "Teacher profile not found");
        return;
      }

      const newFeedback = await SessionService.addFeedback(
        sessionId,
        teacherProfile.id,
        feedbackType,
        feedbackType === "text" ? feedbackContent.trim() : undefined,
        feedbackType !== "text" ? `mock_${feedbackType}_path.mp4` : undefined,
        feedbackType !== "text" ? 60 : undefined,
        false
      );

      setFeedback([...feedback, newFeedback]);
      setFeedbackContent("");
      setShowFeedbackModal(false);
      AnalyticsService.track("feedback_added", { type: feedbackType });
    } catch (error) {
      Alert.alert("Error", "Failed to add feedback");
    }
  };

  const handleShareFeedback = async (feedbackId: string) => {
    try {
      const updated = await SessionService.shareFeedback(feedbackId);
      setFeedback(feedback.map((f) => (f.id === feedbackId ? updated : f)));
      Alert.alert("Success", "Feedback shared with student");
      AnalyticsService.track("feedback_shared");
    } catch (error) {
      Alert.alert("Error", "Failed to share feedback");
    }
  };

  const handleAssignTask = async () => {
    if (!taskTitle.trim() || !taskDescription.trim() || !session) {
      Alert.alert("Error", "Please enter task title and description");
      return;
    }

    try {
      const teacherProfile = await TeacherModeService.getTeacherProfile();
      if (!teacherProfile) {
        Alert.alert("Error", "Teacher profile not found");
        return;
      }

      await StudyPlanService.addTaskToPlan(
        session.studentId,
        sessionId,
        taskTitle.trim(),
        taskDescription.trim(),
        teacherProfile.id,
        session.subject,
        session.difficulty
      );

      setTaskTitle("");
      setTaskDescription("");
      setShowTaskModal(false);
      Alert.alert("Success", "Task added to student's study plan");
      AnalyticsService.track("task_assigned");
    } catch (error) {
      Alert.alert("Error", "Failed to assign task");
    }
  };

  const handleExportReport = async () => {
    if (!session) return;

    try {
      const report = {
        session,
        annotations: annotations.filter((a) => a.sharedWithStudent),
        feedback: feedback.filter((f) => f.sharedWithStudent),
        exportedAt: Date.now(),
      };

      const exported = await DataExportService.exportData(
        "session_report",
        report
      );

      Alert.alert(
        "Export Successful",
        `Report exported to: ${exported.fileName}`,
        [{ text: "OK" }]
      );
      AnalyticsService.track("report_exported");
    } catch (error) {
      Alert.alert("Error", "Failed to export report");
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!session) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Session not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} testID="session-detail-screen">
      <View style={styles.sessionInfo}>
        <Text style={styles.title}>{session.problemTitle}</Text>
        <Text style={styles.student}>Student: {session.studentName}</Text>
        {session.subject && <Text style={styles.subject}>{session.subject}</Text>}
        <View style={styles.metaRow}>
          <Text style={styles.date}>
            {new Date(session.startTime).toLocaleDateString()}
          </Text>
          {session.difficulty && (
            <View style={styles.difficultyBadge}>
              <Text style={styles.difficultyText}>{session.difficulty}</Text>
            </View>
          )}
        </View>
        {session.flaggedDifficulties.length > 0 && (
          <View style={styles.flaggedSection}>
            <Text style={styles.flaggedTitle}>Flagged Difficulties:</Text>
            {session.flaggedDifficulties.map((difficulty, index) => (
              <Text key={index} style={styles.flaggedItem}>
                • {difficulty}
              </Text>
            ))}
          </View>
        )}
      </View>

      <View style={styles.actionsBar}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setShowAnnotationModal(true)}
          testID="add-annotation-button"
        >
          <Text style={styles.actionButtonText}>📝 Add Note</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setShowFeedbackModal(true)}
          testID="add-feedback-button"
        >
          <Text style={styles.actionButtonText}>💬 Add Feedback</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setShowTaskModal(true)}
          testID="assign-task-button"
        >
          <Text style={styles.actionButtonText}>✏️ Assign Task</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleExportReport}
          testID="export-report-button"
        >
          <Text style={styles.actionButtonText}>📤 Export</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Annotations ({annotations.length})</Text>
        {annotations.length === 0 ? (
          <Text style={styles.emptyText}>No annotations yet</Text>
        ) : (
          annotations.map((annotation) => (
            <View key={annotation.id} style={styles.annotationCard}>
              <View style={styles.annotationHeader}>
                <Text style={styles.annotationType}>{annotation.type}</Text>
                {annotation.sharedWithStudent ? (
                  <View style={styles.sharedBadge}>
                    <Text style={styles.sharedBadgeText}>Shared</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => handleShareAnnotation(annotation.id)}
                    testID={`share-annotation-${annotation.id}`}
                  >
                    <Text style={styles.shareButton}>Share</Text>
                  </TouchableOpacity>
                )}
              </View>
              <Text style={styles.annotationContent}>{annotation.content}</Text>
              <Text style={styles.timestamp}>
                {new Date(annotation.createdAt).toLocaleString()}
              </Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Feedback ({feedback.length})</Text>
        {feedback.length === 0 ? (
          <Text style={styles.emptyText}>No feedback yet</Text>
        ) : (
          feedback.map((item) => (
            <View key={item.id} style={styles.feedbackCard}>
              <View style={styles.feedbackHeader}>
                <Text style={styles.feedbackType}>{item.type.toUpperCase()}</Text>
                {item.sharedWithStudent ? (
                  <View style={styles.sharedBadge}>
                    <Text style={styles.sharedBadgeText}>Shared</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => handleShareFeedback(item.id)}
                    testID={`share-feedback-${item.id}`}
                  >
                    <Text style={styles.shareButton}>Share</Text>
                  </TouchableOpacity>
                )}
              </View>
              {item.content && (
                <Text style={styles.feedbackContent}>{item.content}</Text>
              )}
              {item.filePath && (
                <Text style={styles.filePath}>File: {item.filePath}</Text>
              )}
              {item.duration && (
                <Text style={styles.duration}>Duration: {item.duration}s</Text>
              )}
              <Text style={styles.timestamp}>
                {new Date(item.createdAt).toLocaleString()}
              </Text>
            </View>
          ))
        )}
      </View>

      <Modal
        visible={showAnnotationModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAnnotationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Annotation</Text>

            <View style={styles.typeSelector}>
              {(["note", "text", "correction"] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeButton,
                    annotationType === type && styles.typeButtonActive,
                  ]}
                  onPress={() => setAnnotationType(type)}
                  testID={`annotation-type-${type}`}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      annotationType === type && styles.typeButtonTextActive,
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.textInput}
              value={annotationContent}
              onChangeText={setAnnotationContent}
              placeholder="Enter annotation..."
              multiline
              numberOfLines={4}
              testID="annotation-input"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowAnnotationModal(false)}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleAddAnnotation}
                testID="confirm-annotation-button"
              >
                <Text style={styles.modalConfirmButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showFeedbackModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFeedbackModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Feedback</Text>

            <View style={styles.typeSelector}>
              {(["text", "audio", "video"] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeButton,
                    feedbackType === type && styles.typeButtonActive,
                  ]}
                  onPress={() => setFeedbackType(type)}
                  testID={`feedback-type-${type}`}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      feedbackType === type && styles.typeButtonTextActive,
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {feedbackType === "text" ? (
              <TextInput
                style={styles.textInput}
                value={feedbackContent}
                onChangeText={setFeedbackContent}
                placeholder="Enter feedback..."
                multiline
                numberOfLines={4}
                testID="feedback-input"
              />
            ) : (
              <View style={styles.recordingPlaceholder}>
                <Text style={styles.recordingText}>
                  {feedbackType === "audio" ? "🎤" : "🎥"}
                </Text>
                <Text style={styles.recordingLabel}>
                  {feedbackType === "audio" ? "Audio" : "Video"} Recording
                </Text>
                <Text style={styles.recordingNote}>
                  (Mock recording - feature simulated)
                </Text>
              </View>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowFeedbackModal(false)}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleAddFeedback}
                testID="confirm-feedback-button"
              >
                <Text style={styles.modalConfirmButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showTaskModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTaskModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Assign Follow-Up Task</Text>

            <TextInput
              style={styles.input}
              value={taskTitle}
              onChangeText={setTaskTitle}
              placeholder="Task title"
              testID="task-title-input"
            />

            <TextInput
              style={styles.textInput}
              value={taskDescription}
              onChangeText={setTaskDescription}
              placeholder="Task description"
              multiline
              numberOfLines={4}
              testID="task-description-input"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowTaskModal(false)}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleAssignTask}
                testID="confirm-task-button"
              >
                <Text style={styles.modalConfirmButtonText}>Assign</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    fontSize: 18,
    color: "#999",
  },
  sessionInfo: {
    backgroundColor: "#fff",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  student: {
    fontSize: 16,
    color: "#666",
    marginBottom: 4,
  },
  subject: {
    fontSize: 14,
    color: "#999",
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  date: {
    fontSize: 12,
    color: "#999",
  },
  difficultyBadge: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  difficultyText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  flaggedSection: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#FFF3E0",
    borderRadius: 8,
  },
  flaggedTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#F57C00",
    marginBottom: 8,
  },
  flaggedItem: {
    fontSize: 14,
    color: "#F57C00",
    marginTop: 4,
  },
  actionsBar: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    gap: 8,
  },
  actionButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: "#999",
    fontStyle: "italic",
  },
  annotationCard: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  annotationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  annotationType: {
    fontSize: 12,
    fontWeight: "600",
    color: "#007AFF",
    textTransform: "uppercase",
  },
  annotationContent: {
    fontSize: 14,
    color: "#333",
    marginBottom: 8,
  },
  feedbackCard: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  feedbackHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  feedbackType: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4CAF50",
  },
  feedbackContent: {
    fontSize: 14,
    color: "#333",
    marginBottom: 8,
  },
  filePath: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
    marginBottom: 4,
  },
  duration: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 11,
    color: "#999",
  },
  sharedBadge: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  sharedBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
  shareButton: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 24,
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  typeSelector: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  typeButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
  },
  typeButtonActive: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  typeButtonText: {
    color: "#666",
    fontSize: 14,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  typeButtonTextActive: {
    color: "#fff",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    minHeight: 100,
    textAlignVertical: "top",
  },
  recordingPlaceholder: {
    backgroundColor: "#f5f5f5",
    padding: 32,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  recordingText: {
    fontSize: 48,
    marginBottom: 8,
  },
  recordingLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  recordingNote: {
    fontSize: 12,
    color: "#999",
    fontStyle: "italic",
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
