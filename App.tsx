import React, { Suspense, lazy } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ActivityIndicator, View, StyleSheet } from "react-native";

import { OnboardingScreen } from "./src/screens/OnboardingScreen";

const CaptureScreen = lazy(() =>
  import("./src/screens/CaptureScreen").then((module) => ({
    default: module.CaptureScreen,
  }))
);
const SolutionScreen = lazy(() =>
  import("./src/screens/SolutionScreen").then((module) => ({
    default: module.SolutionScreen,
  }))
);
const ChatScreen = lazy(() =>
  import("./src/screens/ChatScreen").then((module) => ({
    default: module.ChatScreen,
  }))
);

const Stack = createStackNavigator();

const LoadingFallback = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#007AFF" />
  </View>
);

function App(): JSX.Element {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Suspense fallback={<LoadingFallback />}>
          <Stack.Navigator initialRouteName="Onboarding">
            <Stack.Screen
              name="Onboarding"
              component={OnboardingScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Home"
              component={CaptureScreen}
              options={{ title: "Home" }}
            />
            <Stack.Screen
              name="Capture"
              component={CaptureScreen}
              options={{ title: "Capture Problem" }}
            />
            <Stack.Screen
              name="Solution"
              component={SolutionScreen}
              options={{ title: "Solution" }}
            />
            <Stack.Screen
              name="Chat"
              component={ChatScreen}
              options={{ title: "Ask Questions" }}
            />
          </Stack.Navigator>
        </Suspense>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
});

export default App;
