/**
 * 日志系统
 * Logging System
 *
 * 提供统一的日志记录和错误追踪功能
 * Provides unified logging and error tracking functionality
 */

import {Platform} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * 日志级别
 */
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  FATAL = 'FATAL',
}

/**
 * 日志条目
 */
export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  context?: string;
  data?: any;
  stack?: string;
}

/**
 * 日志配置
 */
export interface LoggerConfig {
  enableConsoleLogging: boolean;
  enableStorageLogging: boolean;
  maxStoredLogs: number;
  minLogLevel: LogLevel;
}

/**
 * 默认日志配置
 */
const defaultLoggerConfig: LoggerConfig = {
  enableConsoleLogging: __DEV__,
  enableStorageLogging: true,
  maxStoredLogs: 1000,
  minLogLevel: __DEV__ ? LogLevel.DEBUG : LogLevel.INFO,
};

/**
 * 日志管理器
 */
export class Logger {
  private static instance: Logger;
  private config: LoggerConfig;
  private logs: LogEntry[] = [];
  private storageKey = '@app_logs';

  private constructor(config: LoggerConfig = defaultLoggerConfig) {
    this.config = config;
    this.loadLogsFromStorage();
  }

  static getInstance(config?: LoggerConfig): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(config);
    }
    return Logger.instance;
  }

  /**
   * 从存储加载日志
   */
  private async loadLogsFromStorage(): Promise<void> {
    if (!this.config.enableStorageLogging) {
      return;
    }

    try {
      const storedLogs = await AsyncStorage.getItem(this.storageKey);
      if (storedLogs) {
        this.logs = JSON.parse(storedLogs).map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp),
        }));
      }
    } catch (error) {
      console.error('Failed to load logs from storage:', error);
    }
  }

  /**
   * 保存日志到存储
   */
  private async saveLogsToStorage(): Promise<void> {
    if (!this.config.enableStorageLogging) {
      return;
    }

    try {
      // 只保存最近的日志
      const logsToSave = this.logs.slice(-this.config.maxStoredLogs);
      await AsyncStorage.setItem(this.storageKey, JSON.stringify(logsToSave));
    } catch (error) {
      console.error('Failed to save logs to storage:', error);
    }
  }

  /**
   * 记录日志
   */
  private log(
    level: LogLevel,
    message: string,
    context?: string,
    data?: any,
    stack?: string,
  ): void {
    // 检查日志级别
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      context,
      data,
      stack,
    };

    // 添加到内存日志
    this.logs.push(entry);

    // 限制内存中的日志数量
    if (this.logs.length > this.config.maxStoredLogs) {
      this.logs.shift();
    }

    // 控制台输出
    if (this.config.enableConsoleLogging) {
      this.logToConsole(entry);
    }

    // 异步保存到存储
    this.saveLogsToStorage();
  }

  /**
   * 检查是否应该记录该级别的日志
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = [
      LogLevel.DEBUG,
      LogLevel.INFO,
      LogLevel.WARN,
      LogLevel.ERROR,
      LogLevel.FATAL,
    ];
    const currentLevelIndex = levels.indexOf(this.config.minLogLevel);
    const logLevelIndex = levels.indexOf(level);
    return logLevelIndex >= currentLevelIndex;
  }

  /**
   * 输出到控制台
   */
  private logToConsole(entry: LogEntry): void {
    const prefix = `[${entry.level}] ${entry.timestamp.toISOString()}`;
    const contextStr = entry.context ? ` [${entry.context}]` : '';
    const message = `${prefix}${contextStr}: ${entry.message}`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(message, entry.data);
        break;
      case LogLevel.INFO:
        console.info(message, entry.data);
        break;
      case LogLevel.WARN:
        console.warn(message, entry.data);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(message, entry.data);
        if (entry.stack) {
          console.error(entry.stack);
        }
        break;
    }
  }

  /**
   * DEBUG级别日志
   */
  debug(message: string, context?: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, context, data);
  }

  /**
   * INFO级别日志
   */
  info(message: string, context?: string, data?: any): void {
    this.log(LogLevel.INFO, message, context, data);
  }

  /**
   * WARN级别日志
   */
  warn(message: string, context?: string, data?: any): void {
    this.log(LogLevel.WARN, message, context, data);
  }

  /**
   * ERROR级别日志
   */
  error(message: string, context?: string, error?: Error | any): void {
    const stack = error instanceof Error ? error.stack : undefined;
    this.log(LogLevel.ERROR, message, context, error, stack);
  }

  /**
   * FATAL级别日志
   */
  fatal(message: string, context?: string, error?: Error | any): void {
    const stack = error instanceof Error ? error.stack : undefined;
    this.log(LogLevel.FATAL, message, context, error, stack);
  }

  /**
   * 获取所有日志
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * 获取指定级别的日志
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * 获取指定上下文的日志
   */
  getLogsByContext(context: string): LogEntry[] {
    return this.logs.filter(log => log.context === context);
  }

  /**
   * 获取指定时间范围的日志
   */
  getLogsByTimeRange(startTime: Date, endTime: Date): LogEntry[] {
    return this.logs.filter(
      log => log.timestamp >= startTime && log.timestamp <= endTime,
    );
  }

  /**
   * 清空日志
   */
  async clearLogs(): Promise<void> {
    this.logs = [];
    if (this.config.enableStorageLogging) {
      try {
        await AsyncStorage.removeItem(this.storageKey);
      } catch (error) {
        console.error('Failed to clear logs from storage:', error);
      }
    }
  }

  /**
   * 导出日志为JSON字符串
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * 获取日志统计信息
   */
  getLogStats(): {
    total: number;
    byLevel: Record<LogLevel, number>;
    oldestLog?: Date;
    newestLog?: Date;
  } {
    const stats = {
      total: this.logs.length,
      byLevel: {
        [LogLevel.DEBUG]: 0,
        [LogLevel.INFO]: 0,
        [LogLevel.WARN]: 0,
        [LogLevel.ERROR]: 0,
        [LogLevel.FATAL]: 0,
      },
      oldestLog: this.logs.length > 0 ? this.logs[0].timestamp : undefined,
      newestLog:
        this.logs.length > 0
          ? this.logs[this.logs.length - 1].timestamp
          : undefined,
    };

    this.logs.forEach(log => {
      stats.byLevel[log.level]++;
    });

    return stats;
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<LoggerConfig>): void {
    this.config = {...this.config, ...config};
  }

  /**
   * 获取当前配置
   */
  getConfig(): LoggerConfig {
    return {...this.config};
  }
}

/**
 * 导出单例实例
 */
export const logger = Logger.getInstance();

/**
 * 便捷的日志函数
 */
export const log = {
  debug: (message: string, context?: string, data?: any) =>
    logger.debug(message, context, data),
  info: (message: string, context?: string, data?: any) =>
    logger.info(message, context, data),
  warn: (message: string, context?: string, data?: any) =>
    logger.warn(message, context, data),
  error: (message: string, context?: string, error?: Error | any) =>
    logger.error(message, context, error),
  fatal: (message: string, context?: string, error?: Error | any) =>
    logger.fatal(message, context, error),
};
