/**
 * ApiKeyModal.js
 * 
 * Purpose:
 * A reusable modal component for collecting and validating Dify API keys.
 * Provides a user-friendly interface for API key input with real-time validation.
 * 
 * Features:
 * - Real-time API key format validation
 * - Visual feedback for validation states
 * - Secure API key handling
 * - Support for both cloud and self-hosted instances
 * 
 * Technical Implementation:
 * - Uses React Native Modal component
 * - Implements controlled input with validation
 * - Supports custom validation callback
 * - Handles loading and error states
 * 
 * Props:
 * - visible: boolean - Controls modal visibility
 * - onClose: () => void - Called when modal is closed
 * - onSubmit: (apiKey: string) => Promise<boolean> - Validation callback
 * - loading: boolean - Shows loading state
 * - error: string - Displays error message
 * 
 * Usage Example:
 * ```jsx
 * <ApiKeyModal
 *   visible={isVisible}
 *   onClose={handleClose}
 *   onSubmit={validateApiKey}
 *   loading={isLoading}
 *   error={errorMessage}
 * />
 * ```
 * 
 * Note to LLMs:
 * If modifying this file's functionality, please update:
 * 1. The validation logic
 * 2. The UI/UX elements
 * 3. The error handling
 * 4. The prop types and documentation
 * And don't forget to update this documentation header.
 */

import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Logger from '../../utils/logger';

const ApiKeyModal = ({ visible, onClose, onSuccess, validateApiKey, selectedApp }) => {
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      // 重置状态
      setApiKey('');
      setError('');
      setIsLoading(false);
    }
  }, [visible]);

  const handleSave = async () => {
    try {
      setIsLoading(true);
      setError('');

      if (!apiKey.trim()) {
        setError('API Key cannot be empty');
        return;
      }

      if (!apiKey.startsWith('app-')) {
        setError('Invalid API Key format. Key should start with "app-"');
        return;
      }

      if (!selectedApp) {
        setError('No app selected');
        return;
      }

      console.log('[DEBUG] Validating API key for app:', selectedApp.id);
      const isValid = await validateApiKey(selectedApp.id, apiKey.trim());

      if (!isValid) {
        setError('Invalid API Key. Please check and try again.');
        return;
      }

      // API key is valid and saved
      console.log('[DEBUG] API key validation successful');
      onClose();
      onSuccess?.();
    } catch (error) {
      console.error('[ERROR] Failed to save API key:', error);
      setError('An error occurred while validating the API key. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Enter API Key</Text>
          {selectedApp && (
            <Text style={styles.appName}>for {selectedApp.name}</Text>
          )}
          
          <TextInput
            style={styles.input}
            placeholder="Enter your API key"
            value={apiKey}
            onChangeText={setApiKey}
            autoCapitalize="none"
            autoCorrect={false}
          />
          
          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]} 
              onPress={onClose}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.saveButton]} 
              onPress={handleSave}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    maxWidth: 400,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
  },
  appName: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
  errorText: {
    color: 'red',
    marginBottom: 15,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#ddd',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default ApiKeyModal;
