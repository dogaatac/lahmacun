import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import TeacherModeService from "../services/TeacherModeService";
import AnalyticsService from "../services/AnalyticsService";

interface TeacherPinModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode: "setup" | "verify";
}

export const TeacherPinModal: React.FC<TeacherPinModalProps> = ({
  visible,
  onClose,
  onSuccess,
  mode,
}) => {
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (mode === "setup") {
      if (pin.length < 4) {
        Alert.alert("Error", "PIN must be at least 4 digits");
        return;
      }
      if (pin !== confirmPin) {
        Alert.alert("Error", "PINs do not match");
        return;
      }

      try {
        setLoading(true);
        await TeacherModeService.setPin(pin);
        AnalyticsService.track("teacher_pin_setup");
        Alert.alert("Success", "Teacher PIN set successfully");
        setPin("");
        setConfirmPin("");
        onSuccess();
      } catch (error) {
        Alert.alert("Error", "Failed to set PIN");
      } finally {
        setLoading(false);
      }
    } else {
      if (pin.length < 4) {
        Alert.alert("Error", "Please enter your PIN");
        return;
      }

      try {
        setLoading(true);
        const isValid = await TeacherModeService.enableTeacherMode(pin);
        if (isValid) {
          AnalyticsService.track("teacher_mode_enabled");
          setPin("");
          onSuccess();
        } else {
          Alert.alert("Error", "Invalid PIN");
          setPin("");
        }
      } catch (error) {
        Alert.alert("Error", "Failed to verify PIN");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleClose = () => {
    setPin("");
    setConfirmPin("");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.title}>
            {mode === "setup" ? "Setup Teacher PIN" : "Enter Teacher PIN"}
          </Text>
          <Text style={styles.subtitle}>
            {mode === "setup"
              ? "Create a PIN to secure Teacher Mode"
              : "Enter your PIN to access Teacher Mode"}
          </Text>

          <TextInput
            style={styles.input}
            value={pin}
            onChangeText={setPin}
            placeholder={mode === "setup" ? "Enter PIN" : "Enter your PIN"}
            secureTextEntry
            keyboardType="number-pad"
            maxLength={6}
            testID="pin-input"
          />

          {mode === "setup" && (
            <TextInput
              style={styles.input}
              value={confirmPin}
              onChangeText={setConfirmPin}
              placeholder="Confirm PIN"
              secureTextEntry
              keyboardType="number-pad"
              maxLength={6}
              testID="confirm-pin-input"
            />
          )}

          <View style={styles.buttons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
              disabled={loading}
              testID="cancel-button"
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={loading}
              testID="submit-button"
            >
              <Text style={styles.submitButtonText}>
                {mode === "setup" ? "Setup" : "Enter"}
              </Text>
            </TouchableOpacity>
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
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "85%",
    maxWidth: 400,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 24,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
    marginBottom: 12,
    textAlign: "center",
    letterSpacing: 4,
  },
  buttons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#666",
    fontWeight: "600",
    fontSize: 16,
  },
  submitButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#007AFF",
    alignItems: "center",
  },
  submitButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
