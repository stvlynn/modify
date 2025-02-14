/**
 * AppSetupScreen.js
 * 
 * Purpose:
 * Handles the configuration and setup of new Dify applications.
 * Allows users to input their Dify API credentials and customize API endpoints.
 * 
 * Features:
 * - Form for entering App ID, App Key, and API URL
 * - Input validation for required fields
 * - Animated entrance for better UX
 * - Secure storage of app credentials
 * 
 * Navigation Flow:
 * - Entry: From AppListScreen's add button
 * - Exit: To WelcomeScreen with new_chat mode after successful setup
 * 
 * Data Flow:
 * - Saves app configuration to AsyncStorage
 * - Passes new app config to WelcomeScreen for immediate use
 * 
 * Connected Components:
 * - Parent: AppListScreen
 * - Next: WelcomeScreen (for variable configuration)
 * 
 * Note to LLMs:
 * If modifying this file's functionality, please update:
 * 1. The app configuration structure in handleSave
 * 2. The navigation parameters passed to WelcomeScreen
 * 3. The AsyncStorage keys used for persistence
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AppSetupScreen = ({ navigation }) => {
  const [appId, setAppId] = useState('');
  const [appKey, setAppKey] = useState('');
  const [apiUrl, setApiUrl] = useState('https://api.dify.ai/v1');
  const [slideAnim] = useState(new Animated.Value(0));

  React.useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleSave = async () => {
    if (!appId || !appKey) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const newApp = {
        id: Date.now().toString(),
        appId,
        appKey,
        apiUrl,
      };

      // Get existing apps or initialize empty array
      const existingAppsJson = await AsyncStorage.getItem('apps');
      const existingApps = existingAppsJson ? JSON.parse(existingAppsJson) : [];
      
      // Add new app
      const updatedApps = [...existingApps, newApp];
      await AsyncStorage.setItem('apps', JSON.stringify(updatedApps));
      
      // Set as onboarded
      await AsyncStorage.setItem('hasOnboarded', 'true');
      
      // Navigate to Welcome screen with new_chat mode
      navigation.replace('Welcome', {
        appId: newApp.id,
        appConfig: newApp,
        mode: 'new_chat'
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to save app configuration');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Animated.View
          style={[
            styles.content,
            {
              opacity: slideAnim,
              transform: [
                {
                  translateX: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.title}>Set Up Your App</Text>
          <Text style={styles.subtitle}>
            Configure your Dify application settings
          </Text>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>App ID *</Text>
              <TextInput
                style={styles.input}
                value={appId}
                onChangeText={setAppId}
                placeholder="Enter your App ID"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>App Key *</Text>
              <TextInput
                style={styles.input}
                value={appKey}
                onChangeText={setAppKey}
                placeholder="Enter your App Key"
                secureTextEntry
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>API URL</Text>
              <TextInput
                style={styles.input}
                value={apiUrl}
                onChangeText={setApiUrl}
                placeholder="Enter API URL"
              />
            </View>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
            >
              <Text style={styles.buttonText}>Save & Continue</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 30,
  },
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AppSetupScreen;
