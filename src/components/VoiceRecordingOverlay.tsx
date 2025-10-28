import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  AccessibilityInfo,
} from "react-native";

interface VoiceRecordingOverlayProps {
  visible: boolean;
  transcript: string;
  isRecording: boolean;
  error: string | null;
  onClose: () => void;
  onStop: () => void;
  onCancel: () => void;
}

export const VoiceRecordingOverlay: React.FC<VoiceRecordingOverlayProps> = ({
  visible,
  transcript,
  isRecording,
  error,
  onClose,
  onStop,
  onCancel,
}) => {
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording, pulseAnim]);

  useEffect(() => {
    if (visible && isRecording) {
      AccessibilityInfo.announceForAccessibility("Voice recording started");
    }
  }, [visible, isRecording]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      testID="voice-recording-overlay"
      accessibilityViewIsModal
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Voice Input</Text>
            <TouchableOpacity
              onPress={onCancel}
              style={styles.closeButton}
              testID="voice-cancel-button"
              accessibilityLabel="Cancel voice recording"
              accessibilityRole="button"
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            {isRecording && (
              <Animated.View
                style={[
                  styles.microphoneIcon,
                  { transform: [{ scale: pulseAnim }] },
                ]}
              >
                <Text style={styles.microphoneEmoji}>🎤</Text>
              </Animated.View>
            )}

            <Text
              style={styles.statusText}
              accessibilityLabel={isRecording ? "Recording" : "Ready to record"}
              accessibilityLiveRegion="polite"
            >
              {isRecording ? "Listening..." : "Ready"}
            </Text>

            {error && (
              <View style={styles.errorContainer}>
                <Text
                  style={styles.errorText}
                  accessibilityLabel={`Error: ${error}`}
                  accessibilityRole="alert"
                >
                  ⚠️ {error}
                </Text>
              </View>
            )}

            {transcript ? (
              <View style={styles.transcriptContainer}>
                <Text style={styles.transcriptLabel}>Transcript:</Text>
                <Text
                  style={styles.transcriptText}
                  testID="voice-transcript"
                  accessibilityLabel={`Transcript: ${transcript}`}
                  accessibilityLiveRegion="polite"
                >
                  {transcript}
                </Text>
              </View>
            ) : (
              <Text style={styles.hintText}>
                Speak clearly into your device's microphone
              </Text>
            )}
          </View>

          <View style={styles.actions}>
            {isRecording ? (
              <TouchableOpacity
                style={[styles.button, styles.stopButton]}
                onPress={onStop}
                testID="voice-stop-button"
                accessibilityLabel="Stop recording"
                accessibilityRole="button"
                accessibilityHint="Stops voice recording and uses the transcript"
              >
                <Text style={styles.buttonText}>⏹ Stop</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.button, styles.doneButton]}
                onPress={onClose}
                testID="voice-done-button"
                accessibilityLabel="Done"
                accessibilityRole="button"
                accessibilityHint="Closes voice recording overlay"
              >
                <Text style={styles.buttonText}>✓ Done</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: Dimensions.get("window").width * 0.85,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    maxHeight: "80%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 24,
    color: "#666",
  },
  content: {
    alignItems: "center",
    paddingVertical: 20,
  },
  microphoneIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  microphoneEmoji: {
    fontSize: 40,
  },
  statusText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
  },
  errorContainer: {
    backgroundColor: "#FFE5E5",
    padding: 12,
    borderRadius: 8,
    marginVertical: 12,
    width: "100%",
  },
  errorText: {
    fontSize: 14,
    color: "#D32F2F",
    textAlign: "center",
  },
  transcriptContainer: {
    width: "100%",
    backgroundColor: "#f5f5f5",
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  transcriptLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
  },
  transcriptText: {
    fontSize: 16,
    color: "#333",
    lineHeight: 24,
  },
  hintText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginTop: 8,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginTop: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  stopButton: {
    backgroundColor: "#FF3B30",
  },
  doneButton: {
    backgroundColor: "#34C759",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});
