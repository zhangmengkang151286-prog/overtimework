// Enhanced Auth System - Validation Service

import {ValidationResult} from '../../types/enhanced-auth';

/**
 * ValidationService provides validation functions for user input
 * including phone numbers, passwords, and usernames.
 */
export class ValidationService {
  // Phone number validation - Chinese mobile phone format
  private static readonly PHONE_REGEX = /^1[3-9]\d{9}$/;

  // Password validation - at least 8 characters, including letters and numbers
  private static readonly PASSWORD_MIN_LENGTH = 8;
  private static readonly PASSWORD_REGEX =
    /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;

  // Username validation
  private static readonly USERNAME_MIN_LENGTH = 2;
  private static readonly USERNAME_MAX_LENGTH = 20;
  private static readonly USERNAME_REGEX = /^[\u4e00-\u9fa5a-zA-Z0-9_]+$/;

  // Sensitive words (basic list, should be expanded in production)
  private static readonly SENSITIVE_WORDS = [
    'admin',
    'administrator',
    'root',
    'system',
    'test',
    '管理员',
    '系统',
    '测试',
  ];

  /**
   * Validate Chinese mobile phone number format
   * @param phoneNumber - Phone number to validate
   * @returns ValidationResult with isValid and optional error message
   */
  static validatePhoneNumber(phoneNumber: string): ValidationResult {
    if (!phoneNumber || phoneNumber.trim() === '') {
      return {
        isValid: false,
        error: '请输入手机号',
      };
    }

    const trimmed = phoneNumber.trim();

    if (!this.PHONE_REGEX.test(trimmed)) {
      return {
        isValid: false,
        error: '请输入有效的手机号码',
      };
    }

    return {isValid: true};
  }

  /**
   * Validate password strength
   * Password must be at least 8 characters and contain both letters and numbers
   * @param password - Password to validate
   * @returns ValidationResult with isValid and optional error message
   */
  static validatePassword(password: string): ValidationResult {
    if (!password || password.trim() === '') {
      return {
        isValid: false,
        error: '请输入密码',
      };
    }

    if (password.length < this.PASSWORD_MIN_LENGTH) {
      return {
        isValid: false,
        error: `密码长度至少为${this.PASSWORD_MIN_LENGTH}个字符`,
      };
    }

    if (!this.PASSWORD_REGEX.test(password)) {
      return {
        isValid: false,
        error: '密码必须包含字母和数字',
      };
    }

    return {isValid: true};
  }

  /**
   * Validate username
   * Username must be 2-20 characters, contain only Chinese characters, letters, numbers, and underscores
   * and must not contain sensitive words
   * @param username - Username to validate
   * @returns ValidationResult with isValid and optional error message
   */
  static validateUsername(username: string): ValidationResult {
    if (!username || username.trim() === '') {
      return {
        isValid: false,
        error: '请输入用户名',
      };
    }

    const trimmed = username.trim();

    if (trimmed.length < this.USERNAME_MIN_LENGTH) {
      return {
        isValid: false,
        error: `用户名长度至少为${this.USERNAME_MIN_LENGTH}个字符`,
      };
    }

    if (trimmed.length > this.USERNAME_MAX_LENGTH) {
      return {
        isValid: false,
        error: `用户名长度不能超过${this.USERNAME_MAX_LENGTH}个字符`,
      };
    }

    if (!this.USERNAME_REGEX.test(trimmed)) {
      return {
        isValid: false,
        error: '用户名只能包含中文、字母、数字和下划线',
      };
    }

    // Check for sensitive words
    const lowerUsername = trimmed.toLowerCase();
    for (const word of this.SENSITIVE_WORDS) {
      if (lowerUsername.includes(word.toLowerCase())) {
        return {
          isValid: false,
          error: '用户名包含敏感词汇',
        };
      }
    }

    return {isValid: true};
  }

  /**
   * Validate SMS verification code format
   * Code must be exactly 6 digits
   * @param code - Verification code to validate
   * @returns ValidationResult with isValid and optional error message
   */
  static validateSMSCode(code: string): ValidationResult {
    if (!code || code.trim() === '') {
      return {
        isValid: false,
        error: '请输入验证码',
      };
    }

    const trimmed = code.trim();

    if (!/^\d{6}$/.test(trimmed)) {
      return {
        isValid: false,
        error: '验证码必须为6位数字',
      };
    }

    return {isValid: true};
  }

  /**
   * Validate work time format (HH:mm)
   * @param time - Time string to validate
   * @returns ValidationResult with isValid and optional error message
   */
  static validateWorkTime(time: string): ValidationResult {
    if (!time || time.trim() === '') {
      return {
        isValid: false,
        error: '请选择时间',
      };
    }

    if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(time)) {
      return {
        isValid: false,
        error: '时间格式不正确',
      };
    }

    return {isValid: true};
  }

  /**
   * Validate work time range
   * Start time must be before end time
   * @param startTime - Start time (HH:mm)
   * @param endTime - End time (HH:mm)
   * @returns ValidationResult with isValid and optional error message
   */
  static validateWorkTimeRange(
    startTime: string,
    endTime: string,
  ): ValidationResult {
    const startValidation = this.validateWorkTime(startTime);
    if (!startValidation.isValid) {
      return startValidation;
    }

    const endValidation = this.validateWorkTime(endTime);
    if (!endValidation.isValid) {
      return endValidation;
    }

    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;

    if (startMinutes >= endMinutes) {
      return {
        isValid: false,
        error: '下班时间必须晚于上班时间',
      };
    }

    return {isValid: true};
  }
}
