/**
 * logger.js
 * 
 * Purpose:
 * Provides centralized logging functionality with different log levels and categories.
 * Can be disabled in production environment.
 * 
 * Features:
 * - Different log levels (debug, info, warn, error)
 * - Category-based logging
 * - Network request/response logging
 * - Production mode toggle
 */

// 是否启用日志
const ENABLE_LOGGING = __DEV__;

// 日志级别
const LOG_LEVELS = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  NETWORK: 'NETWORK'
};

class Logger {
  static isEnabled = ENABLE_LOGGING;

  static enable() {
    this.isEnabled = true;
  }

  static disable() {
    this.isEnabled = false;
  }

  static log(level, category, message, data = null) {
    if (!this.isEnabled) return;

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level}] [${category}]`;

    switch (level) {
      case LOG_LEVELS.DEBUG:
        console.debug(prefix, message, data || '');
        break;
      case LOG_LEVELS.INFO:
        console.info(prefix, message, data || '');
        break;
      case LOG_LEVELS.WARN:
        console.warn(prefix, message, data || '');
        break;
      case LOG_LEVELS.ERROR:
        console.error(prefix, message, data || '');
        break;
      case LOG_LEVELS.NETWORK:
        console.log(prefix, message, data || '');
        break;
    }
  }

  static debug(category, message, data = null) {
    this.log(LOG_LEVELS.DEBUG, category, message, data);
  }

  static info(category, message, data = null) {
    this.log(LOG_LEVELS.INFO, category, message, data);
  }

  static warn(category, message, data = null) {
    this.log(LOG_LEVELS.WARN, category, message, data);
  }

  static error(category, message, data = null) {
    this.log(LOG_LEVELS.ERROR, category, message, data);
  }

  static network(category, message, data = null) {
    this.log(LOG_LEVELS.NETWORK, category, message, data);
  }

  // 网络请求日志
  static logRequest(url, method, headers, body) {
    if (!this.isEnabled) return;
    
    this.network('HTTP Request', `${method} ${url}`, {
      headers,
      body: body || null
    });
  }

  // 网络响应日志
  static logResponse(url, status, headers, body) {
    if (!this.isEnabled) return;

    this.network('HTTP Response', `${status} ${url}`, {
      headers,
      body: body || null
    });
  }
}

export default Logger;
