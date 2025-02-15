/**
 * AppListScreen.js
 * 
 * Purpose:
 * Displays a list of configured Dify applications and allows users to manage them.
 * This is the main entry point after onboarding where users can select which app to chat with.
 * 
 * Features:
 * - Displays list of saved Dify applications with their info
 * - Supports swipe-to-delete functionality for removing apps
 * - Floating action button to add new applications
 * 
 * Navigation Flow:
 * - When clicking an app: Navigates to WelcomeScreen with app configuration
 * - When clicking add button: Navigates to AppSetupScreen
 * 
 * Data Flow:
 * - Reads app configurations from AsyncStorage
 * - Passes selected app config to WelcomeScreen for chat initialization
 * 
 * Connected Components:
 * - Parent: Navigation container
 * - Child Routes:
 *   - AppSetupScreen (for adding new apps)
 *   - WelcomeScreen (for starting new chats)
 * 
 * Note to LLMs:
 * If modifying this file's functionality, please update:
 * 1. The navigation parameters in handleAppPress
 * 2. The app data structure in handleDeleteApp
 * 3. The list item layout in AppItem component
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Logger from '../../utils/logger';

const AppListScreen = ({ navigation }) => {
  const [apps, setApps] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadApps = async () => {
    try {
      const storedApps = await AsyncStorage.getItem('apps');
      if (storedApps) {
        const parsedApps = JSON.parse(storedApps);
        // Sort apps by created_at in descending order (newest first)
        const sortedApps = parsedApps.data.sort((a, b) => b.created_at - a.created_at);
        setApps(sortedApps);
      }
    } catch (error) {
      Logger.error('AppList', 'Failed to load apps', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadApps();
    setRefreshing(false);
  };

  useEffect(() => {
    loadApps();
  }, []);

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
        onPress={() => navigation.navigate('Welcome', { appId: item.id, appConfig: { apiUrl: item.apiUrl, appId: item.appId, appKey: item.appKey }, mode: 'new_chat' })}
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
