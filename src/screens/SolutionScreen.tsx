import React, { useEffect, useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  AccessibilityInfo,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { ProblemAnalysis } from "../services/GeminiService";
import AnalyticsService from "../services/AnalyticsService";
import PerformanceMonitor from "../utils/PerformanceMonitor";
import SessionService from "../services/SessionService";
import UserService from "../services/UserService";
import { ResourcePanel } from "../components/ResourcePanel";
import ResourceService from "../services/ResourceService";
import { Resource, ExplanationMode } from "../types";
import GeminiService from "../services/GeminiService";
import CacheManager from "../utils/CacheManager";
import VoiceService from "../services/VoiceService";
import { TTSControls } from "../components/TTSControls";

export const SolutionScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const initialSolution = (route.params as any)?.solution as ProblemAnalysis;
  const imageData = (route.params as any)?.imageData as string;
  const [solution, setSolution] = useState<ProblemAnalysis>(initialSolution);
  const [resources, setResources] = useState<Resource[]>([]);
  const [currentMode, setCurrentMode] = useState<ExplanationMode>("standard");
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [cachedSolutions, setCachedSolutions] = useState<
    Map<ExplanationMode, ProblemAnalysis>
  >(new Map([["standard", initialSolution]]));
  const [showTTSControls, setShowTTSControls] = useState(false);
  const [ttsRate, setTTSRate] = useState(1.0);
  const [ttsPitch, setTTSPitch] = useState(1.0);

  useEffect(() => {
    AnalyticsService.trackScreen("Solution", {
      difficulty: solution?.difficulty,
    });
    PerformanceMonitor.trackMemoryUsage("SolutionScreen_mount");

    if (solution) {
      createStudentSession();
      loadResources();
    }

    return () => {
      VoiceService.stopSpeaking();
    };
  }, [solution]);

  const loadResources = async () => {
    if (solution?.resources && solution.resources.length > 0) {
      const converted = solution.resources.map((r) =>
        ResourceService.convertToResource(r, undefined, solution.difficulty)
      );
      setResources(converted);
    }
  };

  const createStudentSession = async () => {
    try {
      const profile = await UserService.getProfile();
      if (profile && solution) {
        const session = await SessionService.createSession(
          profile.id,
          profile.name,
          `problem_${Date.now()}`,
          solution.problem || "Math Problem",
          undefined,
          solution.difficulty
        );

        await SessionService.updateSession(session.id, {
          solution: solution.solution,
          completed: true,
        });
      }
    } catch (error) {
      console.error("Failed to create session:", error);
    }
  };

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

  const handleReadAloud = useCallback(() => {
    setShowTTSControls(true);
    AnalyticsService.track("tts_opened", { screen: "Solution" });
    AccessibilityInfo.announceForAccessibility(
      "Opening text to speech controls"
    );
  }, []);

  const handleCloseTTS = useCallback(() => {
    setShowTTSControls(false);
  }, []);

  const getSolutionText = useCallback((): string => {
    if (!solution) return "";

    let text = `Here is the solution. `;

    solution.steps.forEach((step, index) => {
      text += `Step ${index + 1}: ${step}. `;
    });

    text += `The final answer is: ${solution.solution}`;

    return text;
  }, [solution]);

  const handleModeChange = useCallback(
    async (mode: ExplanationMode) => {
      if (mode === currentMode || isRegenerating) {
        return;
      }

      const previousMode = currentMode;
      const startTime = Date.now();

      if (cachedSolutions.has(mode)) {
        const cachedSolution = cachedSolutions.get(mode)!;
        setSolution(cachedSolution);
        setCurrentMode(mode);

        AnalyticsService.trackExplanationModeSwitch(
          "Solution",
          previousMode,
          mode,
          true
        );
        AnalyticsService.trackExplanationModeUsage(mode, "Solution");

        if (cachedSolution?.resources && cachedSolution.resources.length > 0) {
          const converted = cachedSolution.resources.map((r) =>
            ResourceService.convertToResource(
              r,
              undefined,
              cachedSolution.difficulty
            )
          );
          setResources(converted);
        }

        return;
      }

      if (!imageData) {
        console.warn("No image data available for regeneration");
        return;
      }

      setIsRegenerating(true);

      try {
        const newSolution = await GeminiService.analyzeProblem(imageData, {
          mode,
        });
        const generationTime = Date.now() - startTime;

        setSolution(newSolution);
        setCurrentMode(mode);
        setCachedSolutions((prev) => new Map(prev).set(mode, newSolution));

        AnalyticsService.trackExplanationModeSwitch(
          "Solution",
          previousMode,
          mode,
          false
        );
        AnalyticsService.trackExplanationModeUsage(mode, "Solution");
        AnalyticsService.trackExplanationGeneration(
          mode,
          "Solution",
          false,
          generationTime
        );

        if (newSolution?.resources && newSolution.resources.length > 0) {
          const converted = newSolution.resources.map((r) =>
            ResourceService.convertToResource(
              r,
              undefined,
              newSolution.difficulty
            )
          );
          setResources(converted);
        }
      } catch (error) {
        console.error("Failed to regenerate solution:", error);
        AnalyticsService.trackError(error as Error, {
          screen: "Solution",
          action: "mode_switch",
          mode,
        });
      } finally {
        setIsRegenerating(false);
      }
    },
    [currentMode, cachedSolutions, imageData, isRegenerating]
  );

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

        <View style={styles.modeSelector}>
          <Text style={styles.modeSelectorTitle}>Explanation Mode:</Text>
          <View style={styles.modeButtons}>
            <TouchableOpacity
              style={[
                styles.modeButton,
                currentMode === "eli5" && styles.modeButtonActive,
                isRegenerating && styles.modeButtonDisabled,
              ]}
              onPress={() => handleModeChange("eli5")}
              disabled={isRegenerating}
              testID="mode-eli5"
            >
              <Text
                style={[
                  styles.modeButtonText,
                  currentMode === "eli5" && styles.modeButtonTextActive,
                ]}
              >
                🎈 ELI5
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modeButton,
                currentMode === "standard" && styles.modeButtonActive,
                isRegenerating && styles.modeButtonDisabled,
              ]}
              onPress={() => handleModeChange("standard")}
              disabled={isRegenerating}
              testID="mode-standard"
            >
              <Text
                style={[
                  styles.modeButtonText,
                  currentMode === "standard" && styles.modeButtonTextActive,
                ]}
              >
                📚 Standard
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modeButton,
                currentMode === "advanced" && styles.modeButtonActive,
                isRegenerating && styles.modeButtonDisabled,
              ]}
              onPress={() => handleModeChange("advanced")}
              disabled={isRegenerating}
              testID="mode-advanced"
            >
              <Text
                style={[
                  styles.modeButtonText,
                  currentMode === "advanced" && styles.modeButtonTextActive,
                ]}
              >
                🔬 Advanced
              </Text>
            </TouchableOpacity>
          </View>
          {isRegenerating && (
            <View style={styles.regeneratingIndicator}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.regeneratingText}>
                Generating {currentMode} explanation...
              </Text>
            </View>
          )}
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

        {resources.length > 0 && (
          <ResourcePanel
            resources={resources}
            contextId={`solution_${Date.now()}`}
            difficulty={solution.difficulty}
          />
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.ttsButton}
          onPress={handleReadAloud}
          testID="read-aloud-button"
          accessibilityLabel="Read solution aloud"
          accessibilityRole="button"
          accessibilityHint="Opens text-to-speech controls to hear the solution"
        >
          <Text style={styles.ttsButtonText}>🔊 Read Aloud</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.chatButton}
          onPress={handleChat}
          testID="ask-question-button"
          accessibilityLabel="Ask a question"
          accessibilityRole="button"
        >
          <Text style={styles.chatButtonText}>💬 Ask Question</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.newProblemButton}
          onPress={handleNewProblem}
          testID="new-problem-button"
          accessibilityLabel="New problem"
          accessibilityRole="button"
        >
          <Text style={styles.newProblemButtonText}>New Problem</Text>
        </TouchableOpacity>
      </View>

      <TTSControls
        visible={showTTSControls}
        text={getSolutionText()}
        onClose={handleCloseTTS}
        title="Read Solution Aloud"
      />
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
  modeSelector: {
    padding: 16,
    backgroundColor: "#fff",
    marginTop: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modeSelectorTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 12,
  },
  modeButtons: {
    flexDirection: "row",
    gap: 8,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    borderWidth: 2,
    borderColor: "#f0f0f0",
    alignItems: "center",
  },
  modeButtonActive: {
    backgroundColor: "#e8f4fd",
    borderColor: "#007AFF",
  },
  modeButtonDisabled: {
    opacity: 0.5,
  },
  modeButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
  },
  modeButtonTextActive: {
    color: "#007AFF",
  },
  regeneratingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    gap: 8,
  },
  regeneratingText: {
    fontSize: 13,
    color: "#007AFF",
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
    gap: 10,
  },
  ttsButton: {
    backgroundColor: "#34C759",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  ttsButtonText: {
    fontSize: 15,
    color: "#fff",
    fontWeight: "600",
  },
  chatButton: {
    backgroundColor: "#007AFF",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  chatButtonText: {
    fontSize: 15,
    color: "#fff",
    fontWeight: "600",
  },
  newProblemButton: {
    backgroundColor: "#f0f0f0",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  newProblemButtonText: {
    fontSize: 15,
    color: "#333",
    fontWeight: "600",
  },
});
