/**
 * ChatScreen.js
 * 
 * Purpose:
 * Main chat interface for interacting with Dify AI.
 * Provides a user-friendly chat experience with real-time message updates.
 * 
 * Features:
 * - Real-time message exchange with Dify AI
 * - Support for variable-based conversations
 * - Message history management
 * - Error handling and retry mechanisms
 * - Loading states and animations
 * 
 * Technical Implementation:
 * - Uses React Native's FlatList for message rendering
 * - Implements message queuing and state management
 * - Handles API communication with proper error handling
 * - Supports message markdown rendering
 * - Manages keyboard interactions
 * 
 * Data Flow:
 * - Receives app configuration and variables from previous screens
 * - Maintains chat history in local state
 * - Communicates with Dify API for message processing
 * 
 * Props (via route.params):
 * - appConfig: {
 *     apiUrl: string,
 *     appId: string,
 *     appKey: string
 *   }
 * - variables: Array<{
 *     key: string,
 *     name: string,
 *     required: boolean
 *   }>
 * - inputs: Record<string, string>
 * 
 * Connected Components:
 * - Previous: WelcomeScreen, VariableEditScreen
 * - Parent: Navigation container
 * 
 * Note to LLMs:
 * If modifying this file's functionality, please update:
 * 1. The message handling logic in sendMessage
 * 2. The chat history management
 * 3. The UI components for message display
 * 4. The API communication logic
 * And don't forget to update this documentation header.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import MarkdownDisplay from 'react-native-markdown-display';

const ChatScreen = ({ navigation, route }) => {
  const { appConfig, variables: initialVariables, inputs: initialInputs, hasSetInputs: initialHasSetInputs } = route.params;
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [slideAnim] = useState(new Animated.Value(0));
  const abortControllerRef = useRef(null);
  const messagesListRef = useRef(null);
  
  // Add variables state
  const [variables, setVariables] = useState(initialVariables || []);
  const [inputs, setInputs] = useState(initialInputs || {});
  const [hasSetInputs, setHasSetInputs] = useState(initialHasSetInputs || false);

  useEffect(() => {
    console.log('[ChatScreen] Component mounted');
    console.log('[ChatScreen] Route params:', route.params);
    console.log('[ChatScreen] Initial variables:', initialVariables);
    console.log('[ChatScreen] Initial inputs:', initialInputs);
    console.log('[ChatScreen] Initial hasSetInputs:', initialHasSetInputs);

    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // 如果有变量但未设置，返回 Welcome 页面
    if (!hasSetInputs && variables.length > 0) {
      console.log('[ChatScreen] Variables not set, redirecting to Welcome');
      navigation.replace('Welcome', {
        appConfig,
        mode: 'new_chat',
      });
      return;
    }
  }, []);

  useEffect(() => {
    // 获取变量配置
    fetchVariables();
  }, []);

  const fetchVariables = async () => {
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
      setVariables(data.prompt_variables || []);
    } catch (error) {
      console.error('Error fetching variables:', error);
    }
  };

  const handleEditVariables = () => {
    navigation.navigate('VariableEdit', {
      variables,
      savedInputs: inputs,
      onInputsChange: (newInputs) => {
        setInputs(newInputs);
      },
      onStartChat: (newInputs) => {
        setInputs(newInputs);
        setHasSetInputs(true);
      },
    });
  };

  const checkCanChat = () => {
    console.log('[ChatScreen] Checking can chat');
    console.log('[ChatScreen] Current variables:', variables);
    console.log('[ChatScreen] Current inputs:', inputs);
    console.log('[ChatScreen] Current hasSetInputs:', hasSetInputs);
    
    if (!hasSetInputs && variables.length > 0) {
      console.log('[ChatScreen] Variables not set, redirecting to Welcome');
      navigation.replace('Welcome', { appConfig, mode: 'new_chat' });
      return false;
    }
    
    if (variables.length === 0) {
      console.log('[ChatScreen] No variables required');
      return true;
    }

    const inputLens = Object.values(inputs).length;
    const promptVariablesLens = variables.length;
    const emptyInput = inputLens < promptVariablesLens || Object.values(inputs).filter(v => v === '').length > 0;
    
    if (emptyInput) {
      console.log('[ChatScreen] Empty inputs detected');
      console.error('Please fill in all required variables');
      return false;
    }
    console.log('[ChatScreen] All checks passed');
    return true;
  };

  const handleSend = async () => {
    if (!checkCanChat()) {
      return;
    }

    if (!inputText.trim() || isLoading) {
      return;
    }

    try {
      setIsLoading(true);

      // 创建新的消息
      const userMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: inputText,
        timestamp: new Date().toISOString(),
      };

      // 更新消息列表
      setMessages(prev => [...prev, userMessage]);
      setInputText('');

      // 创建 AbortController
      abortControllerRef.current = new AbortController();

      // 发送请求
      const response = await fetch(`${appConfig.apiUrl}/chat-messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${appConfig.appKey}`,
        },
        body: JSON.stringify({
          inputs,
          query: inputText,
          user: 'default',
          response_mode: 'blocking',
          conversation_id: null,
          files: []
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('[ChatScreen] API response:', data);

      // 处理响应
      const assistantMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.answer,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('[ChatScreen] Error sending message:', error);

      // 显示错误消息
      const errorMessage = {
        id: Date.now().toString(),
        role: 'error',
        content: error.message || 'Failed to send message',
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const renderMessage = ({ item }) => {
    const isUser = item.role === 'user';
    const isError = item.role === 'error';

    return (
      <View style={[
        styles.messageContainer,
        isUser ? styles.userMessage : styles.assistantMessage,
      ]}>
        <View style={[
          styles.messageContent,
          isUser ? styles.userMessageContent : styles.assistantMessageContent,
          isError && styles.errorMessage,
        ]}>
          {isError ? (
            <View style={styles.errorContent}>
              <Icon name="alert-circle-outline" size={20} color="#EF4444" />
              <Text style={styles.errorText}>{item.content}</Text>
            </View>
          ) : (
            <View style={[
              styles.messageInner,
              isUser && styles.userMessageInner
            ]}>
              {!isUser && (
                <View style={styles.messageIcon}>
                  <View style={styles.assistantIcon}>
                    <Text style={styles.assistantIconText}>🤖</Text>
                  </View>
                </View>
              )}
              <View style={[
                styles.messageBubble,
                isUser ? styles.userBubble : styles.assistantBubble,
              ]}>
                <MarkdownDisplay style={isUser ? styles.userMessageText : styles.assistantMessageText}>
                  {item.content}
                </MarkdownDisplay>
              </View>
              {isUser && (
                <View style={styles.messageIcon}>
                  <View style={styles.userIcon} />
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    );
  };

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => variables.length > 0 ? (
        <TouchableOpacity 
          onPress={handleEditVariables}
          style={styles.headerButton}
        >
          <Icon name="settings-outline" size={24} color="#1F2937" />
        </TouchableOpacity>
      ) : null,
    });
  }, [navigation, variables, inputs]);

  const userMarkdownStyles = {
    body: {
      color: '#FFFFFF',
      fontSize: 15,
    },
    paragraph: {
      marginVertical: 0,
    },
    link: {
      color: '#E5E7EB',
    },
  };

  const botMarkdownStyles = {
    body: {
      color: '#1F2937',
      fontSize: 15,
    },
    paragraph: {
      marginVertical: 0,
    },
    link: {
      color: '#2563EB',
    },
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="chevron-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chat</Text>
        <View style={styles.backButton} />
      </View>

      {variables.length > 0 && !hasSetInputs ? (
        <View style={styles.variablePrompt}>
          <Text style={styles.variablePromptText}>
            Please set the required variables before starting the chat
          </Text>
          <TouchableOpacity
            style={styles.variablePromptButton}
            onPress={handleEditVariables}
          >
            <Text style={styles.variablePromptButtonText}>Set Variables</Text>
            <Icon name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            style={styles.messagesList}
            contentContainerStyle={styles.messagesContainer}
            inverted={false}
            onContentSizeChange={() => {
              messagesListRef.current?.scrollToEnd({ animated: true });
            }}
            ref={messagesListRef}
          />

          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Type your message..."
                multiline
                maxHeight={100}
              />
              <TouchableOpacity
                style={styles.sendButton}
                onPress={handleSend}
                disabled={isLoading}
              >
                <Icon
                  name={isLoading ? 'hourglass-outline' : 'send'}
                  size={24}
                  color="#fff"
                />
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}
      {Platform.OS === 'ios' && <View style={styles.homeBarSpace} />}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    textAlign: 'center',
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  messageContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  messageInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  userMessageInner: {
    justifyContent: 'flex-end',
  },
  messageIcon: {
    width: 32,
    height: 32,
    marginHorizontal: 12,
  },
  userIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
  },
  assistantIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EBF5FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  assistantIconText: {
    fontSize: 20,
  },
  messageBubble: {
    flex: 1,
    padding: 12,
    borderRadius: 16,
    maxWidth: '85%',
  },
  userBubble: {
    backgroundColor: 'rgb(225, 239, 254)',
  },
  assistantBubble: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  userMessageText: {
    color: '#111827',
    fontSize: 14,
    lineHeight: 20,
  },
  assistantMessageText: {
    color: '#111827',
    fontSize: 14,
    lineHeight: 20,
  },
  errorMessage: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 8,
  },
  errorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  errorText: {
    color: '#EF4444',
    marginLeft: 8,
    fontSize: 14,
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: '#1F2937',
    maxHeight: 100,
    paddingTop: 8,
    paddingBottom: 8,
    paddingRight: 8,
  },
  sendButton: {
    height: 32,
    paddingHorizontal: 12,
    backgroundColor: '#2563EB',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  sendIcon: {
    color: '#FFFFFF',
  },
  homeBarSpace: {
    height: 34,
    backgroundColor: '#fff',
  },
  editButton: {
    padding: 8,
  },
  variablePrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  variablePromptText: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    marginBottom: 20,
  },
  variablePromptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  variablePromptButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
});

export default ChatScreen;
