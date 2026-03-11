// Enhanced Auth System - Tencent Cloud SMS Provider
// 腾讯云短信服务提供商

/**
 * TencentSMSProvider handles SMS sending via Tencent Cloud SMS Service
 *
 * Setup Instructions:
 * 1. Install SDK: npm install tencentcloud-sdk-nodejs
 * 2. Get credentials from: https://console.cloud.tencent.com/cam/capi
 * 3. Configure environment variables in .env
 *
 * Documentation: https://cloud.tencent.com/document/product/382/52077
 */

// Uncomment when SDK is installed:
// const tencentcloud = require('tencentcloud-sdk-nodejs');

export class TencentSMSProvider {
  private client: any;
  private appId: string;
  private signName: string;
  private templates: Record<string, string>;

  constructor() {
    try {
      // Uncomment when SDK is installed:
      // const SmsClient = tencentcloud.sms.v20210111.Client;
      //
      // this.client = new SmsClient({
      //   credential: {
      //     secretId: process.env.TENCENT_SECRET_ID,
      //     secretKey: process.env.TENCENT_SECRET_KEY,
      //   },
      //   region: 'ap-guangzhou',
      //   profile: {
      //     httpProfile: {
      //       endpoint: 'sms.tencentcloudapi.com',
      //     },
      //   },
      // });

      this.appId = process.env.TENCENT_SMS_APP_ID || '';
      this.signName = process.env.TENCENT_SMS_SIGN_NAME || '';
      this.templates = {
        register: process.env.TENCENT_SMS_TEMPLATE_REGISTER || '',
        login: process.env.TENCENT_SMS_TEMPLATE_LOGIN || '',
        bind: process.env.TENCENT_SMS_TEMPLATE_BIND || '',
        reset_password: process.env.TENCENT_SMS_TEMPLATE_RESET || '',
      };

      // Validate configuration
      if (!this.appId) {
        throw new Error('TENCENT_SMS_APP_ID is not configured');
      }

      if (!this.signName) {
        throw new Error('TENCENT_SMS_SIGN_NAME is not configured');
      }

      if (!process.env.TENCENT_SECRET_ID || !process.env.TENCENT_SECRET_KEY) {
        throw new Error('Tencent Cloud credentials are not configured');
      }
    } catch (error) {
      console.error('Failed to initialize Tencent SMS Provider:', error);
      throw error;
    }
  }

  /**
   * Send SMS verification code via Tencent Cloud
   * @param phoneNumber - Phone number (11 digits)
   * @param code - 6-digit verification code
   * @param purpose - Purpose of the SMS (register, login, bind, reset_password)
   */
  async sendCode(
    phoneNumber: string,
    code: string,
    purpose: string,
  ): Promise<void> {
    const templateId = this.templates[purpose];

    if (!templateId) {
      throw new Error(`No template configured for purpose: ${purpose}`);
    }

    // Tencent Cloud requires +86 prefix for Chinese numbers
    const formattedPhone = phoneNumber.startsWith('+86')
      ? phoneNumber
      : `+86${phoneNumber}`;

    const params = {
      SmsSdkAppId: this.appId,
      SignName: this.signName,
      TemplateId: templateId,
      TemplateParamSet: [code], // Tencent uses array of parameters
      PhoneNumberSet: [formattedPhone],
    };

    try {
      // Uncomment when SDK is installed:
      // const result = await this.client.SendSms(params);
      //
      // if (result.SendStatusSet && result.SendStatusSet[0]) {
      //   const status = result.SendStatusSet[0];
      //   if (status.Code !== 'Ok') {
      //     throw new Error(`SMS send failed: ${status.Message}`);
      //   }
      //   console.log('[Tencent SMS] Sent successfully:', status.SerialNo);
      // } else {
      //   throw new Error('SMS send failed: No response from server');
      // }

      // Temporary: Log for development
      console.log('[Tencent SMS] Would send:', {
        phone: formattedPhone,
        code,
        purpose,
        template: templateId,
      });
    } catch (error: any) {
      console.error('Tencent SMS error:', error);
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
    // Also accept +86 prefix
    const regex = /^(\+86)?1[3-9]\d{9}$/;
    return regex.test(phoneNumber);
  }
}
