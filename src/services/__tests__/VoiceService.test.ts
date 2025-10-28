import VoiceService from "../VoiceService";
import Voice from "@react-native-voice/voice";
import Tts from "react-native-tts";

jest.mock("@react-native-voice/voice");
jest.mock("react-native-tts");

describe("VoiceService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Speech Recognition", () => {
    it("should check if voice is available", async () => {
      (Voice.isAvailable as jest.Mock).mockResolvedValue(true);

      const available = await VoiceService.isAvailable();

      expect(available).toBe(true);
      expect(Voice.isAvailable).toHaveBeenCalled();
    });

    it("should start recording", async () => {
      const onUpdate = jest.fn();
      const onError = jest.fn();

      await VoiceService.startRecording(onUpdate, onError);

      expect(Voice.start).toHaveBeenCalledWith("en-US");
    });

    it("should stop recording", async () => {
      const onUpdate = jest.fn();
      const onError = jest.fn();

      await VoiceService.startRecording(onUpdate, onError);
      const transcript = await VoiceService.stopRecording();

      expect(Voice.stop).toHaveBeenCalled();
      expect(typeof transcript).toBe("string");
    });

    it("should cancel recording", async () => {
      await VoiceService.cancelRecording();

      expect(Voice.cancel).toHaveBeenCalled();
    });

    it("should handle recording errors", async () => {
      const onUpdate = jest.fn();
      const onError = jest.fn();
      const error = new Error("Recording failed");

      (Voice.start as jest.Mock).mockRejectedValue(error);

      await expect(
        VoiceService.startRecording(onUpdate, onError)
      ).rejects.toThrow("Recording failed");
    });
  });

  describe("Text-to-Speech", () => {
    it("should speak text", async () => {
      await VoiceService.speak("Hello world");

      expect(Tts.speak).toHaveBeenCalledWith("Hello world");
    });

    it("should speak with custom options", async () => {
      const options = {
        language: "en-GB",
        rate: 1.5,
        pitch: 1.2,
      };

      await VoiceService.speak("Test", options);

      expect(Tts.setDefaultLanguage).toHaveBeenCalledWith("en-GB");
      expect(Tts.setDefaultRate).toHaveBeenCalledWith(1.5);
      expect(Tts.setDefaultPitch).toHaveBeenCalledWith(1.2);
      expect(Tts.speak).toHaveBeenCalledWith("Test");
    });

    it("should stop speaking", async () => {
      await VoiceService.stopSpeaking();

      expect(Tts.stop).toHaveBeenCalled();
    });

    it("should pause speaking", async () => {
      await VoiceService.pauseSpeaking();

      expect(Tts.stop).toHaveBeenCalled();
    });

    it("should resume speaking", async () => {
      await VoiceService.speak("Test");
      await VoiceService.resumeSpeaking();

      expect(Tts.speak).toHaveBeenCalled();
    });

    it("should get available voices", async () => {
      const mockVoices = [
        { id: "en-US", name: "English (US)", language: "en-US" },
      ];

      (Tts.voices as jest.Mock).mockResolvedValue(mockVoices);

      const voices = await VoiceService.getAvailableVoices();

      expect(voices).toEqual(mockVoices);
      expect(Tts.voices).toHaveBeenCalled();
    });
  });

  describe("State Management", () => {
    it("should track recording state", () => {
      const state = VoiceService.getRecordingState();

      expect(state).toHaveProperty("isRecording");
      expect(state).toHaveProperty("transcript");
      expect(state).toHaveProperty("error");
    });

    it("should track speaking state", () => {
      const isSpeaking = VoiceService.isSpeaking();

      expect(typeof isSpeaking).toBe("boolean");
    });

    it("should get current TTS text", () => {
      const text = VoiceService.getCurrentTTSText();

      expect(typeof text).toBe("string");
    });
  });

  describe("Cleanup", () => {
    it("should destroy voice service", async () => {
      await VoiceService.destroy();

      expect(Voice.destroy).toHaveBeenCalled();
    });
  });
});
