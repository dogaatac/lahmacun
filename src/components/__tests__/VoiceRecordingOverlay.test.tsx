import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { VoiceRecordingOverlay } from "../VoiceRecordingOverlay";

describe("VoiceRecordingOverlay", () => {
  const defaultProps = {
    visible: true,
    transcript: "",
    isRecording: false,
    error: null,
    onClose: jest.fn(),
    onStop: jest.fn(),
    onCancel: jest.fn(),
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should render when visible", () => {
    const { getByTestId } = render(<VoiceRecordingOverlay {...defaultProps} />);

    expect(getByTestId("voice-recording-overlay")).toBeTruthy();
  });

  it("should not render when not visible", () => {
    const { queryByTestId } = render(
      <VoiceRecordingOverlay {...defaultProps} visible={false} />
    );

    const overlay = queryByTestId("voice-recording-overlay");
    expect(overlay?.props.visible).toBe(false);
  });

  it("should display transcript", () => {
    const { getByTestId } = render(
      <VoiceRecordingOverlay {...defaultProps} transcript="Hello world" />
    );

    const transcript = getByTestId("voice-transcript");
    expect(transcript.props.children).toBe("Hello world");
  });

  it("should display error message", () => {
    const { getByText } = render(
      <VoiceRecordingOverlay
        {...defaultProps}
        error="Microphone not available"
      />
    );

    expect(getByText(/Microphone not available/)).toBeTruthy();
  });

  it("should show stop button when recording", () => {
    const { getByTestId } = render(
      <VoiceRecordingOverlay {...defaultProps} isRecording={true} />
    );

    expect(getByTestId("voice-stop-button")).toBeTruthy();
  });

  it("should show done button when not recording", () => {
    const { getByTestId } = render(
      <VoiceRecordingOverlay {...defaultProps} isRecording={false} />
    );

    expect(getByTestId("voice-done-button")).toBeTruthy();
  });

  it("should call onStop when stop button pressed", () => {
    const onStop = jest.fn();
    const { getByTestId } = render(
      <VoiceRecordingOverlay
        {...defaultProps}
        isRecording={true}
        onStop={onStop}
      />
    );

    fireEvent.press(getByTestId("voice-stop-button"));

    expect(onStop).toHaveBeenCalledTimes(1);
  });

  it("should call onCancel when cancel button pressed", () => {
    const onCancel = jest.fn();
    const { getByTestId } = render(
      <VoiceRecordingOverlay {...defaultProps} onCancel={onCancel} />
    );

    fireEvent.press(getByTestId("voice-cancel-button"));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("should call onClose when done button pressed", () => {
    const onClose = jest.fn();
    const { getByTestId } = render(
      <VoiceRecordingOverlay {...defaultProps} onClose={onClose} />
    );

    fireEvent.press(getByTestId("voice-done-button"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("should have proper accessibility labels", () => {
    const { getByTestId } = render(<VoiceRecordingOverlay {...defaultProps} />);

    const cancelButton = getByTestId("voice-cancel-button");
    expect(cancelButton.props.accessibilityLabel).toBe(
      "Cancel voice recording"
    );
    expect(cancelButton.props.accessibilityRole).toBe("button");
  });

  it("should display listening status when recording", () => {
    const { getByText } = render(
      <VoiceRecordingOverlay {...defaultProps} isRecording={true} />
    );

    expect(getByText("Listening...")).toBeTruthy();
  });

  it("should display ready status when not recording", () => {
    const { getByText } = render(
      <VoiceRecordingOverlay {...defaultProps} isRecording={false} />
    );

    expect(getByText("Ready")).toBeTruthy();
  });
});
