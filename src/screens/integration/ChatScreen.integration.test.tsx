import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { ChatScreen } from "../ChatScreen";
import GeminiService from "../../services/GeminiService";
import AnalyticsService from "../../services/AnalyticsService";

jest.mock("../../services/GeminiService");
jest.mock("../../services/AnalyticsService");

const mockRoute = {
  params: {
    context: {
      solution: "x = 5",
      steps: ["Step 1", "Step 2"],
      difficulty: "medium",
    },
  },
};

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useRoute: () => mockRoute,
}));

describe("ChatScreen Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render chat screen with initial message", () => {
    const { getByTestId, getByText } = render(<ChatScreen />);

    expect(getByTestId("chat-screen")).toBeTruthy();
    expect(
      getByText(
        "Hi! I can help you understand this problem better. What would you like to know?"
      )
    ).toBeTruthy();
  });

  it("should render input field and send button", () => {
    const { getByTestId } = render(<ChatScreen />);

    expect(getByTestId("chat-input")).toBeTruthy();
    expect(getByTestId("send-button")).toBeTruthy();
  });

  it("should track screen view on mount", () => {
    render(<ChatScreen />);

    expect(AnalyticsService.trackScreen).toHaveBeenCalledWith("Chat", {
      hasContext: true,
    });
  });

  it("should send message and receive response", async () => {
    const mockResponse = {
      text: "This is a response from the AI",
      confidence: 0.9,
    };

    (GeminiService.chat as jest.Mock).mockResolvedValue(mockResponse);

    const { getByTestId, getByText } = render(<ChatScreen />);

    const input = getByTestId("chat-input");
    const sendButton = getByTestId("send-button");

    fireEvent.changeText(input, "Can you explain step 2?");
    fireEvent.press(sendButton);

    await waitFor(() => {
      expect(getByText("Can you explain step 2?")).toBeTruthy();
      expect(getByText("This is a response from the AI")).toBeTruthy();
    });

    expect(AnalyticsService.track).toHaveBeenCalledWith("chat_message_sent", {
      message_length: 24,
    });
    expect(AnalyticsService.track).toHaveBeenCalledWith(
      "chat_response_received",
      {
        confidence: 0.9,
      }
    );
  });

  it("should clear input after sending message", async () => {
    (GeminiService.chat as jest.Mock).mockResolvedValue({
      text: "Response",
      confidence: 0.8,
    });

    const { getByTestId } = render(<ChatScreen />);

    const input = getByTestId("chat-input");

    fireEvent.changeText(input, "Hello");
    expect(input.props.value).toBe("Hello");

    fireEvent.press(getByTestId("send-button"));

    await waitFor(() => {
      expect(input.props.value).toBe("");
    });
  });

  it("should show typing indicator while loading", async () => {
    (GeminiService.chat as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ text: "Response", confidence: 0.9 }), 100)
        )
    );

    const { getByTestId, queryByTestId } = render(<ChatScreen />);

    fireEvent.changeText(getByTestId("chat-input"), "Question");
    fireEvent.press(getByTestId("send-button"));

    await waitFor(() => {
      expect(queryByTestId("typing-indicator")).toBeTruthy();
    });
  });

  it("should disable send button when input is empty", () => {
    const { getByTestId } = render(<ChatScreen />);

    const sendButton = getByTestId("send-button");
    expect(sendButton.props.accessibilityState?.disabled).toBe(true);
  });

  it("should enable send button when input has text", () => {
    const { getByTestId } = render(<ChatScreen />);

    const input = getByTestId("chat-input");
    const sendButton = getByTestId("send-button");

    fireEvent.changeText(input, "Test message");

    expect(sendButton.props.accessibilityState?.disabled).toBe(false);
  });

  it("should handle API errors gracefully", async () => {
    const error = new Error("API Error");
    (GeminiService.chat as jest.Mock).mockRejectedValue(error);

    const { getByTestId, getByText } = render(<ChatScreen />);

    fireEvent.changeText(getByTestId("chat-input"), "Question");
    fireEvent.press(getByTestId("send-button"));

    await waitFor(() => {
      expect(
        getByText("I'm sorry, I encountered an error. Please try again.")
      ).toBeTruthy();
      expect(AnalyticsService.trackError).toHaveBeenCalledWith(error, {
        screen: "Chat",
      });
    });
  });

  it("should render multiple messages correctly", async () => {
    (GeminiService.chat as jest.Mock)
      .mockResolvedValueOnce({ text: "Response 1", confidence: 0.9 })
      .mockResolvedValueOnce({ text: "Response 2", confidence: 0.9 });

    const { getByTestId, getByText } = render(<ChatScreen />);

    // First message
    fireEvent.changeText(getByTestId("chat-input"), "Question 1");
    fireEvent.press(getByTestId("send-button"));

    await waitFor(() => {
      expect(getByText("Question 1")).toBeTruthy();
      expect(getByText("Response 1")).toBeTruthy();
    });

    // Second message
    fireEvent.changeText(getByTestId("chat-input"), "Question 2");
    fireEvent.press(getByTestId("send-button"));

    await waitFor(() => {
      expect(getByText("Question 2")).toBeTruthy();
      expect(getByText("Response 2")).toBeTruthy();
    });
  });

  it("should not send empty or whitespace-only messages", () => {
    const { getByTestId } = render(<ChatScreen />);

    fireEvent.changeText(getByTestId("chat-input"), "   ");
    fireEvent.press(getByTestId("send-button"));

    expect(GeminiService.chat).not.toHaveBeenCalled();
  });

  it("should pass conversation history to chat service", async () => {
    (GeminiService.chat as jest.Mock).mockResolvedValue({
      text: "Response",
      confidence: 0.9,
    });

    const { getByTestId } = render(<ChatScreen />);

    fireEvent.changeText(getByTestId("chat-input"), "First message");
    fireEvent.press(getByTestId("send-button"));

    await waitFor(() => {
      expect(GeminiService.chat).toHaveBeenCalledWith(
        "First message",
        expect.arrayContaining([
          expect.objectContaining({
            parts: expect.any(Array),
          }),
        ])
      );
    });
  });
});
