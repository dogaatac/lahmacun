import { Platform } from "react-native";
import Tts from "react-native-tts";
import Voice, {
  SpeechResultsEvent,
  SpeechErrorEvent,
} from "@react-native-voice/voice";

export interface VoiceTranscript {
  text: string;
  isFinal: boolean;
  timestamp: number;
}

export interface TTSOptions {
  language?: string;
  pitch?: number;
  rate?: number;
  voice?: string;
}

export interface VoiceRecordingState {
  isRecording: boolean;
  transcript: string;
  error: string | null;
}

export class VoiceServiceClass {
  private isRecording: boolean = false;
  private transcript: string = "";
  private onTranscriptUpdate?: (transcript: VoiceTranscript) => void;
  private onError?: (error: string) => void;
  private isTTSSpeaking: boolean = false;
  private currentTTSText: string = "";

  constructor() {
    this.initializeVoice();
    this.initializeTTS();
  }

  private initializeVoice(): void {
    Voice.onSpeechStart = this.onSpeechStart;
    Voice.onSpeechEnd = this.onSpeechEnd;
    Voice.onSpeechResults = this.onSpeechResults;
    Voice.onSpeechPartialResults = this.onSpeechPartialResults;
    Voice.onSpeechError = this.onSpeechError;
  }

  private initializeTTS(): void {
    Tts.setDefaultLanguage("en-US");
    Tts.setDefaultRate(1.0);
    Tts.setDefaultPitch(1.0);

    Tts.addEventListener("tts-start", () => {
      this.isTTSSpeaking = true;
    });

    Tts.addEventListener("tts-finish", () => {
      this.isTTSSpeaking = false;
      this.currentTTSText = "";
    });

    Tts.addEventListener("tts-cancel", () => {
      this.isTTSSpeaking = false;
      this.currentTTSText = "";
    });
  }

  private onSpeechStart = (): void => {
    console.log("[Voice] Speech recognition started");
  };

  private onSpeechEnd = (): void => {
    console.log("[Voice] Speech recognition ended");
    this.isRecording = false;
  };

  private onSpeechResults = (event: SpeechResultsEvent): void => {
    if (event.value && event.value.length > 0) {
      const text = event.value[0];
      this.transcript = text;

      if (this.onTranscriptUpdate) {
        this.onTranscriptUpdate({
          text,
          isFinal: true,
          timestamp: Date.now(),
        });
      }
    }
  };

  private onSpeechPartialResults = (event: SpeechResultsEvent): void => {
    if (event.value && event.value.length > 0) {
      const text = event.value[0];
      this.transcript = text;

      if (this.onTranscriptUpdate) {
        this.onTranscriptUpdate({
          text,
          isFinal: false,
          timestamp: Date.now(),
        });
      }
    }
  };

  private onSpeechError = (event: SpeechErrorEvent): void => {
    console.error("[Voice] Speech recognition error:", event.error);
    this.isRecording = false;

    if (this.onError) {
      this.onError(event.error?.message || "Speech recognition error");
    }
  };

  async startRecording(
    onUpdate: (transcript: VoiceTranscript) => void,
    onErrorCallback: (error: string) => void
  ): Promise<void> {
    try {
      this.transcript = "";
      this.onTranscriptUpdate = onUpdate;
      this.onError = onErrorCallback;

      await Voice.start("en-US");
      this.isRecording = true;
    } catch (error) {
      console.error("[Voice] Failed to start recording:", error);
      this.isRecording = false;
      onErrorCallback("Failed to start recording");
      throw error;
    }
  }

  async stopRecording(): Promise<string> {
    try {
      await Voice.stop();
      this.isRecording = false;
      return this.transcript;
    } catch (error) {
      console.error("[Voice] Failed to stop recording:", error);
      this.isRecording = false;
      throw error;
    }
  }

  async cancelRecording(): Promise<void> {
    try {
      await Voice.cancel();
      this.isRecording = false;
      this.transcript = "";
    } catch (error) {
      console.error("[Voice] Failed to cancel recording:", error);
      throw error;
    }
  }

  getRecordingState(): VoiceRecordingState {
    return {
      isRecording: this.isRecording,
      transcript: this.transcript,
      error: null,
    };
  }

  async isAvailable(): Promise<boolean> {
    try {
      const available = await Voice.isAvailable();
      return Boolean(available);
    } catch (error) {
      console.error("[Voice] Failed to check availability:", error);
      return false;
    }
  }

  async speak(text: string, options?: TTSOptions): Promise<void> {
    try {
      if (this.isTTSSpeaking) {
        await this.stopSpeaking();
      }

      this.currentTTSText = text;

      if (options?.language) {
        Tts.setDefaultLanguage(options.language);
      }
      if (options?.pitch !== undefined) {
        Tts.setDefaultPitch(options.pitch);
      }
      if (options?.rate !== undefined) {
        Tts.setDefaultRate(options.rate);
      }
      if (options?.voice) {
        Tts.setDefaultVoice(options.voice);
      }

      await Tts.speak(text);
    } catch (error) {
      console.error("[Voice] Failed to speak:", error);
      this.isTTSSpeaking = false;
      throw error;
    }
  }

  async pauseSpeaking(): Promise<void> {
    try {
      await Tts.stop();
    } catch (error) {
      console.error("[Voice] Failed to pause speech:", error);
      throw error;
    }
  }

  async resumeSpeaking(): Promise<void> {
    try {
      if (this.currentTTSText) {
        await Tts.speak(this.currentTTSText);
      }
    } catch (error) {
      console.error("[Voice] Failed to resume speech:", error);
      throw error;
    }
  }

  async stopSpeaking(): Promise<void> {
    try {
      await Tts.stop();
      this.isTTSSpeaking = false;
      this.currentTTSText = "";
    } catch (error) {
      console.error("[Voice] Failed to stop speech:", error);
      throw error;
    }
  }

  isSpeaking(): boolean {
    return this.isTTSSpeaking;
  }

  getCurrentTTSText(): string {
    return this.currentTTSText;
  }

  async getAvailableVoices(): Promise<any[]> {
    try {
      const voices = await Tts.voices();
      return voices;
    } catch (error) {
      console.error("[Voice] Failed to get available voices:", error);
      return [];
    }
  }

  async destroy(): Promise<void> {
    try {
      if (this.isRecording) {
        await this.stopRecording();
      }
      if (this.isTTSSpeaking) {
        await this.stopSpeaking();
      }
      await Voice.destroy();
    } catch (error) {
      console.error("[Voice] Failed to destroy voice service:", error);
    }
  }
}

export default new VoiceServiceClass();
