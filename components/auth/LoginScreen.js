/**
 * LoginScreen.js
 * 
 * Purpose:
 * Handles user authentication and instance configuration for the Dify mobile app.
 * Supports both cloud and self-hosted instance login flows.
 * 
 * Features:
 * - Cloud/Self-hosted instance selection
 * - Instance URL validation
 * - Secure credential handling
 * - Login state persistence
 * 
 * Technical Implementation:
 * - Uses React Native's TextInput for credential input
 * - Implements instance URL validation
 * - Manages authentication state using Auth utility
 * - Handles navigation based on login success
 * 
 * Data Flow:
 * - Validates instance URL format
 * - Stores authentication state
 * - Manages instance configuration
 * - Handles login persistence
 * 
 * Connected Components:
 * - Parent: Navigation container
 * - Next: AppListScreen (on successful login)
 * - Next: OnboardingScreen (first time users)
 * 
 * Note to LLMs:
 * If modifying this file's functionality, please update:
 * 1. The authentication logic
 * 2. The instance validation
 * 3. The navigation flow
 * 4. The error handling
 * And don't forget to update this documentation header.
 */

import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Alert,
  Modal,
} from 'react-native';
import { WebView } from 'react-native-webview';
import Icon from 'react-native-vector-icons/Ionicons';
import Auth, { INSTANCE_TYPES } from '../../utils/auth';
import Logger from '../../utils/logger';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LoginScreen = ({ navigation }) => {
  const [showWebView, setShowWebView] = useState(false);
  const [showCustomDomain, setShowCustomDomain] = useState(false);
  const [customDomain, setCustomDomain] = useState('');
  const [webViewUrl, setWebViewUrl] = useState('');
  const webViewRef = useRef(null);
  const loginProcessed = useRef(false);

  const handleCloudLogin = async () => {
    try {
      await Auth.setInstanceType(INSTANCE_TYPES.CLOUD);
      const signInUrl = Auth.getSignInUrl();
      Logger.debug('Login', 'Starting cloud login', { url: signInUrl });
      setWebViewUrl(signInUrl);
      setShowWebView(true);
    } catch (error) {
      Logger.error('Login', 'Failed to start cloud login', error);
      Alert.alert('Error', 'Failed to start login process');
    }
  };

  const handleCustomLogin = async () => {
    if (!customDomain) {
      Alert.alert('Error', 'Please enter your Dify instance domain');
      return;
    }

    try {
      const domain = customDomain.startsWith('http') 
        ? customDomain 
        : `https://${customDomain}`;
      
      await Auth.setInstanceType(INSTANCE_TYPES.CUSTOM, domain);
      const signInUrl = Auth.getSignInUrl();
      Logger.debug('Login', 'Starting custom login', { url: signInUrl });
      setWebViewUrl(signInUrl);
      setShowWebView(true);
    } catch (error) {
      Logger.error('Login', 'Failed to start custom login', error);
      Alert.alert('Error', 'Failed to start login process');
    }
  };

  const handleWebViewMessage = async (data) => {
    try {
      if (data.type === 'COOKIES') {
        const cookieString = data.cookies;
        try {
          await Auth.setCookies(cookieString);
          Logger.debug('Login', 'Cookies saved successfully');
        } catch (error) {
          Logger.error('Login', 'Error saving cookies', error);
        }
      } else if (data.type === 'API_PREFIX') {
        const { apiPrefix, publicApiPrefix } = data;
        try {
          await Auth.setApiPrefixes(apiPrefix, publicApiPrefix);
          Logger.debug('Login', 'API prefixes saved successfully');
        } catch (error) {
          Logger.error('Login', 'Error saving API prefixes', error);
        }
      }
    } catch (error) {
      Logger.error('Login', 'Error processing WebView message', error);
    }
  };

  const handleWebViewNavigation = async (navState) => {
    try {
      const { url } = navState;
      Logger.debug('Login', 'WebView navigation', { url });

      if (url) {
        try {
          const parsedUrl = new URL(url);
          if (parsedUrl.pathname === '/apps') {
            if (loginProcessed.current) return;
            loginProcessed.current = true;
            
            try {
              // Extract tokens from URL
              const urlObj = new URL(url);
              const accessToken = urlObj.searchParams.get('access_token');
              const refreshToken = urlObj.searchParams.get('refresh_token');
              
              if (accessToken) {
                await AsyncStorage.setItem('auth_token', accessToken);
                if (refreshToken) {
                  await AsyncStorage.setItem('refresh_token', refreshToken);
                }

                // Save instance information
                const isCloud = urlObj.hostname === 'cloud.dify.ai';
                const instanceType = isCloud ? INSTANCE_TYPES.CLOUD : INSTANCE_TYPES.CUSTOM;
                const baseUrl = urlObj.origin;

                await Auth.setInstanceType(instanceType);
                await Auth.setBaseUrl(baseUrl);
                
                Logger.debug('Login', 'Saved instance info', { 
                  type: instanceType,
                  baseUrl: baseUrl 
                });
              }

              // Get the API prefix
              const apiPrefix = await Auth.getApiPrefix();
              
              // Make the /apps request with the token
              const response = await fetch(`${apiPrefix}/apps`, {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${accessToken}`,
                },
              });

              if (!response.ok) {
                throw new Error(`Failed to fetch apps: ${response.status}`);
              }

              const apps = await response.json();
              Logger.debug('Login', 'Successfully fetched apps', { count: apps.length });

              await Auth.setIsAuthenticated(true);
              setShowWebView(false);
              await AsyncStorage.setItem('apps', JSON.stringify(apps));
              navigation.replace('Login');
            } catch (error) {
              Logger.error('Login', 'Failed to complete login process', error);
              Alert.alert('Error', 'Failed to complete login process');
            }
          }
        } catch (urlError) {
          // 如果 URL 解析失败，则使用字符串包含检测
          if (url.includes('/apps') && !loginProcessed.current) {
            loginProcessed.current = true;
            try {
              // Extract tokens from URL
              const urlObj = new URL(url);
              const accessToken = urlObj.searchParams.get('access_token');
              const refreshToken = urlObj.searchParams.get('refresh_token');
              
              if (accessToken) {
                await AsyncStorage.setItem('auth_token', accessToken);
                if (refreshToken) {
                  await AsyncStorage.setItem('refresh_token', refreshToken);
                }

                // Save instance information
                const isCloud = urlObj.hostname === 'cloud.dify.ai';
                const instanceType = isCloud ? INSTANCE_TYPES.CLOUD : INSTANCE_TYPES.CUSTOM;
                const baseUrl = urlObj.origin;

                await Auth.setInstanceType(instanceType);
                await Auth.setBaseUrl(baseUrl);
                
                Logger.debug('Login', 'Saved instance info', { 
                  type: instanceType,
                  baseUrl: baseUrl 
                });
              }

              // Get the API prefix
              const apiPrefix = await Auth.getApiPrefix();
              
              // Make the /apps request with the token
              const response = await fetch(`${apiPrefix}/apps`, {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${accessToken}`,
                },
              });

              if (!response.ok) {
                throw new Error(`Failed to fetch apps: ${response.status}`);
              }

              const apps = await response.json();
              Logger.debug('Login', 'Successfully fetched apps', { count: apps.length });

              await Auth.setIsAuthenticated(true);
              setShowWebView(false);
              await AsyncStorage.setItem('apps', JSON.stringify(apps));
              navigation.replace('Login');
            } catch (error) {
              Logger.error('Login', 'Failed to complete login process', error);
              Alert.alert('Error', 'Failed to complete login process');
            }
          }
        }
      }
    } catch (error) {
      Logger.error('Login', 'Error in WebView navigation', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to Dify</Text>
        <Text style={styles.subtitle}>Choose your login method</Text>

        <TouchableOpacity
          style={styles.button}
          onPress={handleCloudLogin}
        >
          <Icon name="cloud" size={24} color="#FFFFFF" />
          <Text style={styles.buttonText}>Login with Dify Cloud</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.customButton]}
          onPress={() => setShowCustomDomain(true)}
        >
          <Icon name="server" size={24} color="#FFFFFF" />
          <Text style={styles.buttonText}>Login with Self-hosted Instance</Text>
        </TouchableOpacity>
      </View>

      {/* Custom Domain Modal */}
      <Modal
        visible={showCustomDomain}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter Your Instance Domain</Text>
            <TextInput
              style={styles.input}
              value={customDomain}
              onChangeText={setCustomDomain}
              placeholder="e.g., dify.example.com"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowCustomDomain(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={() => {
                  setShowCustomDomain(false);
                  handleCustomLogin();
                }}
              >
                <Text style={styles.confirmButtonText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Login WebView */}
      <Modal
        visible={showWebView}
        animationType="slide"
        onRequestClose={() => setShowWebView(false)}
      >
        <SafeAreaView style={styles.webViewContainer}>
          <WebView
            ref={webViewRef}
            source={{ uri: webViewUrl }}
            onNavigationStateChange={handleWebViewNavigation}
            onMessage={(event) => handleWebViewMessage(JSON.parse(event.nativeEvent.data))}
            style={styles.webView}
          />
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowWebView(false)}
          >
            <Icon name="close" size={24} color="#000" />
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: 40,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
    width: '100%',
  },
  customButton: {
    backgroundColor: '#4B5563',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#1F2937',
  },
  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  confirmButton: {
    backgroundColor: '#2563EB',
  },
  cancelButtonText: {
    color: '#4B5563',
    fontSize: 14,
    fontWeight: '500',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  webViewContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  webView: {
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
});

export default LoginScreen;
