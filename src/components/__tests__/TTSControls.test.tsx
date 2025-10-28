import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { TTSControls } from "../TTSControls";
import VoiceService from "../../services/VoiceService";

jest.mock("../../services/VoiceService");

describe("TTSControls", () => {
  const defaultProps = {
    text: "This is a test text to be read aloud",
    visible: true,
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render when visible", () => {
    const { getByTestId } = render(<TTSControls {...defaultProps} />);

    expect(getByTestId("tts-controls-modal")).toBeTruthy();
  });

  it("should not render when not visible", () => {
    const { queryByTestId } = render(
      <TTSControls {...defaultProps} visible={false} />
    );

    const modal = queryByTestId("tts-controls-modal");
    expect(modal?.props.visible).toBe(false);
  });

  it("should display the text to be read", () => {
    const { getByText } = render(<TTSControls {...defaultProps} />);

    expect(getByText(defaultProps.text)).toBeTruthy();
  });

  it("should show play button initially", () => {
    const { getByTestId } = render(<TTSControls {...defaultProps} />);

    expect(getByTestId("tts-play-button")).toBeTruthy();
  });

  it("should call VoiceService.speak when play is pressed", async () => {
    const { getByTestId } = render(<TTSControls {...defaultProps} />);

    fireEvent.press(getByTestId("tts-play-button"));

    await waitFor(() => {
      expect(VoiceService.speak).toHaveBeenCalledWith(
        defaultProps.text,
        expect.any(Object)
      );
    });
  });

  it("should call VoiceService.stopSpeaking when stop is pressed", async () => {
    const { getByTestId } = render(<TTSControls {...defaultProps} />);

    fireEvent.press(getByTestId("tts-play-button"));

    await waitFor(() => {
      expect(getByTestId("tts-stop-button")).toBeTruthy();
    });

    fireEvent.press(getByTestId("tts-stop-button"));

    expect(VoiceService.stopSpeaking).toHaveBeenCalled();
  });

  it("should call onClose when close button pressed", async () => {
    const onClose = jest.fn();
    const { getByTestId } = render(
      <TTSControls {...defaultProps} onClose={onClose} />
    );

    fireEvent.press(getByTestId("tts-close-button"));

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("should have rate slider", () => {
    const { getByTestId } = render(<TTSControls {...defaultProps} />);

    expect(getByTestId("tts-rate-slider")).toBeTruthy();
  });

  it("should have pitch slider", () => {
    const { getByTestId } = render(<TTSControls {...defaultProps} />);

    expect(getByTestId("tts-pitch-slider")).toBeTruthy();
  });

  it("should stop speaking when rate changes", async () => {
    const { getByTestId } = render(<TTSControls {...defaultProps} />);

    fireEvent.press(getByTestId("tts-play-button"));

    await waitFor(() => {
      expect(VoiceService.speak).toHaveBeenCalled();
    });

    const rateSlider = getByTestId("tts-rate-slider");
    fireEvent(rateSlider, "onValueChange", 1.5);

    expect(VoiceService.stopSpeaking).toHaveBeenCalled();
  });

  it("should autoplay when autoPlay prop is true", async () => {
    render(<TTSControls {...defaultProps} autoPlay={true} />);

    await waitFor(() => {
      expect(VoiceService.speak).toHaveBeenCalledWith(
        defaultProps.text,
        expect.any(Object)
      );
    });
  });

  it("should have proper accessibility labels", () => {
    const { getByTestId } = render(<TTSControls {...defaultProps} />);

    const playButton = getByTestId("tts-play-button");
    expect(playButton.props.accessibilityLabel).toBe("Play");
    expect(playButton.props.accessibilityRole).toBe("button");
    expect(playButton.props.accessibilityHint).toBe(
      "Starts reading the text aloud"
    );
  });

  it("should cleanup on unmount", () => {
    const { unmount } = render(<TTSControls {...defaultProps} />);

    unmount();

    expect(VoiceService.stopSpeaking).toHaveBeenCalled();
  });

  it("should display custom title", () => {
    const { getByText } = render(
      <TTSControls {...defaultProps} title="Custom Title" />
    );

    expect(getByText("Custom Title")).toBeTruthy();
  });
});
