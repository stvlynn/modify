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

import React, { useState, useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';

import LoginScreen from '../components/auth/LoginScreen';
import AppListScreen from '../components/app/AppListScreen';
import AccountScreen from '../components/account/AccountScreen';
import AppSetupScreen from '../components/app/AppSetupScreen';
import WelcomeScreen from '../components/welcome/WelcomeScreen';
import VariableEditScreen from '../components/variables/VariableEditScreen';
import ChatScreen from '../components/chat/ChatScreen';

import Auth from '../utils/auth';
import Logger from '../utils/logger';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const AppTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          backgroundColor: 'white',
        },
      }}
    >
      <Tab.Screen
        name="Apps"
        component={AppListScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Icon name="apps" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Account"
        component={AccountScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Icon name="person" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
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

  useEffect(() => {
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
          <Stack.Screen name="Main" component={AppTabs} />
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
