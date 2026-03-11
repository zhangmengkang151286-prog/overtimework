// Enhanced Auth System - Aliyun SMS Provider
// 阿里云短信服务提供商

/**
 * AliyunSMSProvider handles SMS sending via Aliyun SMS Service
 * Uses direct HTTP API calls instead of SDK for React Native compatibility
 *
 * Setup Instructions:
 * 1. Get credentials from: https://ram.console.aliyun.com/manage/ak
 * 2. Configure environment variables in .env
 *
 * Documentation: https://help.aliyun.com/document_detail/101414.html
 */

import {
  ALIYUN_ACCESS_KEY_ID,
  ALIYUN_ACCESS_KEY_SECRET,
  ALIYUN_SMS_SIGN_NAME,
  ALIYUN_SMS_TEMPLATE_REGISTER,
  ALIYUN_SMS_TEMPLATE_LOGIN,
  ALIYUN_SMS_TEMPLATE_BIND,
  ALIYUN_SMS_TEMPLATE_RESET,
} from '@env';
import CryptoJS from 'crypto-js';

export class AliyunSMSProvider {
  private accessKeyId: string;
  private accessKeySecret: string;
  private signName: string;
  private templates: Record<string, string>;
  private endpoint = 'https://dysmsapi.aliyuncs.com';

  constructor() {
    this.accessKeyId = ALIYUN_ACCESS_KEY_ID || '';
    this.accessKeySecret = ALIYUN_ACCESS_KEY_SECRET || '';
    this.signName = ALIYUN_SMS_SIGN_NAME || '';
    this.templates = {
      register: ALIYUN_SMS_TEMPLATE_REGISTER || '',
      login: ALIYUN_SMS_TEMPLATE_LOGIN || '',
      bind: ALIYUN_SMS_TEMPLATE_BIND || '',
      reset_password: ALIYUN_SMS_TEMPLATE_RESET || '',
    };

    console.log('[Aliyun SMS] Provider initialized');
    console.log('[Aliyun SMS] AccessKeyId:', this.accessKeyId ? '已配置' : '未配置');
    console.log('[Aliyun SMS] SignName:', this.signName ? '已配置' : '未配置');
  }

  /**
   * Generate signature for Aliyun API request
   */
  private generateSignature(
    params: Record<string, string>,
    method: string = 'POST',
  ): string {
    // Sort parameters
    const sortedKeys = Object.keys(params).sort();
    const canonicalizedQueryString = sortedKeys
      .map(
        key => `${this.percentEncode(key)}=${this.percentEncode(params[key])}`,
      )
      .join('&');

    // Create string to sign
    const stringToSign = `${method}&${this.percentEncode('/')}&${this.percentEncode(canonicalizedQueryString)}`;

    // Calculate HMAC-SHA1 signature
    const signature = CryptoJS.HmacSHA1(
      stringToSign,
      this.accessKeySecret + '&',
    );
    return CryptoJS.enc.Base64.stringify(signature);
  }

  /**
   * Percent encode for URL
   */
  private percentEncode(str: string): string {
    return encodeURIComponent(str)
      .replace(/!/g, '%21')
      .replace(/'/g, '%27')
      .replace(/\(/g, '%28')
      .replace(/\)/g, '%29')
      .replace(/\*/g, '%2A');
  }

  /**
   * Generate UUID for request
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Send SMS verification code via Aliyun
   * @param phoneNumber - Phone number (11 digits)
   * @param code - 6-digit verification code
   * @param purpose - Purpose of the SMS (register, login, bind, reset_password)
   */
  async sendCode(
    phoneNumber: string,
    code: string,
    purpose: string,
  ): Promise<void> {
    // Validate configuration before sending
    if (!this.accessKeyId || !this.accessKeySecret) {
      throw new Error('阿里云短信服务未配置，请检查环境变量');
    }

    if (!this.signName) {
      throw new Error('阿里云短信签名未配置，请检查环境变量');
    }

    const templateCode = this.templates[purpose];
    if (!templateCode) {
      throw new Error(`未找到短信模板: ${purpose}`);
    }

    console.log('[Aliyun SMS] Initializing with credentials...');
    console.log('[Aliyun SMS] Sending SMS to:', phoneNumber);

    // Common parameters
    const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
    const params: Record<string, string> = {
      AccessKeyId: this.accessKeyId,
      Action: 'SendSms',
      Format: 'JSON',
      PhoneNumbers: phoneNumber,
      SignName: this.signName,
      SignatureMethod: 'HMAC-SHA1',
      SignatureNonce: this.generateUUID(),
      SignatureVersion: '1.0',
      TemplateCode: templateCode,
      TemplateParam: JSON.stringify({code}),
      Timestamp: timestamp,
      Version: '2017-05-25',
    };

    // Generate signature
    const signature = this.generateSignature(params);
    params.Signature = signature;

    // Build query string
    const queryString = Object.keys(params)
      .sort()
      .map(
        key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`,
      )
      .join('&');

    const url = `${this.endpoint}/?${queryString}`;

    try {
      console.log('[Aliyun SMS] Making HTTP request...');
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const result = await response.json();

      if (result.Code !== 'OK') {
        console.error('[Aliyun SMS] API error:', result);
        throw new Error(`SMS send failed: ${result.Message || result.Code}`);
      }

      console.log('[Aliyun SMS] Sent successfully:', result.BizId);
    } catch (error: any) {
      console.error('[Aliyun SMS] Error:', error);
      throw new Error(`短信发送失败: ${error.message}`);
    }
  }

  /**
   * Validate phone number format
   * @param phoneNumber - Phone number to validate
   * @returns true if valid Chinese mobile number
   */
  static validatePhoneNumber(phoneNumber: string): boolean {
    // Chinese mobile number: 11 digits, starts with 1
    const regex = /^1[3-9]\d{9}$/;
    return regex.test(phoneNumber);
  }
}
