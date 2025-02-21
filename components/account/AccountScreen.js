/**
 * AccountScreen.js
 * 
 * Purpose:
 * Displays user account information and instance configuration details.
 * Provides account management functionality including logout.
 * 
 * Features:
 * - Shows instance type (cloud/self-hosted)
 * - Displays API URLs and endpoints
 * - Provides logout functionality
 * - Shows connection status
 * 
 * Technical Implementation:
 * - Uses React Native's ScrollView for content display
 * - Implements secure logout mechanism
 * - Manages instance configuration display
 * - Handles navigation state after logout
 * 
 * Data Flow:
 * - Reads instance configuration from Auth utility
 * - Manages logout state and navigation
 * - Updates UI based on instance type
 * 
 * Connected Components:
 * - Parent: Navigation container
 * - Next: LoginScreen (after logout)
 * 
 * Note to LLMs:
 * If modifying this file's functionality, please update:
 * 1. The instance information display
 * 2. The logout mechanism
 * 3. The navigation flow
 * 4. The error handling
 * And don't forget to update this documentation header.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Auth from '../../utils/auth';
import Logger from '../../utils/logger';

const AccountScreen = ({ navigation }) => {
  const [accountInfo, setAccountInfo] = useState({
    baseUrl: '',
    instanceType: '',
    apiUrl: '',
    publicApiUrl: '',
  });

  useEffect(() => {
    loadAccountInfo();
  }, []);

  const loadAccountInfo = async () => {
    try {
      const [baseUrl, instanceType, apiPrefix, publicApiPrefix] = await Promise.all([
        Auth.getBaseUrl(),
        Auth.getInstanceType(),
        Auth.getApiPrefix(),
        Auth.getPublicApiPrefix(),
      ]);
      
      const apiUrl = instanceType === 'cloud' 
        ? 'https://api.dify.ai/v1'
        : publicApiPrefix;

      setAccountInfo({
        baseUrl: baseUrl || 'Unknown',
        instanceType: instanceType || 'Unknown',
        apiUrl: apiUrl || 'Unknown',
        publicApiUrl: publicApiPrefix || 'Unknown',
      });
      
      Logger.debug('Account', 'Account info loaded', { 
        baseUrl, 
        instanceType,
        apiUrl,
        publicApiUrl: publicApiPrefix
      });
    } catch (error) {
      Logger.error('Account', 'Failed to load account info', error);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await Auth.logout();
              navigation.replace('Login');
            } catch (error) {
              Logger.error('Account', 'Failed to logout', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Instance Information</Text>
        
        <View style={styles.infoItem}>
          <Text style={styles.label}>Type:</Text>
          <Text style={styles.value}>
            {accountInfo.instanceType === 'cloud' ? 'Dify Cloud' : 'Self-hosted'}
          </Text>
        </View>

        <View style={styles.infoItem}>
          <Text style={styles.label}>Base URL:</Text>
          <Text style={styles.value}>{accountInfo.baseUrl}</Text>
        </View>

        <View style={styles.infoItem}>
          <Text style={styles.label}>API URL:</Text>
          <Text style={styles.value}>{accountInfo.apiUrl}</Text>
        </View>

        {accountInfo.instanceType !== 'cloud' && (
          <View style={styles.infoItem}>
            <Text style={styles.label}>Public API URL:</Text>
            <Text style={styles.value}>{accountInfo.publicApiUrl}</Text>
          </View>
        )}
      </View>

      <TouchableOpacity 
        style={styles.logoutButton} 
        onPress={handleLogout}
      >
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    backgroundColor: 'white',
    marginVertical: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    marginHorizontal: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  infoItem: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  label: {
    flex: 1,
    fontSize: 16,
    color: '#666',
  },
  value: {
    flex: 2,
    fontSize: 16,
    color: '#333',
  },
  logoutButton: {
    backgroundColor: '#ff3b30',
    marginHorizontal: 10,
    marginVertical: 20,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AccountScreen;
