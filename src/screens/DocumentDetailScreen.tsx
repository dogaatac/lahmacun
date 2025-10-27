import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import {
  ImportedDocument,
  DocumentChunk,
  DocumentSummary,
  DocumentQuiz,
} from "../types";
import DocumentService from "../services/DocumentService";
import GeminiService from "../services/GeminiService";

export const DocumentDetailScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { documentId } = route.params as { documentId: string };

  const [document, setDocument] = useState<ImportedDocument | null>(null);
  const [chunks, setChunks] = useState<DocumentChunk[]>([]);
  const [summary, setSummary] = useState<DocumentSummary | null>(null);
  const [quiz, setQuiz] = useState<DocumentQuiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingContent, setGeneratingContent] = useState(false);
  const [activeTab, setActiveTab] = useState<"content" | "summary" | "quiz">(
    "content"
  );

  useEffect(() => {
    loadDocument();
  }, [documentId]);

  const loadDocument = async () => {
    try {
      setLoading(true);
      const doc = await DocumentService.getDocument(documentId);
      if (doc) {
        setDocument(doc);
        const docChunks = await DocumentService.getDocumentChunks(documentId);
        setChunks(docChunks);
      } else {
        Alert.alert("Error", "Document not found");
        navigation.goBack();
      }
    } catch (error: any) {
      Alert.alert("Error", `Failed to load document: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSummary = async () => {
    if (!GeminiService.isConfigured()) {
      Alert.alert(
        "API Key Required",
        "Please configure your Gemini API key in settings first."
      );
      return;
    }

    try {
      setGeneratingContent(true);
      const newSummary = await DocumentService.generateSummary(
        documentId,
        GeminiService
      );
      setSummary(newSummary);
      setActiveTab("summary");
      Alert.alert("Success", "Summary generated successfully!");
    } catch (error: any) {
      Alert.alert("Error", `Failed to generate summary: ${error.message}`);
    } finally {
      setGeneratingContent(false);
    }
  };

  const handleGenerateQuiz = async () => {
    if (!GeminiService.isConfigured()) {
      Alert.alert(
        "API Key Required",
        "Please configure your Gemini API key in settings first."
      );
      return;
    }

    try {
      setGeneratingContent(true);
      const newQuiz = await DocumentService.generateQuiz(
        documentId,
        GeminiService,
        5
      );
      setQuiz(newQuiz);
      setActiveTab("quiz");
      Alert.alert("Success", "Quiz generated successfully!");
    } catch (error: any) {
      Alert.alert("Error", `Failed to generate quiz: ${error.message}`);
    } finally {
      setGeneratingContent(false);
    }
  };

  const renderContent = () => {
    if (!document?.extractedText) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            No text content available
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.contentContainer}>
        <Text style={styles.contentText}>{document.extractedText}</Text>
        {chunks.length > 0 && (
          <View style={styles.chunksInfo}>
            <Text style={styles.chunksInfoText}>
              {chunks.length} chunks • ~
              {chunks.reduce((sum, c) => sum + (c.tokenCount || 0), 0)} tokens
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderSummary = () => {
    if (!summary) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>📝</Text>
          <Text style={styles.emptyStateText}>No summary yet</Text>
          <TouchableOpacity
            style={styles.generateButton}
            onPress={handleGenerateSummary}
            disabled={generatingContent}
          >
            {generatingContent ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.generateButtonText}>Generate Summary</Text>
            )}
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.summaryContainer}>
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <Text style={styles.summaryText}>{summary.summary}</Text>
        </View>

        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Key Points</Text>
          {summary.keyPoints.map((point, index) => (
            <View key={index} style={styles.keyPointItem}>
              <Text style={styles.keyPointBullet}>•</Text>
              <Text style={styles.keyPointText}>{point}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.regenerateButton}
          onPress={handleGenerateSummary}
          disabled={generatingContent}
        >
          <Text style={styles.regenerateButtonText}>Regenerate</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderQuiz = () => {
    if (!quiz) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>❓</Text>
          <Text style={styles.emptyStateText}>No quiz yet</Text>
          <TouchableOpacity
            style={styles.generateButton}
            onPress={handleGenerateQuiz}
            disabled={generatingContent}
          >
            {generatingContent ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.generateButtonText}>Generate Quiz</Text>
            )}
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <ScrollView style={styles.quizContainer}>
        {quiz.questions.map((question, index) => (
          <View key={question.id} style={styles.questionCard}>
            <Text style={styles.questionNumber}>Question {index + 1}</Text>
            <Text style={styles.questionText}>{question.question}</Text>

            {question.options && question.options.length > 0 && (
              <View style={styles.optionsContainer}>
                {question.options.map((option, optIndex) => (
                  <View key={optIndex} style={styles.optionItem}>
                    <Text style={styles.optionLabel}>
                      {String.fromCharCode(65 + optIndex)}.
                    </Text>
                    <Text style={styles.optionText}>{option}</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.answerSection}>
              <Text style={styles.answerLabel}>Answer:</Text>
              <Text style={styles.answerText}>{question.answer}</Text>
            </View>
          </View>
        ))}

        <TouchableOpacity
          style={styles.regenerateButton}
          onPress={handleGenerateQuiz}
          disabled={generatingContent}
        >
          <Text style={styles.regenerateButtonText}>Regenerate</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading document...</Text>
      </View>
    );
  }

  if (!document) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Document not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.documentName} numberOfLines={1}>
          {document.name}
        </Text>
        <View style={styles.documentMeta}>
          <Text style={styles.metaText}>
            {document.pageCount} pages • {chunks.length} chunks
          </Text>
        </View>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "content" && styles.activeTab]}
          onPress={() => setActiveTab("content")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "content" && styles.activeTabText,
            ]}
          >
            Content
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "summary" && styles.activeTab]}
          onPress={() => setActiveTab("summary")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "summary" && styles.activeTabText,
            ]}
          >
            Summary
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "quiz" && styles.activeTab]}
          onPress={() => setActiveTab("quiz")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "quiz" && styles.activeTabText,
            ]}
          >
            Quiz
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.contentArea}>
        {activeTab === "content" && renderContent()}
        {activeTab === "summary" && renderSummary()}
        {activeTab === "quiz" && renderQuiz()}
      </ScrollView>

      <View style={styles.actionBar}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleGenerateSummary}
          disabled={generatingContent}
        >
          <Text style={styles.actionButtonText}>📝 Summarize</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleGenerateQuiz}
          disabled={generatingContent}
        >
          <Text style={styles.actionButtonText}>❓ Quiz</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  header: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  documentName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  documentMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaText: {
    fontSize: 14,
    color: "#666",
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: "#007AFF",
  },
  tabText: {
    fontSize: 16,
    color: "#666",
  },
  activeTabText: {
    color: "#007AFF",
    fontWeight: "600",
  },
  contentArea: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  contentText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333",
  },
  chunksInfo: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#E3F2FD",
    borderRadius: 8,
  },
  chunksInfoText: {
    fontSize: 14,
    color: "#1976D2",
  },
  summaryContainer: {
    padding: 16,
  },
  summarySection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333",
  },
  keyPointItem: {
    flexDirection: "row",
    marginBottom: 8,
  },
  keyPointBullet: {
    fontSize: 16,
    color: "#007AFF",
    marginRight: 8,
    marginTop: 2,
  },
  keyPointText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    color: "#333",
  },
  quizContainer: {
    padding: 16,
  },
  questionCard: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  questionNumber: {
    fontSize: 14,
    fontWeight: "600",
    color: "#007AFF",
    marginBottom: 8,
  },
  questionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  optionsContainer: {
    marginBottom: 12,
  },
  optionItem: {
    flexDirection: "row",
    marginBottom: 8,
    paddingLeft: 8,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
    marginRight: 8,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  answerSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  answerLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 4,
  },
  answerText: {
    fontSize: 16,
    color: "#4CAF50",
    fontWeight: "600",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 18,
    color: "#666",
    marginBottom: 24,
  },
  generateButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 150,
    alignItems: "center",
  },
  generateButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  regenerateButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  regenerateButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  actionBar: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  actionButton: {
    flex: 1,
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 6,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  errorText: {
    fontSize: 16,
    color: "#F44336",
  },
});
