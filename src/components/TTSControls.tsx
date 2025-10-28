import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  AccessibilityInfo,
} from "react-native";
import Slider from "@react-native-community/slider";
import VoiceService, { TTSOptions } from "../services/VoiceService";

interface TTSControlsProps {
  text: string;
  visible: boolean;
  onClose: () => void;
  autoPlay?: boolean;
  title?: string;
}

export const TTSControls: React.FC<TTSControlsProps> = ({
  text,
  visible,
  onClose,
  autoPlay = false,
  title = "Text-to-Speech",
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [rate, setRate] = useState(1.0);
  const [pitch, setPitch] = useState(1.0);

  useEffect(() => {
    if (visible && autoPlay && text) {
      handlePlay();
    }

    return () => {
      VoiceService.stopSpeaking();
    };
  }, [visible, autoPlay, text]);

  useEffect(() => {
    if (visible && isPlaying) {
      AccessibilityInfo.announceForAccessibility("Text-to-speech started");
    }
  }, [visible, isPlaying]);

  const handlePlay = async () => {
    try {
      if (isPaused) {
        await VoiceService.resumeSpeaking();
        setIsPaused(false);
      } else {
        const options: TTSOptions = {
          rate,
          pitch,
          language: "en-US",
        };
        await VoiceService.speak(text, options);
      }
      setIsPlaying(true);
    } catch (error) {
      console.error("Failed to play TTS:", error);
    }
  };

  const handlePause = async () => {
    try {
      await VoiceService.pauseSpeaking();
      setIsPaused(true);
      setIsPlaying(false);
      AccessibilityInfo.announceForAccessibility("Paused");
    } catch (error) {
      console.error("Failed to pause TTS:", error);
    }
  };

  const handleStop = async () => {
    try {
      await VoiceService.stopSpeaking();
      setIsPlaying(false);
      setIsPaused(false);
      AccessibilityInfo.announceForAccessibility("Stopped");
    } catch (error) {
      console.error("Failed to stop TTS:", error);
    }
  };

  const handleClose = async () => {
    await handleStop();
    onClose();
  };

  const handleRateChange = (value: number) => {
    setRate(value);
    if (isPlaying) {
      handleStop();
    }
  };

  const handlePitchChange = (value: number) => {
    setPitch(value);
    if (isPlaying) {
      handleStop();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
      testID="tts-controls-modal"
      accessibilityViewIsModal
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeButton}
              testID="tts-close-button"
              accessibilityLabel="Close text-to-speech controls"
              accessibilityRole="button"
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <View style={styles.textPreview}>
              <Text
                style={styles.textPreviewContent}
                numberOfLines={4}
                accessibilityLabel={`Reading text: ${text}`}
              >
                {text}
              </Text>
            </View>

            <View style={styles.controls}>
              <View style={styles.mainControls}>
                {!isPlaying && !isPaused && (
                  <TouchableOpacity
                    style={[styles.controlButton, styles.playButton]}
                    onPress={handlePlay}
                    testID="tts-play-button"
                    accessibilityLabel="Play"
                    accessibilityRole="button"
                    accessibilityHint="Starts reading the text aloud"
                  >
                    <Text style={styles.controlButtonText}>▶ Play</Text>
                  </TouchableOpacity>
                )}

                {isPlaying && (
                  <TouchableOpacity
                    style={[styles.controlButton, styles.pauseButton]}
                    onPress={handlePause}
                    testID="tts-pause-button"
                    accessibilityLabel="Pause"
                    accessibilityRole="button"
                    accessibilityHint="Pauses reading"
                  >
                    <Text style={styles.controlButtonText}>⏸ Pause</Text>
                  </TouchableOpacity>
                )}

                {isPaused && (
                  <TouchableOpacity
                    style={[styles.controlButton, styles.resumeButton]}
                    onPress={handlePlay}
                    testID="tts-resume-button"
                    accessibilityLabel="Resume"
                    accessibilityRole="button"
                    accessibilityHint="Resumes reading"
                  >
                    <Text style={styles.controlButtonText}>▶ Resume</Text>
                  </TouchableOpacity>
                )}

                {(isPlaying || isPaused) && (
                  <TouchableOpacity
                    style={[styles.controlButton, styles.stopButton]}
                    onPress={handleStop}
                    testID="tts-stop-button"
                    accessibilityLabel="Stop"
                    accessibilityRole="button"
                    accessibilityHint="Stops reading"
                  >
                    <Text style={styles.controlButtonText}>⏹ Stop</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.settingsContainer}>
                <View style={styles.settingItem}>
                  <View style={styles.settingHeader}>
                    <Text style={styles.settingLabel}>Speed</Text>
                    <Text
                      style={styles.settingValue}
                      accessibilityLabel={`Speed: ${rate.toFixed(1)}x`}
                    >
                      {rate.toFixed(1)}x
                    </Text>
                  </View>
                  <Slider
                    style={styles.slider}
                    minimumValue={0.5}
                    maximumValue={2.0}
                    step={0.1}
                    value={rate}
                    onValueChange={handleRateChange}
                    minimumTrackTintColor="#007AFF"
                    maximumTrackTintColor="#d3d3d3"
                    testID="tts-rate-slider"
                    accessibilityLabel="Adjust speech speed"
                    accessibilityRole="adjustable"
                  />
                </View>

                <View style={styles.settingItem}>
                  <View style={styles.settingHeader}>
                    <Text style={styles.settingLabel}>Pitch</Text>
                    <Text
                      style={styles.settingValue}
                      accessibilityLabel={`Pitch: ${pitch.toFixed(1)}`}
                    >
                      {pitch.toFixed(1)}
                    </Text>
                  </View>
                  <Slider
                    style={styles.slider}
                    minimumValue={0.5}
                    maximumValue={2.0}
                    step={0.1}
                    value={pitch}
                    onValueChange={handlePitchChange}
                    minimumTrackTintColor="#007AFF"
                    maximumTrackTintColor="#d3d3d3"
                    testID="tts-pitch-slider"
                    accessibilityLabel="Adjust speech pitch"
                    accessibilityRole="adjustable"
                  />
                </View>
              </View>
            </View>

            <Text style={styles.hint}>
              Adjust speed and pitch, then press play
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "70%",
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
    gap: 20,
  },
  textPreview: {
    backgroundColor: "#f5f5f5",
    padding: 16,
    borderRadius: 12,
    maxHeight: 120,
  },
  textPreviewContent: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  controls: {
    gap: 16,
  },
  mainControls: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
  },
  controlButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  playButton: {
    backgroundColor: "#34C759",
  },
  pauseButton: {
    backgroundColor: "#FF9500",
  },
  resumeButton: {
    backgroundColor: "#34C759",
  },
  stopButton: {
    backgroundColor: "#FF3B30",
  },
  controlButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  settingsContainer: {
    gap: 16,
  },
  settingItem: {
    gap: 8,
  },
  settingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  settingValue: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "600",
  },
  slider: {
    width: "100%",
    height: 40,
  },
  hint: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
  },
});
