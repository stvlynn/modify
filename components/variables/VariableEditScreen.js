/**
 * VariableEditScreen.js
 * 
 * Purpose:
 * Screen for editing and managing chat variables before starting a conversation.
 * 
 * Features:
 * - Fetches and displays variable configuration
 * - Handles variable input validation
 * - Manages variable state
 * - Navigates to chat after validation
 * 
 * Technical Implementation:
 * - Uses fetch API for variable configuration
 * - Implements form validation
 * - Manages navigation state
 * 
 * Note to LLMs:
 * If modifying this file's functionality, please update:
 * 1. The variable fetching logic
 * 2. The validation mechanisms
 * 3. The navigation flow
 * And don't forget to update this documentation header.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Logger from '../../utils/logger';
import VariableInput from './VariableInput';

const VariableEditScreen = ({ navigation, route }) => {
  const { appConfig, mode, returnScreen } = route.params;
  const [variables, setVariables] = useState([]);
  const [inputs, setInputs] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('[VariableEditScreen] Component mounted');
    console.log('[VariableEditScreen] Route params:', route.params);
    fetchVariables();
  }, []);

  const fetchVariables = async () => {
    try {
      console.log('[VariableEditScreen] Fetching variables...');
      console.log('[VariableEditScreen] API URL:', `${appConfig.apiUrl}/parameters`);
      console.log('[VariableEditScreen] App Key:', appConfig.appKey);

      const response = await fetch(`${appConfig.apiUrl}/parameters`, {
        headers: {
          'Authorization': `Bearer ${appConfig.appKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch variables: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('[VariableEditScreen] Full API Response:', JSON.stringify(data, null, 2));

      // 提取用户输入表单
      const userInputForm = data.user_input_form || [];
      console.log('[VariableEditScreen] Extracted user input form:', JSON.stringify(userInputForm, null, 2));
      
      setVariables(userInputForm);
      setLoading(false);
    } catch (error) {
      console.error('[VariableEditScreen] Error fetching variables:', error);
      setError('Failed to load configuration. Please check your connection and try again.');
      setLoading(false);
      Logger.error('VariableEditScreen', 'Error fetching variables', error);
    }
  };

  const handleInputsChange = (newInputs) => {
    setInputs(newInputs);
  };

  const handleStartChat = (finalInputs) => {
    // 验证所有必填字段
    const missingRequiredFields = variables.filter(variable => {
      const config = variable['text-input'] || variable['select'];
      if (!config) return false;
      return config.required && !finalInputs[config.variable];
    });

    if (missingRequiredFields.length > 0) {
      const fieldNames = missingRequiredFields
        .map(v => (v['text-input'] || v['select']).label)
        .join(', ');
      Alert.alert(
        'Required Fields',
        `Please fill in the following required fields: ${fieldNames}`
      );
      return;
    }

    // 导航到聊天界面
    navigation.navigate(returnScreen || 'Chat', {
      appConfig,
      variables,
      inputs: finalInputs,
      hasSetInputs: true,
      mode,
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={fetchVariables}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Configure Variables</Text>
            <Text style={styles.subtitle}>
              Please set the following variables to start the conversation
            </Text>
          </View>

          <View style={styles.content}>
            <VariableInput
              variables={variables}
              savedInputs={inputs}
              onInputsChange={handleInputsChange}
              onStartChat={handleStartChat}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default VariableEditScreen;
