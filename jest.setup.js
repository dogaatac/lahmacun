import "@testing-library/jest-native/extend-expect";

// Mock React Native modules
jest.mock("react-native/Libraries/Animated/NativeAnimatedHelper");

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

// Mock navigation
jest.mock("@react-navigation/native", () => {
  const actualNav = jest.requireActual("@react-navigation/native");
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
      dispatch: jest.fn(),
    }),
    useRoute: () => ({
      params: {},
    }),
    useFocusEffect: jest.fn(),
  };
});

// Mock expo-notifications
jest.mock("expo-notifications", () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn().mockResolvedValue({ granted: false, canAskAgain: true }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ granted: false, canAskAgain: true }),
  scheduleNotificationAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(),
  getAllScheduledNotificationsAsync: jest.fn(),
  AndroidNotificationPriority: {
    HIGH: "high",
  },
}));

// Mock react-native-calendar-events
jest.mock("react-native-calendar-events", () => ({
  default: {
    requestPermissions: jest.fn(),
    checkPermissions: jest.fn(),
    findCalendars: jest.fn(),
    saveCalendar: jest.fn(),
    saveEvent: jest.fn(),
    removeEvent: jest.fn(),
    fetchAllEvents: jest.fn(),
    findEventById: jest.fn(),
  },
}));

// Mock @react-native-voice/voice
jest.mock("@react-native-voice/voice", () => {
  const mockVoice = {
    onSpeechStart: null,
    onSpeechEnd: null,
    onSpeechResults: null,
    onSpeechPartialResults: null,
    onSpeechError: null,
    start: jest.fn().mockResolvedValue(undefined),
    stop: jest.fn().mockResolvedValue(undefined),
    cancel: jest.fn().mockResolvedValue(undefined),
    destroy: jest.fn().mockResolvedValue(undefined),
    isAvailable: jest.fn().mockResolvedValue(true),
  };
  return {
    __esModule: true,
    default: mockVoice,
  };
});

// Mock react-native-tts
jest.mock("react-native-tts", () => {
  const mockTts = {
    speak: jest.fn().mockResolvedValue(undefined),
    stop: jest.fn().mockResolvedValue(undefined),
    pause: jest.fn().mockResolvedValue(undefined),
    resume: jest.fn().mockResolvedValue(undefined),
    setDefaultLanguage: jest.fn(),
    setDefaultRate: jest.fn(),
    setDefaultPitch: jest.fn(),
    setDefaultVoice: jest.fn(),
    voices: jest.fn().mockResolvedValue([
      { id: "en-US", name: "English (US)", language: "en-US" },
    ]),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  };
  return {
    __esModule: true,
    default: mockTts,
  };
});

// Mock @react-native-community/slider
jest.mock("@react-native-community/slider", () => {
  const React = require("react");
  const { View } = require("react-native");
  return React.forwardRef((props, ref) => <View {...props} ref={ref} />);
});

// Global test utilities
global.mockFetch = (response) => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(response),
    })
  );
};

// Suppress console errors in tests
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
};
