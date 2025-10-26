import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { CaptureScreen } from './src/screens/CaptureScreen';
import { SolutionScreen } from './src/screens/SolutionScreen';
import { ChatScreen } from './src/screens/ChatScreen';

const Stack = createStackNavigator();

function App(): JSX.Element {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Onboarding">
          <Stack.Screen
            name="Onboarding"
            component={OnboardingScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Home"
            component={CaptureScreen}
            options={{ title: 'Home' }}
          />
          <Stack.Screen
            name="Capture"
            component={CaptureScreen}
            options={{ title: 'Capture Problem' }}
          />
          <Stack.Screen
            name="Solution"
            component={SolutionScreen}
            options={{ title: 'Solution' }}
          />
          <Stack.Screen
            name="Chat"
            component={ChatScreen}
            options={{ title: 'Ask Questions' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default App;
