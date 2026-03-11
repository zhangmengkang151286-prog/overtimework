// Enhanced Auth System - Authentication Service
// 已迁移到 PostgREST API，不再使用 Supabase SDK

import CryptoJS from 'crypto-js';
import {get, post, patch} from '../postgrestApi';
import {SMSCodeService} from './SMSCodeService';
import {ValidationService} from './ValidationService';
import {errorHandlingService} from './ErrorHandlingService';
import {User, AuthResponse, SMSCodeResponse} from '../../types/enhanced-auth';

/**
 * AuthService 处理用户认证相关的所有操作
 * 包括注册、登录、密码管理等
 */
export class AuthService {
  // 密码加密盐值（生产环境应该从环境变量读取）
  private static readonly PASSWORD_SALT = 'OvertimeIndexApp_2024_SecureSalt';

  // 密码错误次数限制
  private static readonly MAX_PASSWORD_ATTEMPTS = 5;
  private static readonly LOCKOUT_DURATION_MINUTES = 30;

  /**
   * 手机号注册
   */
  static async registerWithPhone(
    phoneNumber: string,
    smsCode: string,
  ): Promise<AuthResponse> {
    try {
      if (this.isTestAccount(phoneNumber)) {
        return {success: false, error: '测试账号已禁用，请使用正常手机号注册'};
      }

      const phoneValidation = ValidationService.validatePhoneNumber(phoneNumber);
      if (!phoneValidation.isValid) {
        return {success: false, error: phoneValidation.error};
      }

      const codeValidation = await SMSCodeService.verifyCode(phoneNumber, smsCode, 'register');
      if (!codeValidation.isValid) {
        return {success: false, error: codeValidation.error};
      }

      // 检查手机号是否已注册
      const existingUsers = await get<any[]>('/users', {
        phone_number: `eq.${phoneNumber}`,
        select: 'id',
        limit: 1,
      });

      if (existingUsers && existingUsers.length > 0) {
        return {success: false, error: '该手机号已注册'};
      }

      // 创建新用户
      const newUsers = await post<any[]>('/users', {
        phone_number: phoneNumber,
        username: `用户${phoneNumber.slice(-4)}`,
        is_profile_complete: false,
        password_failed_attempts: 0,
      });

      if (!newUsers || newUsers.length === 0) {
        return {success: false, error: '注册失败,请重试'};
      }

      return {
        success: true,
        user: this.mapDatabaseUserToUser(newUsers[0]),
        requiresProfileCompletion: true,
      };
    } catch (error) {
      errorHandlingService.logError(error, '注册');
      return {
        success: false,
        error: errorHandlingService.getUserFriendlyMessage(error, '注册'),
      };
    }
  }

  /**
   * 手机号登录（新用户自动注册）
   */
  static async loginWithPhone(
    phoneNumber: string,
    smsCode: string,
  ): Promise<AuthResponse> {
    try {
      if (this.isTestAccount(phoneNumber)) {
        return {success: false, error: '测试账号已禁用，请使用正常账号登录'};
      }

      const phoneValidation = ValidationService.validatePhoneNumber(phoneNumber);
      if (!phoneValidation.isValid) {
        return {success: false, error: phoneValidation.error};
      }

      const codeValidation = await SMSCodeService.verifyCode(phoneNumber, smsCode, 'login');
      if (!codeValidation.isValid) {
        return {success: false, error: codeValidation.error};
      }

      // 查找用户
      const users = await get<any[]>('/users', {
        phone_number: `eq.${phoneNumber}`,
        limit: 1,
      });

      // 如果用户不存在，自动注册
      if (!users || users.length === 0) {
        console.log('用户不存在，自动注册新用户:', phoneNumber);

        const newUsers = await post<any[]>('/users', {
          phone_number: phoneNumber,
          username: `用户${phoneNumber.slice(-4)}`,
          is_profile_complete: false,
          password_failed_attempts: 0,
        });

        if (!newUsers || newUsers.length === 0) {
          return {success: false, error: '登录失败，请重试'};
        }

        return {
          success: true,
          user: this.mapDatabaseUserToUser(newUsers[0]),
          requiresProfileCompletion: true,
          isNewUser: true,
        };
      }

      // 老用户直接登录
      const user = users[0];
      return {
        success: true,
        user: this.mapDatabaseUserToUser(user),
        requiresProfileCompletion: !user.is_profile_complete,
        isNewUser: false,
      };
    } catch (error) {
      errorHandlingService.logError(error, '登录');
      return {
        success: false,
        error: errorHandlingService.getUserFriendlyMessage(error, '登录'),
      };
    }
  }

  /**
   * 密码登录
   */
  static async loginWithPassword(
    phoneNumber: string,
    password: string,
  ): Promise<AuthResponse> {
    try {
      if (this.isTestAccount(phoneNumber)) {
        return {success: false, error: '测试账号已禁用，请使用正常账号登录'};
      }

      const phoneValidation = ValidationService.validatePhoneNumber(phoneNumber);
      if (!phoneValidation.isValid) {
        return {success: false, error: phoneValidation.error};
      }

      const passwordValidation = ValidationService.validatePassword(password);
      if (!passwordValidation.isValid) {
        return {success: false, error: passwordValidation.error};
      }

      // 查找用户
      const users = await get<any[]>('/users', {
        phone_number: `eq.${phoneNumber}`,
        limit: 1,
      });

      if (!users || users.length === 0) {
        return {success: false, error: '手机号或密码错误'};
      }

      const user = users[0];

      // 检查账户是否被锁定
      if (user.password_locked_until) {
        const lockedUntil = new Date(user.password_locked_until);
        if (lockedUntil > new Date()) {
          const minutesLeft = Math.ceil(
            (lockedUntil.getTime() - Date.now()) / (1000 * 60),
          );
          return {success: false, error: `账户已锁定,请${minutesLeft}分钟后再试`};
        }
      }

      // 检查是否设置了密码
      if (!user.password_hash) {
        return {success: false, error: '该账户未设置密码,请使用验证码登录'};
      }

      // 验证密码
      const hashedPassword = this.hashPassword(password);
      if (hashedPassword !== user.password_hash) {
        const newAttempts = (user.password_failed_attempts || 0) + 1;
        const updateData: any = {password_failed_attempts: newAttempts};

        if (newAttempts >= this.MAX_PASSWORD_ATTEMPTS) {
          const lockoutUntil = new Date(
            Date.now() + this.LOCKOUT_DURATION_MINUTES * 60 * 1000,
          );
          updateData.password_locked_until = lockoutUntil.toISOString();
        }

        await patch(`/users?id=eq.${user.id}`, updateData);

        if (newAttempts >= this.MAX_PASSWORD_ATTEMPTS) {
          return {success: false, error: `密码错误次数过多,账户已锁定${this.LOCKOUT_DURATION_MINUTES}分钟`};
        }

        return {success: false, error: `密码错误,还剩${this.MAX_PASSWORD_ATTEMPTS - newAttempts}次机会`};
      }

      // 密码正确,重置失败次数
      await patch(`/users?id=eq.${user.id}`, {
        password_failed_attempts: 0,
        password_locked_until: null,
      });

      return {
        success: true,
        user: this.mapDatabaseUserToUser(user),
        requiresProfileCompletion: !user.is_profile_complete,
      };
    } catch (error) {
      errorHandlingService.logError(error, '密码登录');
      return {
        success: false,
        error: errorHandlingService.getUserFriendlyMessage(error, '密码登录'),
      };
    }
  }

  /**
   * 发送短信验证码
   */
  static async sendSMSCode(
    phoneNumber: string,
    type: 'register' | 'login' | 'bind' | 'reset_password',
  ): Promise<SMSCodeResponse> {
    const phoneValidation = ValidationService.validatePhoneNumber(phoneNumber);
    if (!phoneValidation.isValid) {
      return {success: false, error: phoneValidation.error};
    }

    // 如果是注册，检查手机号是否已存在
    if (type === 'register') {
      const existingUsers = await get<any[]>('/users', {
        phone_number: `eq.${phoneNumber}`,
        select: 'id',
        limit: 1,
      });
      if (existingUsers && existingUsers.length > 0) {
        return {success: false, error: '该手机号已注册'};
      }
    }

    // 如果是重置密码，检查手机号是否存在
    if (type === 'reset_password') {
      const existingUsers = await get<any[]>('/users', {
        phone_number: `eq.${phoneNumber}`,
        select: 'id',
        limit: 1,
      });
      if (!existingUsers || existingUsers.length === 0) {
        return {success: false, error: '该手机号未注册'};
      }
    }

    return await SMSCodeService.sendCode(phoneNumber, type);
  }

  /**
   * 验证短信验证码
   */
  static async verifySMSCode(
    phoneNumber: string,
    code: string,
    type: 'register' | 'login' | 'bind' | 'reset_password',
  ): Promise<boolean> {
    const result = await SMSCodeService.verifyCode(phoneNumber, code, type);
    return result.isValid;
  }

  /**
   * 设置密码
   */
  static async setPassword(
    userId: string,
    password: string,
  ): Promise<AuthResponse> {
    try {
      const passwordValidation = ValidationService.validatePassword(password);
      if (!passwordValidation.isValid) {
        return {success: false, error: passwordValidation.error};
      }

      const passwordHash = this.hashPassword(password);

      await patch(`/users?id=eq.${userId}`, {
        password_hash: passwordHash,
        password_failed_attempts: 0,
        password_locked_until: null,
      });

      return {success: true};
    } catch (error) {
      errorHandlingService.logError(error, '设置密码');
      return {
        success: false,
        error: errorHandlingService.getUserFriendlyMessage(error, '设置密码'),
      };
    }
  }

  /**
   * 重置密码
   */
  static async resetPassword(
    phoneNumber: string,
    smsCode: string,
    newPassword: string,
  ): Promise<AuthResponse> {
    try {
      const phoneValidation = ValidationService.validatePhoneNumber(phoneNumber);
      if (!phoneValidation.isValid) {
        return {success: false, error: phoneValidation.error};
      }

      const passwordValidation = ValidationService.validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        return {success: false, error: passwordValidation.error};
      }

      // 查找用户
      const users = await get<any[]>('/users', {
        phone_number: `eq.${phoneNumber}`,
        select: 'id',
        limit: 1,
      });

      if (!users || users.length === 0) {
        return {success: false, error: '该手机号未注册'};
      }

      const passwordHash = this.hashPassword(newPassword);

      await patch(`/users?id=eq.${users[0].id}`, {
        password_hash: passwordHash,
        password_failed_attempts: 0,
        password_locked_until: null,
      });

      return {success: true};
    } catch (error) {
      errorHandlingService.logError(error, '重置密码');
      return {
        success: false,
        error: errorHandlingService.getUserFriendlyMessage(error, '重置密码'),
      };
    }
  }

  /**
   * 获取当前用户
   */
  static async getCurrentUser(userId: string): Promise<User | null> {
    try {
      const users = await get<any[]>('/users', {
        id: `eq.${userId}`,
        limit: 1,
      });

      if (!users || users.length === 0) {
        return null;
      }

      return this.mapDatabaseUserToUser(users[0]);
    } catch (error) {
      console.error('获取用户信息失败:', error);
      return null;
    }
  }

  /**
   * 更新用户资料
   */
  static async updateUserProfile(
    userId: string,
    profileData: {
      username?: string;
      avatar_url?: string;
      gender?: 'male' | 'female';
      birth_year?: number;
      province?: string;
      city?: string;
      industry?: string;
      company?: string;
      position_category?: string;
      position?: string;
      work_start_time?: string;
      work_end_time?: string;
      is_profile_complete?: boolean;
    },
  ): Promise<AuthResponse> {
    try {
      console.log('更新用户资料 - userId:', userId);
      console.log('更新用户资料 - profileData:', JSON.stringify(profileData, null, 2));

      const updatedUsers = await patch<any[]>(`/users?id=eq.${userId}`, {
        ...profileData,
        updated_at: new Date().toISOString(),
      });

      if (!updatedUsers || updatedUsers.length === 0) {
        return {success: false, error: '更新资料失败，请重试'};
      }

      return {
        success: true,
        user: this.mapDatabaseUserToUser(updatedUsers[0]),
      };
    } catch (error) {
      errorHandlingService.logError(error, '更新用户资料');
      return {
        success: false,
        error: errorHandlingService.getUserFriendlyMessage(error, '更新用户资料'),
      };
    }
  }

  /**
   * 获取用户资料
   */
  static async getUserProfile(userId: string): Promise<User | null> {
    return await this.getCurrentUser(userId);
  }

  /**
   * 验证是否为测试账号（已禁用）
   */
  private static isTestAccount(phoneNumber: string, userId?: string): boolean {
    const TEST_USER_ID = '00000000-0000-0000-0000-000000000001';
    const isTestPhone = phoneNumber.startsWith('999');
    const isTestId = userId === TEST_USER_ID;
    return isTestPhone || isTestId;
  }

  /**
   * 密码哈希函数（使用 SHA256）
   */
  private static hashPassword(password: string): string {
    return CryptoJS.SHA256(password + this.PASSWORD_SALT).toString();
  }

  /**
   * 将数据库用户对象映射为应用 User 类型
   */
  private static mapDatabaseUserToUser(dbUser: any): User {
    return {
      id: dbUser.id,
      phoneNumber: dbUser.phone_number,
      passwordHash: dbUser.password_hash,
      avatarUrl: dbUser.avatar_url,
      username: dbUser.username,
      gender: dbUser.gender,
      birthYear: dbUser.birth_year,
      province: dbUser.province,
      city: dbUser.city,
      industry: dbUser.industry,
      company: dbUser.company,
      positionCategory: dbUser.position_category,
      position: dbUser.position,
      workStartTime: (dbUser.work_start_time || '').slice(0, 5) || undefined,
      workEndTime: (dbUser.work_end_time || '').slice(0, 5) || undefined,
      isProfileComplete: dbUser.is_profile_complete,
      passwordFailedAttempts: dbUser.password_failed_attempts || 0,
      passwordLockedUntil: dbUser.password_locked_until,
      createdAt: dbUser.created_at,
      updatedAt: dbUser.updated_at,
    };
  }
}
