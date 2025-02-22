import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Image,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import { SwipeListView } from 'react-native-swipe-list-view';
import KnowledgeBaseApiKeyModal from './KnowledgeBaseApiKeyModal';
import Logger from '../../utils/logger';

const { width } = Dimensions.get('window');

const KnowledgeBaseScreen = () => {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKeyFailureCount, setApiKeyFailureCount] = useState(0);

  const fetchDatasets = async (apiKey = null) => {
    try {
      if (!apiKey) {
        apiKey = await AsyncStorage.getItem('knowledge_base_api_key');
        if (!apiKey) {
          setShowApiKeyModal(true);
          return;
        }
      }

      const response = await fetch('https://api.dify.ai/v1/datasets?page=1&limit=20', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch datasets');
      }

      const data = await response.json();
      setDatasets(data.data);
      setApiKeyFailureCount(0); // Reset failure count on success
      Logger.info('Successfully fetched knowledge base datasets');
    } catch (error) {
      Logger.error('Error fetching datasets:', error);
      setApiKeyFailureCount(prev => {
        const newCount = prev + 1;
        if (newCount >= 3) {
          setShowApiKeyModal(true);
          return 0; // Reset count after showing modal
        }
        return newCount;
      });
      Alert.alert('Error', 'Failed to fetch knowledge base list');
    }
  };

  const deleteDataset = async (datasetId) => {
    try {
      const apiKey = await AsyncStorage.getItem('knowledge_base_api_key');
      if (!apiKey) {
        setShowApiKeyModal(true);
        return;
      }

      const response = await fetch(`https://api.dify.ai/v1/datasets/${datasetId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      if (response.status === 204) {
        Logger.info('Successfully deleted dataset:', datasetId);
        // 更新本地数据
        setDatasets(prev => prev.filter(item => item.id !== datasetId));
      } else {
        throw new Error('Failed to delete dataset');
      }
    } catch (error) {
      Logger.error('Error deleting dataset:', error);
      Alert.alert('Error', 'Failed to delete knowledge base');
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDatasets();
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchDatasets();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchDatasets();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const handleApiKeySubmit = async (apiKey) => {
    setShowApiKeyModal(false);
    await fetchDatasets(apiKey);
  };

  const confirmDelete = (datasetId, datasetName) => {
    Alert.alert(
      'Delete Knowledge Base',
      `Are you sure you want to delete "${datasetName}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteDataset(datasetId),
        },
      ],
      { cancelable: true }
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.datasetItem}>
      <View style={styles.datasetContent}>
        <View style={styles.iconContainer}>
          <Icon name="folder" size={24} color="#2563EB" />
        </View>
        <View style={styles.datasetMainContent}>
          <View style={styles.datasetHeader}>
            <Text style={styles.datasetName}>{item.name}</Text>
            <Text style={styles.datasetPermission}>{item.permission}</Text>
          </View>
          <Text style={styles.datasetDescription}>{item.description}</Text>
          <View style={styles.datasetStats}>
            <Text style={styles.statItem}>Apps: {item.app_count}</Text>
            <Text style={styles.statItem}>Documents: {item.document_count}</Text>
            <Text style={styles.statItem}>Words: {item.word_count}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderHiddenItem = ({ item }) => (
    <View style={styles.rowBack}>
      <TouchableOpacity
        style={[styles.backRightBtn, styles.backRightBtnRight]}
        onPress={() => confirmDelete(item.id, item.name)}
      >
        <Icon name="trash-outline" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <SwipeListView
        data={datasets}
        renderItem={renderItem}
        renderHiddenItem={renderHiddenItem}
        rightOpenValue={-75}
        disableRightSwipe
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No knowledge bases found</Text>
          </View>
        }
      />
      
      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={styles.fabButton}
          activeOpacity={0.8}
          onPress={() => Alert.alert('Coming Soon', 'This feature will be available soon!')}
        >
          <Text style={styles.fabText}>Create Knowledge Base</Text>
          <Image
            source={{ uri: 'https://img.icons8.com/ios-filled/50/ffffff/plus.png' }}
            style={styles.fabIcon}
          />
        </TouchableOpacity>
      </View>

      <KnowledgeBaseApiKeyModal
        visible={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
        onSubmit={handleApiKeySubmit}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  datasetItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  datasetContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#EBF5FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  datasetMainContent: {
    flex: 1,
  },
  datasetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  datasetName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  datasetPermission: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  datasetDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  datasetStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    fontSize: 12,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
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
  rowBack: {
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingLeft: 15,
    marginBottom: 12,
  },
  backRightBtn: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    position: 'absolute',
    top: 0,
    width: 75,
    borderRadius: 8,
  },
  backRightBtnRight: {
    backgroundColor: '#EF4444',
    right: 0,
  },
});

export default KnowledgeBaseScreen;
