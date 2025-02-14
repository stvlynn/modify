/**
 * VariableEditScreen.js
 * 
 * Purpose:
 * Manages the configuration of conversation variables required by Dify applications.
 * Provides an interface for users to input and validate required variables before starting a chat.
 * 
 * Features:
 * - Dynamic variable form generation based on app configuration
 * - Input validation for required fields
 * - Variable persistence between sessions
 * - Support for different variable types
 * 
 * Navigation Flow:
 * - Entry: From WelcomeScreen when starting a new chat
 * - Exit: To ChatScreen after variables are configured
 * 
 * Data Flow:
 * - Receives app configuration from WelcomeScreen
 * - Fetches variable definitions from Dify API
 * - Passes configured variables to ChatScreen
 * 
 * Connected Components:
 * - Previous: WelcomeScreen
 * - Next: ChatScreen
 * 
 * Note to LLMs:
 * If modifying this file's functionality, please update:
 * 1. The variable fetching logic
 * 2. The form generation and validation
 * 3. The variable persistence mechanism
 * 4. The navigation parameters passed to ChatScreen
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
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import VariableInput from './VariableInput';

const VariableEditScreen = ({ navigation, route }) => {
  const { appConfig, mode, onComplete, returnScreen } = route.params;
  const [variables, setVariables] = useState([]);
  const [inputs, setInputs] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('[VariableEditScreen] Component mounted');
    console.log('[VariableEditScreen] Route params:', route.params);
    fetchVariables();
  }, []);

  useEffect(() => {
    console.log('[VariableEditScreen] Variables changed:', variables);
    console.log('[VariableEditScreen] Loading state:', isLoading);
    console.log('[VariableEditScreen] Error state:', error);
    
    if (variables.length === 0 && !isLoading && !error) {
      console.log('[VariableEditScreen] No variables found, navigating to returnScreen');
      handleComplete({}, []);
    }
  }, [variables, isLoading, error]);

  const fetchVariables = async () => {
    console.log('[VariableEditScreen] Fetching variables...');
    console.log('[VariableEditScreen] API URL:', `${appConfig.apiUrl}/parameters`);
    
    try {
      const response = await fetch(`${appConfig.apiUrl}/parameters`, {
        headers: {
          'Authorization': `Bearer ${appConfig.appKey}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch variables');
      }

      const data = await response.json();
      console.log('[VariableEditScreen] API Response:', data);
      
      // 从 user_input_form 中提取变量
      const formVariables = data.user_input_form || [];
      const extractedVariables = formVariables.map(item => {
        const [type, config] = Object.entries(item)[0];
        return {
          key: config.variable,
          name: config.label,
          type: type === 'text-input' ? 'text' : type,
          required: config.required,
          options: config.options,
        };
      });
      
      console.log('[VariableEditScreen] Extracted variables:', extractedVariables);
      setVariables(extractedVariables);
      
      // Initialize inputs with empty values
      const initialInputs = {};
      extractedVariables.forEach(item => {
        initialInputs[item.key] = item.type === 'select' && item.options?.length 
          ? item.options[0].value 
          : '';
      });
      setInputs(initialInputs);
      console.log('[VariableEditScreen] Initial inputs:', initialInputs);
    } catch (error) {
      console.error('[VariableEditScreen] Error fetching variables:', error);
      setError('Failed to load configuration. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputsChange = (newInputs) => {
    setInputs(newInputs);
  };

  const handleComplete = (inputs, variables) => {
    if (returnScreen === 'Chat') {
      navigation.replace('Chat', {
        appConfig,
        variables,
        inputs,
        hasSetInputs: true,
        mode,
      });
    } else if (onComplete) {
      onComplete(variables, inputs);
    }
  };

  const handleStartChat = (newInputs) => {
    handleComplete(newInputs, variables);
  };

  if (isLoading) {
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
              canEdit={true}
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
