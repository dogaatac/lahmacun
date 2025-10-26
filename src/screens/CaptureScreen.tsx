import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import GeminiService from '../services/GeminiService';
import AnalyticsService from '../services/AnalyticsService';
import GamificationService from '../services/GamificationService';

export const CaptureScreen: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const navigation = useNavigation();

  const handleCapture = async () => {
    try {
      AnalyticsService.track('capture_initiated');
      
      // Simulate camera capture
      const mockImageData = 'base64_encoded_image_data';
      setCapturedImage(mockImageData);
      
      AnalyticsService.track('image_captured');
    } catch (error) {
      AnalyticsService.trackError(error as Error, { screen: 'Capture' });
      Alert.alert('Error', 'Failed to capture image');
    }
  };

  const handleAnalyze = async () => {
    if (!capturedImage) return;

    try {
      setIsProcessing(true);
      AnalyticsService.track('analysis_started');

      const startTime = Date.now();
      const result = await GeminiService.analyzeProblem(capturedImage);
      const timeSpent = Date.now() - startTime;

      AnalyticsService.track('analysis_completed', {
        difficulty: result.difficulty,
        time_ms: timeSpent,
      });

      await GamificationService.recordProblemSolved();

      navigation.navigate('Solution' as never, { solution: result } as never);
    } catch (error) {
      AnalyticsService.trackError(error as Error, { screen: 'Capture' });
      Alert.alert('Error', 'Failed to analyze problem');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    AnalyticsService.track('retake_photo');
  };

  return (
    <View style={styles.container} testID="capture-screen">
      <View style={styles.cameraContainer}>
        {capturedImage ? (
          <View style={styles.preview} testID="image-preview">
            <Text style={styles.previewText}>📷 Image Captured</Text>
          </View>
        ) : (
          <View style={styles.cameraPlaceholder} testID="camera-placeholder">
            <Text style={styles.placeholderText}>📸</Text>
            <Text style={styles.instructionText}>
              Position math problem in frame
            </Text>
          </View>
        )}
      </View>

      <View style={styles.controls}>
        {!capturedImage ? (
          <TouchableOpacity
            style={styles.captureButton}
            onPress={handleCapture}
            testID="capture-button"
          >
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>
        ) : (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.retakeButton}
              onPress={handleRetake}
              testID="retake-button"
              disabled={isProcessing}
            >
              <Text style={styles.retakeText}>Retake</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.analyzeButton,
                isProcessing && styles.analyzeButtonDisabled,
              ]}
              onPress={handleAnalyze}
              testID="analyze-button"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator color="#fff" testID="loading-indicator" />
              ) : (
                <Text style={styles.analyzeText}>Analyze</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 80,
    marginBottom: 20,
  },
  instructionText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
  },
  preview: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    width: '100%',
  },
  previewText: {
    fontSize: 40,
    color: '#fff',
  },
  controls: {
    padding: 30,
    alignItems: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#333',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  retakeButton: {
    backgroundColor: '#333',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
  },
  retakeText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  analyzeButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  analyzeButtonDisabled: {
    opacity: 0.6,
  },
  analyzeText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});
