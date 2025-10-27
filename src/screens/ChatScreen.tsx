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
} from "react-native";
import { useRoute } from "@react-navigation/native";
import GeminiService from "../services/GeminiService";
import AnalyticsService from "../services/AnalyticsService";
import PerformanceMonitor from "../utils/PerformanceMonitor";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: number;
}

export const ChatScreen: React.FC = () => {
  const route = useRoute();
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
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    AnalyticsService.trackScreen("Chat", {
      hasContext: !!context,
    });
    PerformanceMonitor.trackMemoryUsage("ChatScreen_mount");
  }, [context]);

  const handleSend = useCallback(async () => {
    if (!inputText.trim() || isLoading) {
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

    AnalyticsService.track("chat_message_sent", {
      message_length: userMessage.text.length,
    });

    try {
      const response = await GeminiService.chat(
        userMessage.text,
        messages.map((m) => ({ parts: [{ text: m.text }] }))
      );

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.text,
        isUser: false,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, botMessage]);

      AnalyticsService.track("chat_response_received", {
        confidence: response.confidence,
      });
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
  }, [inputText, isLoading, messages]);

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
