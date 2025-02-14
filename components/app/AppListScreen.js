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
  TouchableOpacity,
  StyleSheet,
  Alert,
  Animated,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import { SwipeListView } from 'react-native-swipe-list-view';

const AppItem = ({ item }) => {
  const appInfo = item.site_info || {};
  return (
    <View style={styles.appItem}>
      <View style={styles.appIconContainer}>
        <View style={styles.appIcon}>
          <Text style={styles.appIconText}>🤖</Text>
        </View>
      </View>
      <View style={styles.appInfo}>
        <Text style={styles.appName}>{appInfo.title || 'Untitled App'}</Text>
        <Text 
          style={styles.appDescription}
          numberOfLines={2}
        >
          {appInfo.description || 'No description'}
        </Text>
      </View>
      <Icon name="chevron-forward" size={20} color="#6B7280" />
    </View>
  );
};

const AppListScreen = ({ navigation }) => {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadApps();
  }, []);

  const loadApps = async () => {
    try {
      setLoading(true);
      const appsJson = await AsyncStorage.getItem('apps');
      if (appsJson) {
        setApps(JSON.parse(appsJson));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load apps');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteApp = (appId) => {
    Alert.alert(
      'Delete App',
      'Are you sure you want to delete this app?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedApps = apps.filter(app => app.id !== appId);
              await AsyncStorage.setItem('apps', JSON.stringify(updatedApps));
              setApps(updatedApps);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete app');
            }
          },
        },
      ],
    );
  };

  const handleAppPress = (app) => {
    console.log('[AppListScreen] App selected:', app);
    navigation.navigate('Welcome', {
      appId: app.id,
      appConfig: {
        apiUrl: app.apiUrl,
        appId: app.appId,
        appKey: app.appKey
      },
      mode: 'new_chat',
    });
  };

  const renderHiddenItem = (data) => (
    <View style={styles.rowBack}>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteApp(data.item.id)}
      >
        <Icon name="trash-outline" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Applications</Text>
      </View>
      <SwipeListView
        data={apps}
        renderItem={({ item }) => (
          <TouchableOpacity 
            activeOpacity={0.7}
            onPress={() => handleAppPress(item)}
          >
            <View style={styles.rowFront}>
              <AppItem item={item} />
            </View>
          </TouchableOpacity>
        )}
        renderHiddenItem={renderHiddenItem}
        rightOpenValue={-75}
        disableRightSwipe
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
      />
      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={styles.fabButton}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('AppSetup')}
        >
          <Text style={styles.fabText}>Add App</Text>
          <Icon name="add" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    height: 44,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  rowFront: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  rowBack: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    borderRadius: 12,
    marginBottom: 12,
    paddingRight: 15,
    height: '100%',
    width: '100%',
  },
  deleteButton: {
    width: 75,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
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
  appItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  appIconContainer: {
    marginRight: 12,
  },
  appIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#EBF5FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  appIconText: {
    fontSize: 20,
  },
  appInfo: {
    flex: 1,
    marginRight: 8,
  },
  appName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  appDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
});

export default AppListScreen;
