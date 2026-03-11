/**
 * 用户档案服务
 * 已迁移到 PostgREST API，不再使用 Supabase SDK
 */

import {get, post, patch} from '../postgrestApi';
import {ValidationService} from './ValidationService';
import {SMSCodeService} from './SMSCodeService';
import {errorHandlingService} from './ErrorHandlingService';
import {User, UserProfile, ValidationResult} from '../../types/enhanced-auth';

// 有意义的词汇组合用于生成随机用户名
const ADJECTIVES = [
  '快乐', '聪明', '勇敢', '温柔', '活泼', '开朗', '阳光', '可爱',
  '优雅', '自信', '热情', '友善', '真诚', '善良', '乐观', '积极',
];

const NOUNS = [
  '小熊', '小猫', '小狗', '小鸟', '小鱼', '小兔', '小鹿', '小象',
  '星星', '月亮', '太阳', '彩虹', '云朵', '花朵', '树叶', '果实',
];

// 敏感词列表
const SENSITIVE_WORDS = ['admin', 'root', 'system', 'test', '管理员', '测试'];

export interface UserProfileData {
  avatar?: string;
  username: string;
  province: string;
  city: string;
  industry: string;
  company: string;
  positionCategory: string; // 职位分类
  position: string;
  workStartTime: string;
  workEndTime: string;
}

export class ProfileService {
  private static instance: ProfileService;

  private constructor() {}

  public static getInstance(): ProfileService {
    if (!ProfileService.instance) {
      ProfileService.instance = new ProfileService();
    }
    return ProfileService.instance;
  }

  /**
   * 完善用户档案
   */
  public async completeProfile(
    userId: string,
    profileData: UserProfileData,
  ): Promise<void> {
    try {
      const validation = this.validateProfileCompletion(profileData);
      if (!validation.isValid) {
        throw new Error(validation.error || '档案信息不完整');
      }

      const usernameValidation = await this.validateUsername(profileData.username);
      if (!usernameValidation.isValid) {
        throw new Error(usernameValidation.error || '用户名不符合要求');
      }

      await patch(`/users?id=eq.${userId}`, {
        avatar_url: profileData.avatar || '',
        username: profileData.username,
        province: profileData.province,
        city: profileData.city,
        industry: profileData.industry,
        company: profileData.company,
        position_category: profileData.positionCategory,
        position: profileData.position,
        work_start_time: profileData.workStartTime,
        work_end_time: profileData.workEndTime,
        is_profile_complete: true,
        updated_at: new Date().toISOString(),
      });
    } catch (error: any) {
      throw new Error(`完善档案失败: ${error.message || error}`);
    }
  }

  /**
   * 更新用户档案
   */
  public async updateProfile(
    userId: string,
    profileData: Partial<UserProfileData>,
  ): Promise<void> {
    try {
      if (profileData.username) {
        const usernameValidation = await this.validateUsername(profileData.username, userId);
        if (!usernameValidation.isValid) {
          throw new Error(usernameValidation.error || '用户名不符合要求');
        }
      }

      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (profileData.avatar !== undefined) updateData.avatar_url = profileData.avatar;
      if (profileData.username) updateData.username = profileData.username;
      if (profileData.province) updateData.province = profileData.province;
      if (profileData.city) updateData.city = profileData.city;
      if (profileData.industry) updateData.industry = profileData.industry;
      if (profileData.company) updateData.company = profileData.company;
      if (profileData.positionCategory) updateData.position_category = profileData.positionCategory;
      if (profileData.position) updateData.position = profileData.position;
      if (profileData.workStartTime) updateData.work_start_time = profileData.workStartTime;
      if (profileData.workEndTime) updateData.work_end_time = profileData.workEndTime;

      await patch(`/users?id=eq.${userId}`, updateData);
    } catch (error: any) {
      throw new Error(`更新档案失败: ${error.message || error}`);
    }
  }

  /**
   * 获取用户档案
   */
  public async getProfile(userId: string): Promise<UserProfile> {
    try {
      const users = await get<any[]>('/users', {
        id: `eq.${userId}`,
        limit: 1,
      });

      if (!users || users.length === 0) {
        throw new Error('用户不存在');
      }

      const data = users[0];
      return {
        id: data.id,
        phoneNumber: data.phone_number,
        avatar: data.avatar_url,
        username: data.username,
        province: data.province,
        city: data.city,
        industry: data.industry,
        company: data.company,
        positionCategory: data.position_category,
        position: data.position,
        workStartTime: data.work_start_time,
        workEndTime: data.work_end_time,
        isProfileComplete: data.is_profile_complete,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };
    } catch (error: any) {
      throw new Error(`获取档案失败: ${error.message || error}`);
    }
  }

  /**
   * 上传头像
   * 注意：Supabase Storage 已不可用，头像使用内置 SVG 头像系统
   */
  public async uploadAvatar(userId: string, imageUri: string): Promise<string> {
    // 项目已迁移到内置 SVG 头像系统，不再使用 Supabase Storage
    console.warn('uploadAvatar: Supabase Storage 已禁用，请使用内置头像系统');
    return imageUri;
  }

  /**
   * 生成随机用户名
   */
  public async generateRandomUsername(): Promise<string> {
    try {
      const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
      const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
      const randomNum = Math.floor(Math.random() * 1000);

      let username = `${adjective}的${noun}${randomNum}`;

      let attempts = 0;
      while (attempts < 10) {
        const users = await get<any[]>('/users', {
          username: `eq.${username}`,
          select: 'id',
          limit: 1,
        });

        if (!users || users.length === 0) {
          return username;
        }

        const newAdjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
        const newNoun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
        const newNum = Math.floor(Math.random() * 10000);
        username = `${newAdjective}的${newNoun}${newNum}`;
        attempts++;
      }

      return `用户${Date.now()}`;
    } catch (error) {
      console.error('生成随机用户名失败:', error);
      return `用户${Date.now()}`;
    }
  }

  /**
   * 验证用户名
   */
  public async validateUsername(
    username: string,
    excludeUserId?: string,
  ): Promise<ValidationResult> {
    const basicValidation = ValidationService.validateUsername(username);
    if (!basicValidation.isValid) {
      return basicValidation;
    }

    // 检查敏感词
    const lowerUsername = username.toLowerCase();
    for (const word of SENSITIVE_WORDS) {
      if (lowerUsername.includes(word.toLowerCase())) {
        return {isValid: false, error: '用户名包含敏感词汇,请修改'};
      }
    }

    // 检查唯一性
    try {
      const params: any = {
        username: `eq.${username}`,
        select: 'id',
        limit: 1,
      };

      // 如果提供了 excludeUserId，排除该用户
      if (excludeUserId) {
        params.id = `neq.${excludeUserId}`;
      }

      const users = await get<any[]>('/users', params);

      if (users && users.length > 0) {
        return {isValid: false, error: '该用户名已被使用,请更换'};
      }

      return {isValid: true};
    } catch (error) {
      console.error('验证用户名唯一性失败:', error);
      return {isValid: false, error: '验证用户名失败,请重试'};
    }
  }

  /**
   * 验证档案完整性
   */
  public validateProfileCompletion(
    profileData: UserProfileData,
  ): ValidationResult {
    const errors: string[] = [];

    if (!profileData.username || profileData.username.trim() === '') {
      errors.push('用户名不能为空');
    }
    if (!profileData.province || profileData.province.trim() === '') {
      errors.push('省份不能为空');
    }
    if (!profileData.city || profileData.city.trim() === '') {
      errors.push('城市不能为空');
    }
    if (!profileData.industry || profileData.industry.trim() === '') {
      errors.push('行业不能为空');
    }
    if (!profileData.positionCategory || profileData.positionCategory.trim() === '') {
      errors.push('职位分类不能为空');
    }
    if (!profileData.position || profileData.position.trim() === '') {
      errors.push('职位不能为空');
    }
    if (!profileData.workStartTime || !profileData.workEndTime) {
      errors.push('工作时间不能为空');
    }

    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (profileData.workStartTime && !timeRegex.test(profileData.workStartTime)) {
      errors.push('上班时间格式不正确');
    }
    if (profileData.workEndTime && !timeRegex.test(profileData.workEndTime)) {
      errors.push('下班时间格式不正确');
    }

    if (errors.length > 0) {
      return {isValid: false, error: errors.join('; ')};
    }

    return {isValid: true};
  }

  /**
   * 更新手机号
   */
  public async updatePhoneNumber(
    userId: string,
    newPhone: string,
    smsCode: string,
  ): Promise<void> {
    try {
      const phoneValidation = ValidationService.validatePhoneNumber(newPhone);
      if (!phoneValidation.isValid) {
        throw new Error(phoneValidation.error || '手机号格式不正确');
      }

      const codeValidation = await SMSCodeService.verifyCode(newPhone, smsCode, 'bind');
      if (!codeValidation.isValid) {
        throw new Error(codeValidation.error || '验证码错误');
      }

      // 检查新手机号是否已被使用
      const existingUsers = await get<any[]>('/users', {
        phone_number: `eq.${newPhone}`,
        select: 'id',
        limit: 1,
      });

      if (existingUsers && existingUsers.length > 0 && existingUsers[0].id !== userId) {
        throw new Error('该手机号已被其他用户使用');
      }

      await patch(`/users?id=eq.${userId}`, {
        phone_number: newPhone,
        updated_at: new Date().toISOString(),
      });
    } catch (error: any) {
      throw new Error(`更新手机号失败: ${error.message || error}`);
    }
  }
}

// 导出单例实例
export const profileService = ProfileService.getInstance();
