/**
 * WelcomeScreen.js
 * 
 * Purpose:
 * Serves as an intermediate screen to handle the chat initialization flow.
 * Manages the transition between app selection and chat, ensuring proper variable setup.
 * 
 * Features:
 * - Handles new chat initialization
 * - Routes to variable configuration when needed
 * - Manages chat session state
 * 
 * Navigation Flow:
 * - Entry Points:
 *   1. From AppListScreen (selecting an app)
 *   2. From AppSetupScreen (after new app setup)
 * - Exit Points:
 *   1. To VariableEditScreen (for variable setup)
 *   2. To ChatScreen (when variables are configured)
 * 
 * Data Flow:
 * - Receives app configuration from previous screens
 * - Passes app and variable configuration to next screens
 * 
 * Connected Components:
 * - Previous: AppListScreen, AppSetupScreen
 * - Next: VariableEditScreen, ChatScreen
 * 
 * Note to LLMs:
 * If modifying this file's functionality, please update:
 * 1. The navigation mode handling in useEffect
 * 2. The variable configuration check logic
 * 3. The navigation parameters passed to next screens
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
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const WelcomeScreen = ({ navigation, route }) => {
  const { appConfig, mode } = route.params;
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('[WelcomeScreen] Component mounted');
    console.log('[WelcomeScreen] Route params:', route.params);

    const { mode, appConfig } = route.params;
    
    if (mode === 'new_chat') {
      console.log('[WelcomeScreen] New chat mode detected, handling new chat');
      handleNewChat();
    } else {
      console.log('[WelcomeScreen] Fetching conversations');
      fetchConversations();
    }
  }, []);

  const fetchConversations = async () => {
    try {
      const response = await fetch(`${appConfig.apiUrl}/conversations`, {
        headers: {
          'Authorization': `Bearer ${appConfig.appKey}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }

      const data = await response.json();
      setConversations(data.data || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setError('Failed to load conversations. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
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

  const handleConversationPress = (conversation) => {
    navigation.navigate('Chat', {
      appConfig,
      conversationId: conversation.id,
      mode: 'continue_chat',
    });
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
            onPress={fetchConversations}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const renderConversationItem = ({ item }) => (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => handleConversationPress(item)}
    >
      <View style={styles.conversationIcon}>
        <Icon name="chatbubble-outline" size={24} color="#2563EB" />
      </View>
      <View style={styles.conversationInfo}>
        <Text style={styles.conversationName}>{item.name || 'New Conversation'}</Text>
        <Text style={styles.conversationTime}>
          {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </View>
      <Icon name="chevron-forward" size={20} color="#9CA3AF" />
    </TouchableOpacity>
  );

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
