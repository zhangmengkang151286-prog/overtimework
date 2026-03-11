// Enhanced Auth System - SMS Code Service

import {get, post, patch} from '../postgrestApi';
import {SMSVerificationCode, SMSCodeResponse} from '../../types/enhanced-auth';
import {SMS_PROVIDER} from '@env';
import {AliyunSMSProvider} from './AliyunSMSProvider';
import {TencentSMSProvider} from './TencentSMSProvider';

/**
 * SMSCodeService handles SMS verification code generation, sending, and validation
 */
export class SMSCodeService {
  // Code configuration
  private static readonly CODE_LENGTH = 6;
  private static readonly CODE_EXPIRY_MINUTES = 10; // 验证码有效期10分钟
  private static readonly RATE_LIMIT_SECONDS = 60; // 1 minute between sends

  /**
   * Generate a 6-digit random verification code
   * @returns 6-digit string
   */
  static generateCode(): string {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    return code;
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
      await post('/sms_verification_codes', {
        phone_number: phoneNumber,
        code,
        purpose,
        expires_at: expiresAt.toISOString(),
        is_used: false,
      });

      console.log('✅ [SMS Debug] Stored in database successfully');

      // Send SMS via configured provider
      console.log('🔍 [SMS Debug] Calling sendSMSViaProvider...');
      await this.sendSMSViaProvider(phoneNumber, code, purpose);
      console.log('✅ [SMS Debug] SMS sent successfully');

      return {
        success: true,
      };
    } catch (error) {
      console.error('❌ [SMS Debug] Unexpected error:', error);
      return {
        success: false,
        error: '发送验证码失败，请重试',
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
   * Clean up expired verification codes (should be called periodically)
   * @returns Number of codes deleted
   */
  static async cleanupExpiredCodes(): Promise<number> {
    try {
      const now = new Date();

      // PostgREST 不直接返回删除的行数，我们先查询再删除
      const expiredCodes = await get<any[]>('/sms_verification_codes', {
        expires_at: `lt.${now.toISOString()}`,
      });

      if (expiredCodes && expiredCodes.length > 0) {
        // 删除过期的验证码
        await Promise.all(
          expiredCodes.map(code =>
            patch(`/sms_verification_codes?id=eq.${code.id}`, {
              is_used: true, // 标记为已使用而不是删除
            }),
          ),
        );
        return expiredCodes.length;
      }

      return 0;
    } catch (error) {
      console.error('Error in cleanupExpiredCodes:', error);
      return 0;
    }
  }

  /**
   * Send SMS via configured provider (Aliyun, Tencent, or development mode)
   * @param phoneNumber - Phone number to send to
   * @param code - Verification code
   * @param purpose - Purpose of the code
   */
  private static async sendSMSViaProvider(
    phoneNumber: string,
    code: string,
    purpose: string,
  ): Promise<void> {
    const provider = SMS_PROVIDER || 'none';

    console.log('🔍 [SMS Provider] Provider:', provider);
    console.log('🔍 [SMS Provider] Phone:', phoneNumber);
    console.log('🔍 [SMS Provider] Code:', code);
    console.log('🔍 [SMS Provider] Purpose:', purpose);

    // Development mode - just log the code
    if (provider === 'none') {
      console.log(
        `[SMS Code] Phone: ${phoneNumber}, Code: ${code}, Purpose: ${purpose}`,
      );
      console.log('💡 Tip: Configure SMS_PROVIDER in .env to send real SMS');
      return;
    }

    try {
      if (provider === 'aliyun') {
        console.log('🔍 [SMS Provider] Using Aliyun SMS...');
        const smsProvider = new AliyunSMSProvider();
        console.log('🔍 [SMS Provider] AliyunSMSProvider initialized');
        await smsProvider.sendCode(phoneNumber, code, purpose);
        console.log('[SMS] Sent via Aliyun successfully');
      } else if (provider === 'tencent') {
        const smsProvider = new TencentSMSProvider();
        await smsProvider.sendCode(phoneNumber, code, purpose);
        console.log('[SMS] Sent via Tencent Cloud successfully');
      } else {
        throw new Error(
          `Unknown SMS provider: ${provider}. Use 'aliyun', 'tencent', or 'none'`,
        );
      }
    } catch (error: any) {
      console.error('❌ [SMS Provider] Error:', error);
      throw new Error(error.message || '短信发送失败');
    }
  }
}
