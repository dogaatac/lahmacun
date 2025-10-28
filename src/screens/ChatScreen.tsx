import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ListRenderItem,
  Alert,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import GeminiService from "../services/GeminiService";
import AnalyticsService from "../services/AnalyticsService";
import SubscriptionService from "../services/SubscriptionService";
import PerformanceMonitor from "../utils/PerformanceMonitor";
import { ResourcePanel } from "../components/ResourcePanel";
import { Resource, ExplanationMode } from "../types";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: number;
  hasResources?: boolean;
}

export const ChatScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const context = (route.params as any)?.context;

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hi! I can help you understand this problem better. What would you like to know?",
      isUser: false,
      timestamp: Date.now(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [hasProAccess, setHasProAccess] = useState(false);
  const [showResources, setShowResources] = useState(false);
  const [chatResources, setChatResources] = useState<Resource[]>([]);
  const [currentMode, setCurrentMode] = useState<ExplanationMode>("standard");
  const [showModeSelector, setShowModeSelector] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    checkAccess();
    AnalyticsService.trackScreen("Chat", {
      hasContext: !!context,
    });
    PerformanceMonitor.trackMemoryUsage("ChatScreen_mount");
  }, [context]);

  const checkAccess = async () => {
    const access = await SubscriptionService.hasProAccess();
    setHasProAccess(access);
  };

  const handleSend = useCallback(async () => {
    if (!inputText.trim() || isLoading) {
      return;
    }

    const FREE_MESSAGE_LIMIT = 3;
    if (!hasProAccess && messageCount >= FREE_MESSAGE_LIMIT) {
      Alert.alert(
        "Upgrade to Tutor Pack",
        "You've reached the free message limit. Upgrade to Tutor Pack for unlimited AI tutor chat.",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Upgrade",
            onPress: () => navigation.navigate("Paywall" as never),
          },
        ]
      );
      AnalyticsService.track("chat_limit_reached");
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);
    setMessageCount(prev => prev + 1);

    AnalyticsService.track("chat_message_sent", {
      message_length: userMessage.text.length,
      has_pro_access: hasProAccess,
      message_count: messageCount + 1,
      explanation_mode: currentMode,
    });

    const startTime = Date.now();

    try {
      const response = await GeminiService.chat(
        userMessage.text,
        messages.map((m) => ({ parts: [{ text: m.text }] })),
        { mode: currentMode }
      );

      const generationTime = Date.now() - startTime;

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.text,
        isUser: false,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, botMessage]);

      AnalyticsService.track("chat_response_received", {
        confidence: response.confidence,
        explanation_mode: currentMode,
      });
      
      AnalyticsService.trackExplanationGeneration(
        currentMode,
        "Chat",
        false,
        generationTime
      );
    } catch (error) {
      AnalyticsService.trackError(error as Error, { screen: "Chat" });

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm sorry, I encountered an error. Please try again.",
        isUser: false,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [inputText, isLoading, messages, hasProAccess, messageCount, navigation, currentMode]);

  const handleModeChange = useCallback((mode: ExplanationMode) => {
    const previousMode = currentMode;
    setCurrentMode(mode);
    setShowModeSelector(false);
    
    AnalyticsService.trackExplanationModeSwitch(
      "Chat",
      previousMode,
      mode,
      false
    );
    AnalyticsService.trackExplanationModeUsage(mode, "Chat");
  }, [currentMode]);

  useEffect(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const renderMessage: ListRenderItem<Message> = useCallback(
    ({ item, index }) => <MessageBubble message={item} index={index} />,
    []
  );

  const keyExtractor = useCallback((item: Message) => item.id, []);

  const listData = useMemo(() => {
    return isLoading
      ? [
          ...messages,
          {
            id: "loading",
            text: "...",
            isUser: false,
            timestamp: Date.now(),
          },
        ]
      : messages;
  }, [messages, isLoading]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={100}
      testID="chat-screen"
    >
      {!hasProAccess && (
        <View style={styles.limitBanner}>
          <Text style={styles.limitText}>
            {messageCount}/3 free messages used
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate("Paywall" as never)}>
            <Text style={styles.upgradeLink}>Upgrade</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.modeSelector}>
        <TouchableOpacity
          style={styles.modeSelectorToggle}
          onPress={() => setShowModeSelector(!showModeSelector)}
          testID="mode-selector-toggle"
        >
          <Text style={styles.modeSelectorText}>
            Mode: {currentMode === "eli5" ? "🎈 ELI5" : currentMode === "advanced" ? "🔬 Advanced" : "📚 Standard"}
          </Text>
          <Text style={styles.modeSelectorArrow}>{showModeSelector ? "▲" : "▼"}</Text>
        </TouchableOpacity>
        
        {showModeSelector && (
          <View style={styles.modeOptions}>
            <TouchableOpacity
              style={[
                styles.modeOption,
                currentMode === "eli5" && styles.modeOptionActive
              ]}
              onPress={() => handleModeChange("eli5")}
              testID="chat-mode-eli5"
            >
              <Text style={[
                styles.modeOptionText,
                currentMode === "eli5" && styles.modeOptionTextActive
              ]}>
                🎈 ELI5 - Simple explanations for everyone
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.modeOption,
                currentMode === "standard" && styles.modeOptionActive
              ]}
              onPress={() => handleModeChange("standard")}
              testID="chat-mode-standard"
            >
              <Text style={[
                styles.modeOptionText,
                currentMode === "standard" && styles.modeOptionTextActive
              ]}>
                📚 Standard - Balanced explanations
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.modeOption,
                currentMode === "advanced" && styles.modeOptionActive
              ]}
              onPress={() => handleModeChange("advanced")}
              testID="chat-mode-advanced"
            >
              <Text style={[
                styles.modeOptionText,
                currentMode === "advanced" && styles.modeOptionTextActive
              ]}>
                🔬 Advanced - Technical details
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      
      {chatResources.length > 0 && (
        <TouchableOpacity
          style={styles.resourceToggle}
          onPress={() => setShowResources(!showResources)}
          testID="toggle-resources-button"
        >
          <Text style={styles.resourceToggleText}>
            📚 {showResources ? "Hide" : "Show"} Resources ({chatResources.length})
          </Text>
        </TouchableOpacity>
      )}

      {showResources && chatResources.length > 0 && (
        <View style={styles.resourcesContainer}>
          <ResourcePanel
            resources={chatResources}
            contextId={`chat_${Date.now()}`}
          />
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={listData}
        renderItem={renderMessage}
        keyExtractor={keyExtractor}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        testID="messages-scroll"
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={20}
        windowSize={21}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Ask a question..."
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={handleSend}
          multiline
          maxLength={500}
          testID="chat-input"
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!inputText.trim() || isLoading) && styles.sendButtonDisabled,
          ]}
          onPress={handleSend}
          disabled={!inputText.trim() || isLoading}
          testID="send-button"
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const MessageBubble = React.memo<{ message: Message; index: number }>(
  ({ message, index }) => {
    const isTyping = message.id === "loading";

    return (
      <View
        style={[
          styles.messageBubble,
          message.isUser ? styles.userBubble : styles.botBubble,
        ]}
        testID={isTyping ? "typing-indicator" : `message-${index}`}
      >
        <Text
          style={[
            styles.messageText,
            message.isUser ? styles.userText : styles.botText,
          ]}
        >
          {message.text}
        </Text>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  limitBanner: {
    backgroundColor: "#FFF9E6",
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#FFE0B2",
  },
  limitText: {
    fontSize: 14,
    color: "#F57C00",
  },
  upgradeLink: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "600",
  },
  modeSelector: {
    backgroundColor: "#f9f9f9",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  modeSelectorToggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  modeSelectorText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  modeSelectorArrow: {
    fontSize: 12,
    color: "#666",
  },
  modeOptions: {
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  modeOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modeOptionActive: {
    backgroundColor: "#e8f4fd",
  },
  modeOptionText: {
    fontSize: 14,
    color: "#666",
  },
  modeOptionTextActive: {
    color: "#007AFF",
    fontWeight: "600",
  },
  resourceToggle: {
    backgroundColor: "#e8f4fd",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#c8e4f8",
  },
  resourceToggleText: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "600",
    textAlign: "center",
  },
  resourcesContainer: {
    maxHeight: 300,
    backgroundColor: "#f5f5f5",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    gap: 12,
  },
  messageBubble: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 16,
    marginVertical: 4,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#007AFF",
    borderBottomRightRadius: 4,
  },
  botBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#fff",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: "#fff",
  },
  botText: {
    color: "#333",
  },
  inputContainer: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: "#007AFF",
    borderRadius: 20,
    paddingHorizontal: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
