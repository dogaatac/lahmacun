import React, { useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { ProblemAnalysis } from "../services/GeminiService";
import AnalyticsService from "../services/AnalyticsService";
import PerformanceMonitor from "../utils/PerformanceMonitor";

export const SolutionScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const solution = (route.params as any)?.solution as ProblemAnalysis;

  useEffect(() => {
    AnalyticsService.trackScreen("Solution", {
      difficulty: solution?.difficulty,
    });
    PerformanceMonitor.trackMemoryUsage("SolutionScreen_mount");
  }, [solution]);

  const handleChat = useCallback(() => {
    AnalyticsService.track("open_chat_from_solution");
    navigation.navigate(
      "Chat" as never,
      {
        context: solution,
      } as never
    );
  }, [navigation, solution]);

  const handleNewProblem = useCallback(() => {
    AnalyticsService.track("new_problem_from_solution");
    navigation.goBack();
  }, [navigation]);

  const renderedSteps = useMemo(() => {
    if (!solution) {
      return null;
    }
    return solution.steps.map((step, index) => (
      <StepItem key={index} step={step} index={index} />
    ));
  }, [solution]);

  if (!solution) {
    return (
      <View style={styles.container} testID="solution-screen">
        <Text style={styles.errorText}>No solution available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container} testID="solution-screen">
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Solution</Text>
          <View style={styles.difficultyBadge}>
            <Text
              style={[
                styles.difficultyText,
                styles[`difficulty_${solution.difficulty}`],
              ]}
              testID="difficulty-badge"
            >
              {solution.difficulty.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.stepsContainer}>
          <Text style={styles.sectionTitle}>Step by Step</Text>
          {renderedSteps}
        </View>

        <View style={styles.answerContainer}>
          <Text style={styles.sectionTitle}>Final Answer</Text>
          <View style={styles.answerBox} testID="final-answer">
            <Text style={styles.answerText}>{solution.solution}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.chatButton}
          onPress={handleChat}
          testID="ask-question-button"
        >
          <Text style={styles.chatButtonText}>💬 Ask a Question</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.newProblemButton}
          onPress={handleNewProblem}
          testID="new-problem-button"
        >
          <Text style={styles.newProblemButtonText}>New Problem</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const StepItem = React.memo<{ step: string; index: number }>(
  ({ step, index }) => (
    <View style={styles.stepItem} testID={`step-${index}`}>
      <View style={styles.stepNumber}>
        <Text style={styles.stepNumberText}>{index + 1}</Text>
      </View>
      <Text style={styles.stepText}>{step}</Text>
    </View>
  )
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  difficultyBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "#f0f0f0",
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: "600",
  },
  difficulty_easy: {
    color: "#34C759",
  },
  difficulty_medium: {
    color: "#FF9500",
  },
  difficulty_hard: {
    color: "#FF3B30",
  },
  stepsContainer: {
    padding: 20,
    backgroundColor: "#fff",
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
  },
  stepItem: {
    flexDirection: "row",
    marginBottom: 16,
    alignItems: "flex-start",
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  stepNumberText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  stepText: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    lineHeight: 24,
    paddingTop: 4,
  },
  answerContainer: {
    padding: 20,
    backgroundColor: "#fff",
    marginTop: 12,
  },
  answerBox: {
    backgroundColor: "#e8f4fd",
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#007AFF",
  },
  answerText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#007AFF",
    textAlign: "center",
  },
  errorText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 50,
  },
  footer: {
    padding: 20,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    gap: 12,
  },
  chatButton: {
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  chatButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
  newProblemButton: {
    backgroundColor: "#f0f0f0",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  newProblemButtonText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "600",
  },
});
