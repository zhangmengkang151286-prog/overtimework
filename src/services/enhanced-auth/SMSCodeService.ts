// Enhanced Auth System - SMS Code Service
// 短信通过 ECS 后端发送，不再从客户端直连阿里云

import * as ExpoCrypto from 'expo-crypto';
import {get, post, patch, del} from '../postgrestApi';
import {SMSVerificationCode, SMSCodeResponse} from '../../types/enhanced-auth';

/**
 * SMSCodeService handles SMS verification code generation, sending, and validation
 */
export class SMSCodeService {
  // Code configuration
  private static readonly CODE_LENGTH = 6;
  private static readonly CODE_EXPIRY_MINUTES = 10; // 验证码有效期10分钟
  private static readonly RATE_LIMIT_SECONDS = 60; // 1 minute between sends

  /**
   * 生成 6 位密码学安全的随机验证码
   * 使用 expo-crypto 的 getRandomBytes 替代 Web crypto API
   * @returns 6 位数字字符串
   */
  static generateCode(): string {
    // expo-crypto 在 React Native 环境下可用
    const randomBytes = ExpoCrypto.getRandomBytes(4);
    // 将 4 字节转为 Uint32
    const value =
      (randomBytes[0] << 24) |
      (randomBytes[1] << 16) |
      (randomBytes[2] << 8) |
      randomBytes[3];
    // 取绝对值后取模，确保结果在 100000-999999 之间
    const code = (Math.abs(value) % 900000) + 100000;
    return code.toString();
  }

  /**
   * Check if user can request a new SMS code (rate limiting)
   * @param phoneNumber - Phone number to check
   * @returns true if user can request a new code
   */
  static async canRequestCode(
    phoneNumber: string,
  ): Promise<{canRequest: boolean; retryAt?: Date}> {
    try {
      const rateLimitTime = new Date(
        Date.now() - this.RATE_LIMIT_SECONDS * 1000,
      );

      const data = await get<any[]>('/sms_verification_codes', {
        phone_number: `eq.${phoneNumber}`,
        created_at: `gte.${rateLimitTime.toISOString()}`,
        order: 'created_at.desc',
        limit: 1,
      });

      if (data && data.length > 0) {
        const lastCodeTime = new Date(data[0].created_at);
        const retryAt = new Date(
          lastCodeTime.getTime() + this.RATE_LIMIT_SECONDS * 1000,
        );
        return {canRequest: false, retryAt};
      }

      return {canRequest: true};
    } catch (error) {
      console.error('Error checking rate limit:', error);
      return {canRequest: true};
    }
  }

  /**
   * Send SMS verification code to phone number
   * @param phoneNumber - Phone number to send code to
   * @param purpose - Purpose of the code (register, login, bind, reset_password)
   * @returns SMSCodeResponse with success status and optional error
   */
  static async sendCode(
    phoneNumber: string,
    purpose: 'register' | 'login' | 'bind' | 'reset_password',
  ): Promise<SMSCodeResponse> {
    try {
      console.log('🔍 [SMS Debug] Starting sendCode...');
      console.log('🔍 [SMS Debug] Phone:', phoneNumber);
      console.log('🔍 [SMS Debug] Purpose:', purpose);

      // Check rate limiting
      const {canRequest, retryAt} = await this.canRequestCode(phoneNumber);
      if (!canRequest) {
        console.log('🔍 [SMS Debug] Rate limited');
        return {
          success: false,
          error: '发送过于频繁，请稍后再试',
          canRetryAt: retryAt?.toISOString(),
        };
      }

      // Generate code
      const code = this.generateCode();
      const expiresAt = new Date(
        Date.now() + this.CODE_EXPIRY_MINUTES * 60 * 1000,
      );

      console.log('🔍 [SMS Debug] Generated code:', code);
      console.log('🔍 [SMS Debug] Expires at:', expiresAt.toISOString());

      // Store code in database
      console.log('🔍 [SMS Debug] Attempting to store in database...');
      const [savedCode] = (await post('/sms_verification_codes', {
        phone_number: phoneNumber,
        code,
        purpose,
        expires_at: expiresAt.toISOString(),
        is_used: false,
      })) as any[];

      console.log('✅ [SMS Debug] Stored in database successfully');

      // Send SMS via configured provider
      // 如果发送失败，将数据库记录标记为已使用，避免频率限制阻止用户重试
      console.log('🔍 [SMS Debug] Calling sendSMSViaProvider...');
      try {
        await this.sendSMSViaProvider(phoneNumber, code, purpose);
        console.log('✅ [SMS Debug] SMS sent successfully');
      } catch (smsError: any) {
        console.error('❌ [SMS Debug] SMS send failed, releasing rate limit:', smsError);
        // 释放频率限制，让用户可以立即重试
        if (savedCode?.id) {
          try {
            await patch(`/sms_verification_codes?id=eq.${savedCode.id}`, {is_used: true});
          } catch (patchError) {
            console.error('❌ [SMS Debug] Failed to release rate limit:', patchError);
          }
        }
        // 透传真实错误信息
        return {
          success: false,
          error: smsError.message || '短信发送失败，请稍后重试',
        };
      }

      return {
        success: true,
      };
    } catch (error: any) {
      console.error('❌ [SMS Debug] Unexpected error:', error);
      return {
        success: false,
        error: error.message || '发送验证码失败，请重试',
      };
    }
  }

  /**
   * Verify SMS code for a phone number
   * @param phoneNumber - Phone number to verify
   * @param code - Verification code to check
   * @param purpose - Purpose of the code
   * @returns true if code is valid and not expired
   */
  static async verifyCode(
    phoneNumber: string,
    code: string,
    purpose: 'register' | 'login' | 'bind' | 'reset_password',
  ): Promise<{isValid: boolean; error?: string}> {
    try {
      const now = new Date();

      // Find matching code
      const data = await get<any[]>('/sms_verification_codes', {
        phone_number: `eq.${phoneNumber}`,
        code: `eq.${code}`,
        purpose: `eq.${purpose}`,
        is_used: `eq.false`,
        expires_at: `gte.${now.toISOString()}`,
        order: 'created_at.desc',
        limit: 1,
      });

      if (!data || data.length === 0) {
        return {
          isValid: false,
          error: '验证码错误或已过期',
        };
      }

      // Mark code as used
      try {
        await patch(`/sms_verification_codes?id=eq.${data[0].id}`, {
          is_used: true,
        });
      } catch (updateError) {
        console.error('Error marking code as used:', updateError);
        // Still return success since verification passed
      }

      return {isValid: true};
    } catch (error) {
      console.error('Error in verifyCode:', error);
      return {
        isValid: false,
        error: '验证失败，请重试',
      };
    }
  }

  /**
   * 清理过期验证码（真正删除，防止表无限增长）
   * 建议在数据库层用 pg_cron 定时执行，客户端调用仅作为补充
   * @returns 删除的记录数
   */
  static async cleanupExpiredCodes(): Promise<number> {
    try {
      const now = new Date();

      // 先查询过期记录数量
      const expiredCodes = await get<any[]>('/sms_verification_codes', {
        expires_at: `lt.${now.toISOString()}`,
        select: 'id',
      });

      const count = expiredCodes?.length || 0;
      if (count === 0) return 0;

      // 批量删除所有过期 + 已使用的记录
      // PostgREST 支持 DELETE + 查询条件
      const ids = expiredCodes.map(c => c.id);
      await Promise.all(
        ids.map(id => del(`/sms_verification_codes?id=eq.${id}`, {})),
      );

      return count;
    } catch (error) {
      console.error('清理过期验证码失败:', error);
      return 0;
    }
  }

  /**
   * 通过 ECS 后端 API 发送短信
   * 前端不再直连阿里云 dysmsapi.aliyuncs.com，AccessKey 只存在服务器上
   */
  private static async sendSMSViaProvider(
    phoneNumber: string,
    code: string,
    purpose: string,
  ): Promise<void> {
    const SMS_API_URL = 'https://api.gonia.net/sms/send';

    // 读取 API Key（与 postgrestApi.ts 保持一致）
    let apiKey = '';
    try {
      const Constants = require('expo-constants').default;
      apiKey = Constants.expoConfig?.extra?.API_KEY || '';
    } catch {
      // 忽略，测试环境可能没有 expo-constants
    }

    console.log('🔍 [SMS] 通过后端发送短信...');
    console.log('🔍 [SMS] Phone:', phoneNumber, 'Purpose:', purpose);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(SMS_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? {'X-API-Key': apiKey} : {}),
        },
        body: JSON.stringify({phoneNumber, code, purpose}),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const result = await response.json();

      if (!result.success) {
        console.error('❌ [SMS] 后端返回错误:', result.error);
        throw new Error(result.error || '短信发送失败');
      }

      console.log('✅ [SMS] 短信发送成功');
    } catch (error: any) {
      console.error('❌ [SMS] 发送异常:', error);
      if (error?.name === 'AbortError') {
        throw new Error('短信服务连接超时，请检查网络后重试');
      }
      if (error.message?.includes('短信') || error.message?.includes('SMS')) {
        throw error;
      }
      throw new Error('短信发送失败，请检查网络后重试');
    }
  }
}
