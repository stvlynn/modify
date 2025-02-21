/**
 * AppListScreen.js
 * 
 * Purpose:
 * Displays a list of available Dify applications and manages API key validation.
 * This is the main entry point after login where users can select an app to interact with.
 * 
 * Features:
 * - Lists all available Dify applications
 * - Handles API key validation and storage
 * - Manages navigation to chat interface
 * - Supports both cloud and self-hosted instances
 * 
 * Technical Implementation:
 * - Uses React Native's FlatList for efficient list rendering
 * - Implements secure API key storage using AsyncStorage
 * - Validates API keys against Dify backend
 * - Handles instance-specific API URL configuration
 * 
 * Connected Components:
 * - Parent: Navigation container
 * - Child: ApiKeyModal for API key input
 * - Next: WelcomeScreen or ChatScreen
 * 
 * Note to LLMs:
 * If modifying this file's functionality, please update:
 * 1. The API key validation logic
 * 2. The navigation flow
 * 3. The instance type handling
 * 4. The error handling mechanisms
 * And don't forget to update this documentation header.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Logger from '../../utils/logger';
import Auth from '../../utils/auth';
import ApiKeyModal from '../common/ApiKeyModal';

const AppListScreen = ({ navigation }) => {
  const [apps, setApps] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [isApiKeyModalVisible, setIsApiKeyModalVisible] = useState(false);

  const fetchApps = async () => {
    try {
      const apiPrefix = await Auth.getApiPrefix();
      const authToken = await AsyncStorage.getItem('auth_token');

      if (!authToken) {
        Logger.error('AppList', 'No auth token found');
        return;
      }

      const response = await fetch(`${apiPrefix}/apps`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch apps: ${response.status}`);
      }

      const data = await response.json();
      Logger.debug('AppList', 'Successfully fetched apps', { count: data.data.length });
      
      // Sort apps by created_at in descending order
      const sortedApps = data.data.sort((a, b) => b.created_at - a.created_at);
      setApps(sortedApps);
      
      // Store the latest apps data
      await AsyncStorage.setItem('apps', JSON.stringify(data));
    } catch (error) {
      Logger.error('AppList', 'Failed to fetch apps', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchApps();
    setRefreshing(false);
  }, []);

  // 当屏幕获得焦点时刷新一次
  useFocusEffect(
    useCallback(() => {
      fetchApps();
    }, [])
  );

  // 每10秒自动刷新一次
  useEffect(() => {
    const intervalId = setInterval(fetchApps, 10000);
    return () => clearInterval(intervalId);
  }, []);

  const handleAppPress = async (app) => {
    try {
      // 获取存储的 API Key
      const storedApiKey = await AsyncStorage.getItem(`app_${app.id}_api_key`);
      
      if (!storedApiKey) {
        // 如果没有 API Key，显示弹窗
        console.log('[DEBUG] No API Key found, showing modal');
        setSelectedApp(app);
        setIsApiKeyModalVisible(true);
        return;
      }

      // 验证 API Key
      console.log('[DEBUG] Validating stored API Key');
      const isValid = await validateApiKey(app.id, storedApiKey);

      if (!isValid) {
        // 如果 API Key 无效，显示弹窗
        console.log('[DEBUG] API Key invalid, showing modal');
        setSelectedApp(app);
        setIsApiKeyModalVisible(true);
        return;
      }

      // API Key 有效，获取 API URL
      const instanceType = await Auth.getInstanceType();
      const apiUrl = instanceType === 'cloud' 
        ? 'https://api.dify.ai/v1'
        : await Auth.getPublicApiPrefix();

      console.log('[DEBUG] API Key valid, navigating to Welcome screen');
      navigation.navigate('Welcome', {
        appId: app.id,
        appConfig: {
          apiUrl: apiUrl,
          appId: app.id,
          appKey: storedApiKey,
        },
        mode: 'new_chat',
      });
    } catch (error) {
      console.error('[ERROR] Failed to handle app press:', error);
      Alert.alert(
        'Error',
        'Failed to access the app. Please try again later.'
      );
    }
  };

  const validateApiKey = async (appId, apiKey) => {
    try {
      console.log('[DEBUG] Validating API key for app:', appId);

      // 基本格式验证
      if (!apiKey.startsWith('app-')) {
        throw new Error('Invalid API key format. API key must start with "app-"');
      }

      if (apiKey.length < 20) {
        throw new Error('Invalid API key length. API key is too short.');
      }

      // 验证 API Key 是否可用
      const instanceType = await Auth.getInstanceType();
      const apiUrl = instanceType === 'cloud' 
        ? 'https://api.dify.ai/v1'
        : await Auth.getPublicApiPrefix();

      // 测试 API Key 是否可用，尝试获取应用参数
      const response = await fetch(`${apiUrl}/parameters`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`API key validation failed: ${response.status}`);
      }

      // API Key 验证成功，保存到 AsyncStorage
      try {
        const storageKey = `app_${appId}_api_key`;
        await AsyncStorage.setItem(storageKey, apiKey);
        console.log('[DEBUG] API key saved with key:', storageKey);
      } catch (storageError) {
        Logger.error('AppList', 'Failed to save API key', storageError);
        return false;
      }

      return true;
    } catch (error) {
      Logger.error('AppList', 'Error validating API key', {
        error: error.message,
        stack: error.stack,
      });
      return false;
    }
  };

  const renderAppItem = ({ item }) => {
    const iconContent = item.icon_type === 'emoji' ? (
      <View style={[styles.iconContainer, { backgroundColor: item.icon_background }]}>
        <Text style={styles.emojiIcon}>{item.icon}</Text>
      </View>
    ) : (
      <Image
        source={{ uri: item.icon_url }}
        style={styles.imageIcon}
      />
    );

    return (
      <TouchableOpacity
        style={styles.appItem}
        onPress={() => handleAppPress(item)}
      >
        {iconContent}
        <View style={styles.appInfo}>
          <Text style={styles.appName}>{item.name}</Text>
          <Text style={styles.appDescription} numberOfLines={2}>
            {item.description || 'No description'}
          </Text>
          <Text style={styles.appMode}>{item.mode}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={apps}
        renderItem={renderAppItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContent}
      />
      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={styles.fabButton}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('AppSetup')}
        >
          <Text style={styles.fabText}>Add App</Text>
          <Image
            source={{ uri: 'https://img.icons8.com/ios-filled/50/ffffff/plus.png' }}
            style={styles.fabIcon}
          />
        </TouchableOpacity>
      </View>

      <ApiKeyModal
        visible={isApiKeyModalVisible}
        onClose={() => setIsApiKeyModalVisible(false)}
        selectedApp={selectedApp}
        validateApiKey={validateApiKey}
        onSuccess={() => {
          // 刷新应用列表
          fetchApps();
          setIsApiKeyModalVisible(false);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContent: {
    padding: 16,
  },
  appItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  emojiIcon: {
    fontSize: 24,
  },
  imageIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    marginRight: 16,
  },
  appInfo: {
    flex: 1,
  },
  appName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },
  appDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  appMode: {
    fontSize: 12,
    color: '#999',
    textTransform: 'capitalize',
  },
  fabContainer: {
    position: 'absolute',
    right: 16,
    bottom: 32,
    left: 16,
  },
  fabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  fabIcon: {
    width: 20,
    height: 20,
    tintColor: '#FFFFFF',
  },
});

export default AppListScreen;
