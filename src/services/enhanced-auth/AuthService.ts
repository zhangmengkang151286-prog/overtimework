// Enhanced Auth System - Authentication Service
// 已迁移到 PostgREST API，不再使用 Supabase SDK
// 密码哈希已迁移到数据库层（pgcrypto bcrypt），前端不再处理密码加密

import {get, post, patch, rpc} from '../postgrestApi';
import {SMSCodeService} from './SMSCodeService';
import {ValidationService} from './ValidationService';
import {errorHandlingService} from './ErrorHandlingService';
import {User, AuthResponse, SMSCodeResponse} from '../../types/enhanced-auth';

/**
 * AuthService 处理用户认证相关的所有操作
 * 包括注册、登录、密码管理等
 */
export class AuthService {
  // 密码错误次数限制（与数据库 RPC 函数保持一致）
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

      // 调用数据库 RPC 函数验证密码（bcrypt 哈希在数据库端完成）
      // 该函数同时处理账户锁定、失败次数、旧 SHA256 密码自动升级
      const result = await rpc<{
        success: boolean;
        error?: string;
        user_id?: string;
        username?: string;
        phone_number?: string;
        is_profile_complete?: boolean;
        upgraded?: boolean;
      }>('verify_password', {
        p_phone_number: phoneNumber,
        p_password: password,
      });

      if (!result.success) {
        return {success: false, error: result.error || '密码验证失败'};
      }

      // 验证通过，获取完整用户信息
      const users = await get<any[]>('/users', {
        id: `eq.${result.user_id}`,
        limit: 1,
      });

      if (!users || users.length === 0) {
        return {success: false, error: '用户信息获取失败'};
      }

      return {
        success: true,
        user: this.mapDatabaseUserToUser(users[0]),
        requiresProfileCompletion: !result.is_profile_complete,
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
    try {
      const phoneValidation = ValidationService.validatePhoneNumber(phoneNumber);
      if (!phoneValidation.isValid) {
        return {success: false, error: phoneValidation.error};
      }

      // 先检查 API 服务器连通性，快速失败并给出明确提示
      console.log('🔍 [sendSMSCode] 检查 API 连通性...');
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        const healthResp = await fetch('https://api.gonia.net/health', {
          method: 'GET',
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (!healthResp.ok) {
          console.error('❌ [sendSMSCode] API 健康检查失败:', healthResp.status);
          return {success: false, error: '服务器暂时不可用，请稍后重试'};
        }
        console.log('✅ [sendSMSCode] API 连通性正常');
      } catch (healthError: any) {
        console.error('❌ [sendSMSCode] API 连通性检查失败:', healthError);
        if (healthError?.name === 'AbortError') {
          return {success: false, error: '网络连接超时，请切换WiFi/移动数据后重试'};
        }
        return {success: false, error: '无法连接服务器，请检查网络或切换WiFi/移动数据后重试'};
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
    } catch (error: any) {
      console.error('❌ [sendSMSCode] 发送验证码异常:', error);
      // 根据错误类型给出更具体的提示
      const msg = error?.message || '';
      if (msg.includes('超时') || msg.includes('timeout') || msg.includes('AbortError')) {
        return {success: false, error: '网络连接超时，请切换WiFi/移动数据后重试'};
      }
      if (msg.includes('网络') || msg.includes('Network') || msg.includes('fetch')) {
        return {success: false, error: '网络连接失败，请切换WiFi/移动数据后重试'};
      }
      return {
        success: false,
        error: error?.message || '验证码发送失败，请稍后重试',
      };
    }
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

      // 调用数据库 RPC 函数设置密码（bcrypt 哈希在数据库端完成）
      const result = await rpc<{success: boolean; error?: string}>(
        'set_user_password',
        {p_user_id: userId, p_password: password},
      );

      if (!result.success) {
        return {success: false, error: result.error || '设置密码失败'};
      }

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

      // 调用数据库 RPC 函数设置新密码（bcrypt 哈希在数据库端完成）
      const result = await rpc<{success: boolean; error?: string}>(
        'set_user_password',
        {p_user_id: users[0].id, p_password: newPassword},
      );

      if (!result.success) {
        return {success: false, error: result.error || '重置密码失败'};
      }

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
