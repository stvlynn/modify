/**
 * AppNavigator.js
 * 
 * Purpose:
 * Defines the navigation structure of the app and handles authentication state.
 * 
 * Features:
 * - Authentication state aware navigation
 * - Stack navigation configuration
 * - Screen protection based on auth state
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../components/auth/LoginScreen';
import AppListScreen from '../components/app/AppListScreen';
import AppSetupScreen from '../components/app/AppSetupScreen';
import WelcomeScreen from '../components/welcome/WelcomeScreen';
import ChatScreen from '../components/chat/ChatScreen';
import VariableEditScreen from '../components/variables/VariableEditScreen';

import Auth from '../utils/auth';
import Logger from '../utils/logger';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const [isLoading, setIsLoading] = React.useState(true);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);

  React.useEffect(() => {
    const checkAuthState = async () => {
      try {
        const isAuth = await Auth.checkAuthState();
        Logger.debug('Navigation', 'Auth state checked', { isAuthenticated: isAuth });
        setIsAuthenticated(isAuth);
      } catch (error) {
        Logger.error('Navigation', 'Failed to check auth state', error);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuthState();
  }, []);

  React.useEffect(() => {
    const interval = setInterval(async () => {
      const isAuth = await Auth.checkAuthState();
      setIsAuthenticated(isAuth);
      Logger.debug('Navigation', 'Polling auth state', { isAuthenticated: isAuth });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    // TODO: Add a proper loading screen
    return null;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
      ) : (
        <>
          <Stack.Screen
            name="AppList"
            component={AppListScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="AppSetup"
            component={AppSetupScreen}
            options={{ title: 'Add App', headerBackTitle: 'Back' }}
          />
          <Stack.Screen
            name="Welcome"
            component={WelcomeScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="VariableEdit"
            component={VariableEditScreen}
            options={{ title: 'Configure Variables', headerBackTitle: 'Back' }}
          />
          <Stack.Screen
            name="Chat"
            component={ChatScreen}
            options={{ headerShown: false }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
