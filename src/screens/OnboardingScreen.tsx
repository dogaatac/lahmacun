import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import AnalyticsService from "../services/AnalyticsService";
import PerformanceMonitor from "../utils/PerformanceMonitor";

const ONBOARDING_STEPS = [
  {
    title: "Solve Math Problems",
    description: "Take a photo of any math problem and get instant solutions",
    icon: "📸",
  },
  {
    title: "Learn Step by Step",
    description: "Understand each step of the solution process",
    icon: "📚",
  },
  {
    title: "Practice with Quizzes",
    description: "Test your knowledge with personalized quizzes",
    icon: "🎯",
  },
];

export const OnboardingScreen: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const navigation = useNavigation();

  useEffect(() => {
    PerformanceMonitor.trackMemoryUsage("OnboardingScreen_mount");
  }, []);

  const handleComplete = useCallback(() => {
    AnalyticsService.track("onboarding_completed");
    navigation.navigate("Home" as never);
  }, [navigation]);

  const handleNext = useCallback(() => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
      AnalyticsService.track("onboarding_step", { step: currentStep + 1 });
    } else {
      handleComplete();
    }
  }, [currentStep, handleComplete]);

  const handleSkip = useCallback(() => {
    AnalyticsService.track("onboarding_skipped", { step: currentStep });
    handleComplete();
  }, [currentStep, handleComplete]);

  const step = ONBOARDING_STEPS[currentStep];

  return (
    <View style={styles.container} testID="onboarding-screen">
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.stepContainer}>
          <Text style={styles.icon} testID="step-icon">
            {step.icon}
          </Text>
          <Text style={styles.title} testID="step-title">
            {step.title}
          </Text>
          <Text style={styles.description} testID="step-description">
            {step.description}
          </Text>
        </View>

        <View style={styles.pagination}>
          {ONBOARDING_STEPS.map((_, index) => (
            <View
              key={index}
              style={[styles.dot, index === currentStep && styles.dotActive]}
              testID={`pagination-dot-${index}`}
            />
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          onPress={handleSkip}
          style={styles.skipButton}
          testID="skip-button"
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleNext}
          style={styles.nextButton}
          testID="next-button"
        >
          <Text style={styles.nextText}>
            {currentStep === ONBOARDING_STEPS.length - 1
              ? "Get Started"
              : "Next"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  stepContainer: {
    alignItems: "center",
    marginBottom: 60,
  },
  icon: {
    fontSize: 100,
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ddd",
  },
  dotActive: {
    backgroundColor: "#007AFF",
    width: 24,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  skipButton: {
    padding: 12,
  },
  skipText: {
    fontSize: 16,
    color: "#666",
  },
  nextButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  nextText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
});
