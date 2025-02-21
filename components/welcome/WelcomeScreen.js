/**
 * WelcomeScreen.js
 * 
 * Purpose:
 * Serves as an intermediary screen between app selection and chat.
 * Handles variable configuration and chat initialization.
 * 
 * Features:
 * - Displays app welcome message
 * - Manages variable configuration
 * - Handles new chat creation
 * - Supports conversation history
 * 
 * Technical Implementation:
 * - Uses React Native's ScrollView for content display
 * - Implements variable validation
 * - Manages navigation state and history
 * - Handles chat initialization
 * 
 * Data Flow:
 * - Receives app configuration from AppListScreen
 * - Manages variable states
 * - Initializes chat sessions
 * - Handles navigation to chat
 * 
 * Props (via route.params):
 * - appConfig: {
 *     apiUrl: string,
 *     appId: string,
 *     appKey: string
 *   }
 * - mode: 'new_chat' | 'continue'
 * 
 * Connected Components:
 * - Previous: AppListScreen
 * - Next: ChatScreen
 * - Alternative: VariableEditScreen
 * 
 * Note to LLMs:
 * If modifying this file's functionality, please update:
 * 1. The variable handling logic
 * 2. The navigation flow
 * 3. The chat initialization
 * 4. The error handling
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
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useConversationStore from '../../hooks/use-conversation-store';

// 获取设备ID作为用户标识
const getDeviceId = async () => {
  try {
    // 优先从存储中获取
    const storedId = await AsyncStorage.getItem('deviceId');
    if (storedId) {
      return storedId;
    }

    // 如果没有存储的ID，生成一个新的UUID
    const newId = 'device-' + Math.random().toString(36).substring(2, 15) + 
                 Math.random().toString(36).substring(2, 15);
    await AsyncStorage.setItem('deviceId', newId);
    return newId;
  } catch (error) {
    console.error('[getDeviceId] Error:', error);
    // 如果出错，返回一个临时ID
    return `temp-${Date.now()}`;
  }
};

const WelcomeScreen = ({ navigation, route }) => {
  const { appConfig, mode } = route.params;
  const [refreshing, setRefreshing] = useState(false);
  const {
    conversations,
    isLoading,
    error,
    setConversations,
    setLoading,
    setError,
    deleteConversation: storeDeleteConversation,
  } = useConversationStore();

  useEffect(() => {
    console.log('[WelcomeScreen] Component mounted');
    console.log('[WelcomeScreen] Route params:', route.params);

    const { mode, appConfig } = route.params;
    
    if (mode === 'new_chat') {
      console.log('[WelcomeScreen] New chat mode detected, handling new chat');
      handleNewChat();
    } else {
      console.log('[WelcomeScreen] Fetching initial conversations');
      fetchConversations();
    }

    // 添加导航焦点监听器
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('[WelcomeScreen] Screen focused, refreshing conversations');
      fetchConversations();
    });

    return () => {
      console.log('[WelcomeScreen] Component unmounting, cleaning up listeners');
      unsubscribe();
    };
  }, []);

  const fetchConversations = async () => {
    try {
      console.log('[WelcomeScreen] Starting to fetch conversations');
      console.log('[WelcomeScreen] App config:', {
        apiUrl: appConfig.apiUrl,
        appId: appConfig.appId,
        name: appConfig.name
      });
      
      setLoading(true);
      
      // 获取设备ID
      const deviceId = await getDeviceId();
      console.log('[WelcomeScreen] Using device ID:', deviceId);

      const queryParams = new URLSearchParams({
        user: deviceId,
        limit: '20'
      }).toString();

      console.log('[WelcomeScreen] Fetching from URL:', `${appConfig.apiUrl}/conversations?${queryParams}`);

      const response = await fetch(`${appConfig.apiUrl}/conversations?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${appConfig.appKey}`,
        },
      });
      
      console.log('[WelcomeScreen] API response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch conversations: ${response.status}`);
      }

      const data = await response.json();
      console.log('[WelcomeScreen] Fetched conversations count:', (data.data || []).length);
      console.log('[WelcomeScreen] First conversation:', data.data?.[0] || 'No conversations');
      
      setConversations(data.data || []);
      setError(null);
      
      console.log('[WelcomeScreen] Successfully updated conversations in store');
    } catch (error) {
      console.error('[WelcomeScreen] Error fetching conversations:', error);
      console.error('[WelcomeScreen] Error details:', {
        message: error.message,
        stack: error.stack
      });
      
      setError('Failed to load conversations. Please check your connection and try again.');
    } finally {
      console.log('[WelcomeScreen] Fetch operation completed');
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleNewChat = () => {
    console.log('[WelcomeScreen] Handling new chat');
    const { appConfig } = route.params;
    navigation.navigate('VariableEdit', {
      appConfig: appConfig || {},
      mode: 'new_chat',
      returnScreen: 'Chat',
    });
  };

  const handleConversationPress = async (conversation) => {
    try {
      console.log('[WelcomeScreen] Opening conversation:', {
        id: conversation.id,
        name: conversation.name,
        updatedAt: conversation.updated_at
      });
      
      navigation.navigate('Chat', {
        appConfig,
        conversationId: conversation.id,
        mode: 'continue',
        inputs: conversation.inputs || {},
      });
    } catch (error) {
      console.error('[WelcomeScreen] Error opening conversation:', error);
      console.error('[WelcomeScreen] Error details:', {
        message: error.message,
        stack: error.stack
      });
      
      Alert.alert('Error', 'Failed to open conversation. Please try again.');
    }
  };

  const handleDeleteConversation = async (conversation) => {
    try {
      console.log('[WelcomeScreen] Deleting conversation:', {
        id: conversation.id,
        name: conversation.name
      });
      
      const deviceId = await getDeviceId();
      console.log('[WelcomeScreen] Using device ID for deletion:', deviceId);
      
      const deleteUrl = `${appConfig.apiUrl}/conversations/${conversation.id}`;
      console.log('[WelcomeScreen] Delete URL:', deleteUrl);
      
      const response = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${appConfig.appKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user: deviceId,
        }),
      });

      console.log('[WelcomeScreen] Delete response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Failed to delete conversation: ${response.status}`);
      }

      // 从 store 中删除会话
      console.log('[WelcomeScreen] Removing conversation from store');
      storeDeleteConversation(conversation.id);
      
      // 刷新会话列表
      console.log('[WelcomeScreen] Refreshing conversations after deletion');
      fetchConversations();
      
      console.log('[WelcomeScreen] Successfully deleted conversation');
    } catch (error) {
      console.error('[WelcomeScreen] Error deleting conversation:', error);
      console.error('[WelcomeScreen] Error details:', {
        message: error.message,
        stack: error.stack
      });
      
      Alert.alert('Error', 'Failed to delete conversation. Please try again.');
    }
  };

  const renderConversationItem = ({ item }) => (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => handleConversationPress(item)}
    >
      <View style={styles.conversationIcon}>
        <Icon name="chatbubble-outline" size={24} color="#2563EB" />
      </View>
      <View style={styles.conversationInfo}>
        <Text style={styles.conversationName} numberOfLines={1}>
          {item.name || 'New Conversation'}
        </Text>
        <Text style={styles.conversationTime}>
          {new Date(item.updated_at * 1000).toLocaleDateString()}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => {
          Alert.alert(
            'Delete Conversation',
            'Are you sure you want to delete this conversation?',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => handleDeleteConversation(item) },
            ]
          );
        }}
      >
        <Icon name="trash-outline" size={20} color="#EF4444" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (isLoading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={fetchConversations}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{appConfig.name || 'Chat Assistant'}</Text>
        <TouchableOpacity
          style={styles.newChatButton}
          onPress={handleNewChat}
        >
          <Icon name="add" size={24} color="#FFFFFF" />
          <Text style={styles.newChatButtonText}>New Chat</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={conversations}
        renderItem={renderConversationItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchConversations();
            }}
          />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Icon name="chatbubbles-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyText}>No conversations yet</Text>
            <Text style={styles.emptySubtext}>Start a new chat to begin</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
  },
  newChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  newChatButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  listContent: {
    padding: 16,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  conversationIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#EBF5FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  conversationInfo: {
    flex: 1,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
  conversationTime: {
    fontSize: 14,
    color: '#6B7280',
  },
  deleteButton: {
    marginLeft: 12,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
  },
});

export default WelcomeScreen;
