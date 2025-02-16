/**
 * auth.js
 * 
 * Purpose:
 * Manages authentication state and provides methods for Dify login.
 * Handles both cloud and self-hosted Dify instances.
 * 
 * Features:
 * - Authentication state management
 * - Token persistence
 * - Instance type tracking (cloud vs self-hosted)
 * - API prefix management
 * - Cookie management
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import Logger from './logger';

// Storage keys
const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  INSTANCE_URL: 'instance_url',
  INSTANCE_TYPE: 'instance_type',
  API_PREFIX: 'api_prefix',
  PUBLIC_API_PREFIX: 'public_api_prefix',
  COOKIES: 'auth_cookies',
  BASE_URL: 'base_url',
};

// Instance types
const INSTANCE_TYPES = {
  CLOUD: 'cloud',
  CUSTOM: 'custom',
};

// Default cloud instance URL
const CLOUD_INSTANCE_URL = 'https://cloud.dify.ai';

class Auth {
  static isAuthenticated = false;
  static instanceUrl = CLOUD_INSTANCE_URL;
  static instanceType = '';
  static apiPrefix = '';
  static publicApiPrefix = '';
  static cookies = '';
  static baseUrl = '';

  static async initialize() {
    try {
      const [token, refreshToken, url, type, apiPrefix, publicApiPrefix, cookies, baseUrl] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.INSTANCE_URL),
        AsyncStorage.getItem(STORAGE_KEYS.INSTANCE_TYPE),
        AsyncStorage.getItem(STORAGE_KEYS.API_PREFIX),
        AsyncStorage.getItem(STORAGE_KEYS.PUBLIC_API_PREFIX),
        AsyncStorage.getItem(STORAGE_KEYS.COOKIES),
        AsyncStorage.getItem(STORAGE_KEYS.BASE_URL),
      ]);

      Logger.debug('Auth', 'Initializing auth state', { 
        hasToken: !!token,
        hasRefreshToken: !!refreshToken,
        url,
        type,
        apiPrefix,
        publicApiPrefix,
        hasCookies: !!cookies,
        baseUrl,
      });

      this.isAuthenticated = !!token && !!cookies;
      this.instanceUrl = url || CLOUD_INSTANCE_URL;
      this.instanceType = type || INSTANCE_TYPES.CLOUD;
      this.apiPrefix = apiPrefix || '';
      this.publicApiPrefix = publicApiPrefix || '';
      this.cookies = cookies || '';
      this.baseUrl = baseUrl || '';

      if (token) {
        // Check token expiration
        try {
          const tokenData = JSON.parse(atob(token.split('.')[1]));
          const expirationTime = tokenData.exp * 1000; // Convert to milliseconds
          
          if (expirationTime <= Date.now()) {
            Logger.debug('Auth', 'Token expired, attempting refresh');
            if (refreshToken) {
              await this.refreshAuthToken(refreshToken);
            } else {
              await this.logout();
            }
          }
        } catch (error) {
          Logger.error('Auth', 'Failed to parse token', error);
          await this.logout();
        }
      }

      return this.isAuthenticated;
    } catch (error) {
      Logger.error('Auth', 'Failed to initialize auth', error);
      return false;
    }
  }

  static async setApiPrefix(apiPrefix, publicApiPrefix) {
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.API_PREFIX, apiPrefix),
        AsyncStorage.setItem(STORAGE_KEYS.PUBLIC_API_PREFIX, publicApiPrefix || apiPrefix),
      ]);
      this.apiPrefix = apiPrefix;
      this.publicApiPrefix = publicApiPrefix || apiPrefix;
      Logger.debug('Auth', 'API prefixes set', { apiPrefix, publicApiPrefix });
    } catch (error) {
      Logger.error('Auth', 'Failed to set API prefixes', error);
      throw error;
    }
  }

  static async getApiPrefix() {
    // Return the API prefix if already set, otherwise use a default value
    if (!this.apiPrefix) {
      this.apiPrefix = `${CLOUD_INSTANCE_URL}/console/api`;
    }
    return this.apiPrefix;
  }

  static async getPublicApiPrefix() {
    return this.publicApiPrefix || this.apiPrefix || '';
  }

  static async setAuthTokens(accessToken, refreshToken) {
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, accessToken),
        AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken),
      ]);
      this.isAuthenticated = true;
      Logger.debug('Auth', 'Auth tokens set');
    } catch (error) {
      Logger.error('Auth', 'Failed to set auth tokens', error);
      throw error;
    }
  }

  static async refreshAuthToken(refreshToken) {
    try {
      const response = await fetch(`${this.apiPrefix}/oauth/token/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh_token: refreshToken,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();
      await this.setAuthTokens(data.access_token, data.refresh_token);
      return true;
    } catch (error) {
      Logger.error('Auth', 'Failed to refresh token', error);
      await this.logout();
      return false;
    }
  }

  static async setCookies(cookieString) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.COOKIES, cookieString);
      this.cookies = cookieString;
      this.isAuthenticated = true;
      Logger.debug('Auth', 'Cookies set');
    } catch (error) {
      Logger.error('Auth', 'Failed to set cookies', error);
      throw error;
    }
  }

  static async getCookies() {
    return this.cookies || '';
  }

  static async getInstanceType() {
    try {
      const type = await AsyncStorage.getItem(STORAGE_KEYS.INSTANCE_TYPE);
      Logger.debug('Auth', 'Getting instance type', { type });
      return type || '';
    } catch (error) {
      Logger.error('Auth', 'Failed to get instance type', error);
      return '';
    }
  }

  static async setInstanceType(type) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.INSTANCE_TYPE, type);
      this.instanceType = type;
      Logger.debug('Auth', 'Instance type set', { type });
    } catch (error) {
      Logger.error('Auth', 'Failed to set instance type', error);
    }
  }

  static async getBaseUrl() {
    try {
      const baseUrl = await AsyncStorage.getItem(STORAGE_KEYS.BASE_URL);
      Logger.debug('Auth', 'Getting base url', { baseUrl });
      return baseUrl || '';
    } catch (error) {
      Logger.error('Auth', 'Failed to get base url', error);
      return '';
    }
  }

  static async setBaseUrl(url) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.BASE_URL, url);
      this.baseUrl = url;
      Logger.debug('Auth', 'Base url set', { url });
    } catch (error) {
      Logger.error('Auth', 'Failed to set base url', error);
    }
  }

  static async logout() {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.AUTH_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.INSTANCE_URL,
        STORAGE_KEYS.INSTANCE_TYPE,
        STORAGE_KEYS.API_PREFIX,
        STORAGE_KEYS.PUBLIC_API_PREFIX,
        STORAGE_KEYS.COOKIES,
        STORAGE_KEYS.BASE_URL,
        'apps',
        'isAuthenticated',
      ]);
      this.isAuthenticated = false;
      this.instanceType = '';
      this.apiPrefix = '';
      this.publicApiPrefix = '';
      this.cookies = '';
      this.baseUrl = '';
      Logger.debug('Auth', 'Logged out successfully');
    } catch (error) {
      Logger.error('Auth', 'Failed to logout', error);
      throw error;
    }
  }

  static async checkAuthState() {
    const stored = await AsyncStorage.getItem('isAuthenticated');
    if (stored !== null) {
      this.isAuthenticated = stored === 'true';
    }
    return this.isAuthenticated === true;
  }

  static async setIsAuthenticated(value) {
    this.isAuthenticated = value;
    await AsyncStorage.setItem('isAuthenticated', value ? 'true' : 'false');
  }

  static getSignInUrl() {
    // Assuming cloud login URL is constructed based on the CLOUD_INSTANCE_URL
    return `${CLOUD_INSTANCE_URL}/signin`;
  }

  static async getToken() {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      return token;
    } catch (error) {
      Logger.error('Auth', 'Failed to get token', error);
      return null;
    }
  }
}

export { INSTANCE_TYPES, CLOUD_INSTANCE_URL };
export default Auth;
