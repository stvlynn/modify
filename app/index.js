import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ChatScreen from '../components/chat/ChatScreen';
import OnboardingScreen from '../components/onboarding/OnboardingScreen';
import AppSetupScreen from '../components/app/AppSetupScreen';
import AppListScreen from '../components/app/AppListScreen';
import VariableEditScreen from '../components/variables/VariableEditScreen';
import WelcomeScreen from '../components/welcome/WelcomeScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasOnboarded, setHasOnboarded] = useState(false);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const status = await AsyncStorage.getItem('hasOnboarded');
      setHasOnboarded(status === 'true');
    } catch (error) {
      console.error('Failed to get onboarding status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return null; // Or a loading screen
  }

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <Stack.Navigator
        initialRouteName={hasOnboarded ? "AppList" : "Onboarding"}
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="AppSetup" component={AppSetupScreen} />
        <Stack.Screen name="AppList" component={AppListScreen} />
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Chat" component={ChatScreen} />
        <Stack.Screen 
          name="VariableEdit" 
          component={VariableEditScreen}
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
      </Stack.Navigator>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
