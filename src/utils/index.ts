import {TIME_FORMATS} from '../constants';

// 时间格式化工具
export const formatTime = (
  date: Date,
  format: string = TIME_FORMATS.display,
): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  switch (format) {
    case TIME_FORMATS.display:
      return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
    case TIME_FORMATS.date:
      return `${year}-${month}-${day}`;
    case TIME_FORMATS.time:
      return `${hours}:${minutes}`;
    case TIME_FORMATS.api:
      return date.toISOString();
    default:
      return date.toString();
  }
};

// 解析时间字符串
export const parseTime = (timeString: string): Date => {
  return new Date(timeString);
};

// 检查是否为今天
export const isToday = (date: Date): boolean => {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

// 检查是否为同一天
export const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  );
};

// 获取过去N天的日期数组
export const getPastDays = (days: number): Date[] => {
  const dates: Date[] = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    dates.push(date);
  }

  return dates;
};

// 计算百分比
export const calculatePercentage = (value: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
};

// 生成唯一ID
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// 防抖函数
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// 节流函数
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number,
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// 深拷贝
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
  if (obj instanceof Array)
    return obj.map(item => deepClone(item)) as unknown as T;
  if (typeof obj === 'object') {
    const clonedObj = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
  return obj;
};

// 验证手机号
export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone);
};

// 验证时间格式 HH:mm
export const validateTimeFormat = (time: string): boolean => {
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
};

// 获取状态颜色
export const getStatusColor = (
  status: 'overtime' | 'ontime' | 'pending',
  theme: 'light' | 'dark' = 'light',
): string => {
  const colors = {
    light: {
      overtime: '#FF5000',
      ontime: '#00C805',
      pending: '#FFE66D',
    },
    dark: {
      overtime: '#FF5000',
      ontime: '#00C805',
      pending: '#FFE66D',
    },
  };

  return colors[theme][status];
};

// 格式化数字（添加千分位分隔符）
export const formatNumber = (num: number): string => {
  return num.toLocaleString();
};

// 安全的JSON解析
export const safeJsonParse = <T>(jsonString: string, defaultValue: T): T => {
  try {
    return JSON.parse(jsonString);
  } catch {
    return defaultValue;
  }
};

// 检查对象是否为空
export const isEmpty = (obj: any): boolean => {
  if (obj == null) return true;
  if (Array.isArray(obj)) return obj.length === 0;
  if (typeof obj === 'object') return Object.keys(obj).length === 0;
  if (typeof obj === 'string') return obj.trim().length === 0;
  return false;
};

// 数组去重
export const uniqueArray = <T>(array: T[], key?: keyof T): T[] => {
  if (!key) {
    return [...new Set(array)];
  }

  const seen = new Set();
  return array.filter(item => {
    const value = item[key];
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
};

// ============================================
// 数据验证函数 (Data Validation Functions)
// ============================================

import type {
  User,
  StatusRecord,
  Tag,
  RealTimeData,
  UserStatusSubmission,
  ValidationResult,
  ValidationError,
  TagDistribution,
} from '../types';

/**
 * 验证用户信息
 * 需求: 8.4 - 用户信息完整性验证
 */
export const validateUser = (user: Partial<User>): ValidationResult => {
  const errors: string[] = [];

  // 验证必填字段
  if (!user.id || user.id.trim() === '') {
    errors.push('用户ID不能为空');
  }

  if (!user.phoneNumber || !validatePhoneNumber(user.phoneNumber)) {
    errors.push('手机号格式不正确');
  }

  if (!user.username || user.username.trim() === '') {
    errors.push('用户名不能为空');
  }

  if (!user.province || user.province.trim() === '') {
    errors.push('省份不能为空');
  }

  if (!user.city || user.city.trim() === '') {
    errors.push('城市不能为空');
  }

  if (!user.industry || user.industry.trim() === '') {
    errors.push('行业不能为空');
  }

  if (!user.company || user.company.trim() === '') {
    errors.push('公司不能为空');
  }

  if (!user.position || user.position.trim() === '') {
    errors.push('职位不能为空');
  }

  // 验证时间格式 (需求: 2.1)
  if (!user.workStartTime || !validateTimeFormat(user.workStartTime)) {
    errors.push('上班时间格式不正确，应为HH:mm格式');
  }

  if (!user.workEndTime || !validateTimeFormat(user.workEndTime)) {
    errors.push('下班时间格式不正确，应为HH:mm格式');
  }

  // 验证头像URL
  if (!user.avatar || user.avatar.trim() === '') {
    errors.push('头像不能为空');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * 验证状态记录
 */
export const validateStatusRecord = (
  record: Partial<StatusRecord>,
): ValidationResult => {
  const errors: string[] = [];

  if (!record.id || record.id.trim() === '') {
    errors.push('记录ID不能为空');
  }

  if (!record.userId || record.userId.trim() === '') {
    errors.push('用户ID不能为空');
  }

  if (!record.date || !validateDateFormat(record.date)) {
    errors.push('日期格式不正确，应为YYYY-MM-DD格式');
  }

  if (typeof record.isOvertime !== 'boolean') {
    errors.push('加班状态必须为布尔值');
  }

  if (!record.tagId || record.tagId.trim() === '') {
    errors.push('标签ID不能为空');
  }

  // 验证加班时长
  if (record.isOvertime && record.overtimeHours !== undefined) {
    if (
      typeof record.overtimeHours !== 'number' ||
      record.overtimeHours < 1 ||
      record.overtimeHours > 12
    ) {
      errors.push('加班时长必须在1-12小时之间');
    }
  }

  if (!record.submittedAt || !(record.submittedAt instanceof Date)) {
    errors.push('提交时间必须为有效的日期对象');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * 验证标签数据
 * 需求: 13.1-13.4 - 标签数据管理
 */
export const validateTag = (tag: Partial<Tag>): ValidationResult => {
  const errors: string[] = [];

  if (!tag.id || tag.id.trim() === '') {
    errors.push('标签ID不能为空');
  }

  if (!tag.name || tag.name.trim() === '') {
    errors.push('标签名称不能为空');
  }

  if (
    !tag.type ||
    !['industry', 'company', 'position', 'custom'].includes(tag.type)
  ) {
    errors.push('标签类型必须为industry、company、position或custom之一');
  }

  if (typeof tag.isActive !== 'boolean') {
    errors.push('标签激活状态必须为布尔值');
  }

  if (
    tag.usageCount !== undefined &&
    (typeof tag.usageCount !== 'number' || tag.usageCount < 0)
  ) {
    errors.push('使用次数必须为非负数');
  }

  if (!tag.createdAt || !(tag.createdAt instanceof Date)) {
    errors.push('创建时间必须为有效的日期对象');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * 验证实时数据格式
 * 需求: 2.1 - 实时数据格式验证
 */
export const validateRealTimeData = (
  data: Partial<RealTimeData>,
): ValidationResult => {
  const errors: string[] = [];

  if (!data.timestamp || !(data.timestamp instanceof Date)) {
    errors.push('时间戳必须为有效的日期对象');
  }

  if (typeof data.participantCount !== 'number' || data.participantCount < 0) {
    errors.push('参与人数必须为非负数');
  }

  if (typeof data.overtimeCount !== 'number' || data.overtimeCount < 0) {
    errors.push('加班人数必须为非负数');
  }

  if (typeof data.onTimeCount !== 'number' || data.onTimeCount < 0) {
    errors.push('准时下班人数必须为非负数');
  }

  // 验证人数一致性
  if (
    data.participantCount !== undefined &&
    data.overtimeCount !== undefined &&
    data.onTimeCount !== undefined
  ) {
    if (data.participantCount !== data.overtimeCount + data.onTimeCount) {
      errors.push('参与人数必须等于加班人数加准时下班人数');
    }
  }

  if (!Array.isArray(data.tagDistribution)) {
    errors.push('标签分布必须为数组');
  }

  if (!Array.isArray(data.dailyStatus)) {
    errors.push('每日状态必须为数组');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * 验证用户状态提交
 */
export const validateUserStatusSubmission = (
  submission: Partial<UserStatusSubmission>,
): ValidationResult => {
  const errors: string[] = [];

  if (typeof submission.isOvertime !== 'boolean') {
    errors.push('加班状态必须为布尔值');
  }

  if (!submission.tagId || submission.tagId.trim() === '') {
    errors.push('标签ID不能为空');
  }

  if (submission.isOvertime && submission.overtimeHours !== undefined) {
    if (
      typeof submission.overtimeHours !== 'number' ||
      submission.overtimeHours < 1 ||
      submission.overtimeHours > 12
    ) {
      errors.push('加班时长必须在1-12小时之间');
    }
  }

  if (!submission.timestamp || !(submission.timestamp instanceof Date)) {
    errors.push('时间戳必须为有效的日期对象');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * 验证日期格式 YYYY-MM-DD
 */
export const validateDateFormat = (date: string): boolean => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    return false;
  }

  // 验证日期是否有效
  const [year, month, day] = date.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  return (
    dateObj.getFullYear() === year &&
    dateObj.getMonth() === month - 1 &&
    dateObj.getDate() === day
  );
};

/**
 * 验证显示时间格式 YYYY/MM/DD HH:mm:ss
 * 需求: 2.1 - 时间格式验证
 */
export const validateDisplayTimeFormat = (time: string): boolean => {
  const timeRegex =
    /^\d{4}\/\d{2}\/\d{2} ([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
  return timeRegex.test(time);
};

/**
 * 标签搜索逻辑
 * 需求: 8.5, 9.3, 13.5 - 搜索功能
 */
export const searchTags = (
  tags: Tag[],
  searchTerm: string,
  type?: Tag['type'],
): Tag[] => {
  if (!searchTerm || searchTerm.trim() === '') {
    return tags.filter(tag => {
      const matchesType = type ? tag.type === type : true;
      return matchesType && tag.isActive;
    });
  }

  const normalizedSearch = searchTerm.toLowerCase().trim();

  return tags.filter(tag => {
    const matchesSearch = tag.name.toLowerCase().includes(normalizedSearch);
    const matchesType = type ? tag.type === type : true;
    const isActive = tag.isActive;

    return matchesSearch && matchesType && isActive;
  });
};

/**
 * 获取Top10标签分布
 * 需求: 9.4, 9.5 - Top10数据聚合
 */
export const getTop10TagDistribution = (
  tagDistribution: TagDistribution[],
): TagDistribution[] => {
  // 分离加班和准时下班的标签
  const overtimeTags = tagDistribution.filter(tag => tag.isOvertime);
  const onTimeTags = tagDistribution.filter(tag => !tag.isOvertime);

  // 按数量排序
  const sortedOvertimeTags = [...overtimeTags].sort(
    (a, b) => b.count - a.count,
  );
  const sortedOnTimeTags = [...onTimeTags].sort((a, b) => b.count - a.count);

  // 获取Top10
  const top10Overtime = sortedOvertimeTags.slice(0, 10);
  const top10OnTime = sortedOnTimeTags.slice(0, 10);

  // 计算"其他"类别
  const otherOvertimeTags = sortedOvertimeTags.slice(10);
  const otherOnTimeTags = sortedOnTimeTags.slice(10);

  const result: TagDistribution[] = [...top10Overtime, ...top10OnTime];

  // 添加"加班的其他"类别
  if (otherOvertimeTags.length > 0) {
    const otherOvertimeCount = otherOvertimeTags.reduce(
      (sum, tag) => sum + tag.count,
      0,
    );
    result.push({
      tagId: 'other-overtime',
      tagName: '其他',
      count: otherOvertimeCount,
      isOvertime: true,
      color: '#FF5000', // 加班红
    });
  }

  // 添加"准时下班的其他"类别
  if (otherOnTimeTags.length > 0) {
    const otherOnTimeCount = otherOnTimeTags.reduce(
      (sum, tag) => sum + tag.count,
      0,
    );
    result.push({
      tagId: 'other-ontime',
      tagName: '其他',
      count: otherOnTimeCount,
      isOvertime: false,
      color: '#00C805', // 准时绿
    });
  }

  return result;
};

/**
 * 验证标签分布数据
 */
export const validateTagDistribution = (
  distribution: Partial<TagDistribution>,
): ValidationResult => {
  const errors: string[] = [];

  if (!distribution.tagId || distribution.tagId.trim() === '') {
    errors.push('标签ID不能为空');
  }

  if (!distribution.tagName || distribution.tagName.trim() === '') {
    errors.push('标签名称不能为空');
  }

  if (typeof distribution.count !== 'number' || distribution.count < 0) {
    errors.push('数量必须为非负数');
  }

  if (typeof distribution.isOvertime !== 'boolean') {
    errors.push('加班状态必须为布尔值');
  }

  if (!distribution.color || distribution.color.trim() === '') {
    errors.push('颜色不能为空');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * 批量验证函数
 */
export const validateBatch = <T>(
  items: T[],
  validator: (item: T) => ValidationResult,
): {isValid: boolean; errors: ValidationError[]} => {
  const allErrors: ValidationError[] = [];

  items.forEach((item, index) => {
    const result = validator(item);
    if (!result.isValid) {
      result.errors.forEach(error => {
        allErrors.push({
          field: `item[${index}]`,
          message: error,
        });
      });
    }
  });

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
  };
};

// Export error handling utilities
export * from './errorHandler';

// Export performance utilities
export * from './performance';

// Export app optimization utilities
export * from './appOptimization';

// Export logger utilities
export * from './logger';
