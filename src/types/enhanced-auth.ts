// Enhanced Auth System - Type Definitions

// User and Profile Types
export interface User {
  id: string;
  phoneNumber: string;
  passwordHash?: string;
  avatarUrl?: string;
  username: string;
  gender?: 'male' | 'female'; // 性别
  birthYear?: number; // 出生年份
  province?: string;
  city?: string;
  industry?: string;
  company?: string;
  positionCategory?: string; // 职位分类
  position?: string;
  workStartTime?: string; // HH:mm format
  workEndTime?: string; // HH:mm format
  isProfileComplete: boolean;
  passwordFailedAttempts: number;
  passwordLockedUntil?: string; // ISO 8601 timestamp
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  phoneNumber: string;
  avatar?: string;
  username: string;
  province?: string;
  city?: string;
  industry?: string;
  company?: string;
  positionCategory?: string;
  position?: string;
  workStartTime?: string;
  workEndTime?: string;
  isProfileComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// SMS Verification Types
export interface SMSVerificationCode {
  id: string;
  phoneNumber: string;
  code: string;
  purpose: 'register' | 'login' | 'bind' | 'reset_password';
  expiresAt: string; // ISO 8601 timestamp
  isUsed: boolean;
  createdAt: string;
}

// Validation Types
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export interface ValidationErrors {
  [field: string]: string;
}

// Select Option Types
export interface SelectOption {
  id: string;
  label: string;
  value: string;
  usageCount?: number;
}

// Auth Response Types
export interface AuthResponse {
  success: boolean;
  user?: User;
  error?: string;
  requiresProfileCompletion?: boolean;
  isNewUser?: boolean; // 是否为新注册用户
}

export interface SMSCodeResponse {
  success: boolean;
  error?: string;
  canRetryAt?: string; // ISO 8601 timestamp
}

// Location Types
export interface LocationData {
  province: string;
  city: string;
  latitude?: number;
  longitude?: number;
}
