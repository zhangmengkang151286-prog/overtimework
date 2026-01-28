// 用户相关类型
export interface User {
  id: string;
  phoneNumber: string;
  wechatId?: string;
  avatar: string;
  username: string;
  province: string;
  city: string;
  industry: string;
  company: string;
  position: string;
  workStartTime: string; // HH:mm格式
  workEndTime: string;   // HH:mm格式
  createdAt: Date;
  updatedAt: Date;
}

// 状态记录类型
export interface StatusRecord {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD格式
  isOvertime: boolean;
  tagId: string;
  overtimeHours?: number;
  submittedAt: Date;
}

// 标签类型
export interface Tag {
  id: string;
  name: string;
  type: 'industry' | 'company' | 'position' | 'custom';
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
  date: string;
  status: 'overtime' | 'ontime' | 'pending';
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
  date: string;
  timestamp: Date;
  participantCount: number;
  overtimeCount: number;
  onTimeCount: number;
  tagStats: TagStats[];
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