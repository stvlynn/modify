import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'conversationStore';

const useConversationStore = create((set, get) => ({
  conversations: [],
  currentConversationId: null,
  isLoading: false,
  error: null,

  // 设置会话列表
  setConversations: (conversations) => set({ conversations }),

  // 设置当前会话ID
  setCurrentConversationId: (id) => set({ currentConversationId: id }),

  // 添加新会话
  addConversation: (conversation) => {
    const conversations = [...get().conversations];
    conversations.unshift(conversation);
    set({ conversations });
    get().persistConversations();
  },

  // 更新会话
  updateConversation: (id, updates) => {
    const conversations = get().conversations.map(conv => 
      conv.id === id ? { ...conv, ...updates } : conv
    );
    set({ conversations });
    get().persistConversations();
  },

  // 删除会话
  deleteConversation: (id) => {
    const conversations = get().conversations.filter(conv => conv.id !== id);
    set({ conversations });
    get().persistConversations();
  },

  // 持久化存储会话
  persistConversations: async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(get().conversations));
    } catch (error) {
      console.error('[ConversationStore] Error persisting conversations:', error);
    }
  },

  // 加载持久化的会话
  loadPersistedConversations: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        set({ conversations: JSON.parse(stored) });
      }
    } catch (error) {
      console.error('[ConversationStore] Error loading persisted conversations:', error);
    }
  },

  // 设置加载状态
  setLoading: (isLoading) => set({ isLoading }),

  // 设置错误状态
  setError: (error) => set({ error }),
}));

export default useConversationStore;
