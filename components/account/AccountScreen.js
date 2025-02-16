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
  });

  useEffect(() => {
    loadAccountInfo();
  }, []);

  const loadAccountInfo = async () => {
    try {
      const baseUrl = await Auth.getBaseUrl();
      const instanceType = await Auth.getInstanceType();
      
      setAccountInfo({
        baseUrl: baseUrl || 'Unknown',
        instanceType: instanceType || 'Unknown',
      });
      Logger.debug('Account', 'Account info loaded', { baseUrl, instanceType });
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
              Logger.debug('Account', 'Successfully logged out');
            } catch (error) {
              Logger.error('Account', 'Failed to logout', error);
            }
          },
        },
      ],
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Instance Information</Text>
        <View style={styles.infoItem}>
          <Text style={styles.label}>Base URL</Text>
          <Text style={styles.value}>{accountInfo.baseUrl}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.label}>Instance Type</Text>
          <Text style={styles.value}>{accountInfo.instanceType}</Text>
        </View>
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
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  infoItem: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: '#333',
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AccountScreen;
