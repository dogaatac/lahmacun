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
