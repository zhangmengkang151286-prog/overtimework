// 用户相关类型
export interface User {
  id: string;
  phoneNumber: string;
  wechatId?: string;
  avatar: string;
  username: string;
  gender?: 'male' | 'female'; // 性别
  birthYear?: number; // 出生年份
  province: string;
  city: string;
  industry: string;
  company: string;
  positionCategory: string; // 职位分类（如"技术研发"、"产品"等）
  position: string;
  workStartTime: string; // HH:mm格式
  workEndTime: string; // HH:mm格式
  createdAt: string; // ISO 字符串格式，Redux 不支持 Date 对象
  updatedAt: string; // ISO 字符串格式，Redux 不支持 Date 对象
}

// 状态记录类型
export interface StatusRecord {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD格式
  isOvertime: boolean;
  tagId?: string;
  overtimeHours?: number;
  submittedAt: Date;
}

// 标签类型
export interface Tag {
  id: string;
  name: string;
  type: 'industry' | 'company' | 'position' | 'custom';
  category?: 'ontime' | 'overtime'; // 准时下班 / 加班
  subcategory?: string; // 子分类，如"技术/IT/数字化"
  isActive: boolean;
  usageCount: number;
  createdAt: Date;
}

// 标签分布类型
export interface TagDistribution {
  tagId: string;
  tagName: string;
  count: number;
  isOvertime: boolean;
  color: string;
}

// 标签统计类型
export interface TagStats {
  tagId: string;
  tagName: string;
  overtimeCount: number;
  onTimeCount: number;
  totalCount: number;
}

// 每日状态类型
export interface DailyStatus {
  date: Date | string; // 支持 Date 对象或 ISO 字符串
  isOvertimeDominant: boolean;
  participantCount: number;
  overtimeCount: number;
  onTimeCount: number;
  status: 'overtime' | 'ontime' | 'pending'; // 新增：状态字段
}

// 实时数据类型
export interface RealTimeData {
  timestamp: Date;
  participantCount: number;
  overtimeCount: number;
  onTimeCount: number;
  tagDistribution: TagDistribution[];
  dailyStatus: DailyStatus[];
}

// 实时统计类型
export interface RealTimeStats {
  participantCount: number;
  overtimeCount: number;
  onTimeCount: number;
  lastUpdated: Date;
}

// 历史数据类型
export interface HistoricalData {
  data: RealTimeData;
  isAvailable: boolean;
}

// 用户状态提交类型
export interface UserStatusSubmission {
  isOvertime: boolean;
  tagId: string;
  extraTagIds?: string[]; // 多选时的额外标签 ID（不含第一个）
  overtimeHours?: number; // 1-12小时
  timestamp: Date;
}

// 用户状态类型
export interface UserStatus {
  hasSubmittedToday: boolean;
  lastSubmission?: UserStatusSubmission;
}

// API响应类型
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

// API错误类型
export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

// 实时数据响应类型
export interface RealTimeResponse {
  timestamp: string;
  participantCount: number;
  overtimeCount: number;
  onTimeCount: number;
  tagDistribution: TagDistribution[];
  dailyStatus: DailyStatus[];
}

// 历史数据响应类型
export interface HistoricalResponse {
  data: RealTimeResponse;
  isAvailable: boolean;
}

// 状态提交请求类型
export interface StatusSubmissionRequest {
  userId: string;
  isOvertime: boolean;
  tagId: string;
  overtimeHours?: number;
  timestamp: string;
}

// 标签响应类型
export interface TagResponse {
  id: string;
  name: string;
  type: 'industry' | 'company' | 'position';
  isActive: boolean;
  createdAt: string;
}

// ============================================
// 类型守卫 (Type Guards)
// ============================================

export function isUser(obj: any): obj is User {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.phoneNumber === 'string' &&
    typeof obj.avatar === 'string' &&
    typeof obj.username === 'string' &&
    typeof obj.province === 'string' &&
    typeof obj.city === 'string' &&
    typeof obj.industry === 'string' &&
    typeof obj.company === 'string' &&
    typeof obj.positionCategory === 'string' &&
    typeof obj.position === 'string' &&
    typeof obj.workStartTime === 'string' &&
    typeof obj.workEndTime === 'string' &&
    typeof obj.createdAt === 'string' &&
    typeof obj.updatedAt === 'string'
  );
}

export function isStatusRecord(obj: any): obj is StatusRecord {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.userId === 'string' &&
    typeof obj.date === 'string' &&
    typeof obj.isOvertime === 'boolean' &&
    typeof obj.tagId === 'string' &&
    obj.submittedAt instanceof Date &&
    (obj.overtimeHours === undefined || typeof obj.overtimeHours === 'number')
  );
}

export function isTag(obj: any): obj is Tag {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    ['industry', 'company', 'position', 'custom'].includes(obj.type) &&
    typeof obj.isActive === 'boolean' &&
    typeof obj.usageCount === 'number' &&
    obj.createdAt instanceof Date
  );
}

export function isRealTimeData(obj: any): obj is RealTimeData {
  return (
    obj &&
    typeof obj === 'object' &&
    obj.timestamp instanceof Date &&
    typeof obj.participantCount === 'number' &&
    typeof obj.overtimeCount === 'number' &&
    typeof obj.onTimeCount === 'number' &&
    Array.isArray(obj.tagDistribution) &&
    Array.isArray(obj.dailyStatus)
  );
}

export function isTagDistribution(obj: any): obj is TagDistribution {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.tagId === 'string' &&
    typeof obj.tagName === 'string' &&
    typeof obj.count === 'number' &&
    typeof obj.isOvertime === 'boolean' &&
    typeof obj.color === 'string'
  );
}

export function isUserStatusSubmission(obj: any): obj is UserStatusSubmission {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.isOvertime === 'boolean' &&
    typeof obj.tagId === 'string' &&
    obj.timestamp instanceof Date &&
    (obj.overtimeHours === undefined || typeof obj.overtimeHours === 'number')
  );
}

// ============================================
// 验证结果类型
// ============================================

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface ValidationError {
  field: string;
  message: string;
}
