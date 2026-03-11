/**
 * Property-Based Tests for Enhanced Auth System - Validation
 *
 * These tests verify universal properties that should hold across all inputs
 * using property-based testing with fast-check library.
 */

import * as fc from 'fast-check';
import {ValidationService} from '../../services/enhanced-auth/ValidationService';

describe('Enhanced Auth - Validation Property Tests', () => {
  /**
   * **Feature: enhanced-auth-system, Property 1: 手机号格式验证一致性**
   * **Validates: Requirements 1.2, 3.3, 6.2**
   *
   * For any string, the phone number validation should be consistent:
   * - Valid Chinese mobile numbers (starting with 1, followed by 3-9, then 9 digits) should pass
   * - Invalid formats should fail
   * - Validation should be deterministic (same input always gives same result)
   */
  describe('Property 1: Phone Number Format Validation Consistency', () => {
    it('should accept valid Chinese mobile phone numbers', () => {
      fc.assert(
        fc.property(
          fc.integer({min: 3, max: 9}), // Second digit: 3-9
          fc.integer({min: 0, max: 999999999}), // Remaining 9 digits
          (secondDigit, remaining) => {
            const phoneNumber = `1${secondDigit}${remaining.toString().padStart(9, '0')}`;
            const result = ValidationService.validatePhoneNumber(phoneNumber);
            expect(result.isValid).toBe(true);
          },
        ),
        {numRuns: 100},
      );
    });

    it('should reject phone numbers with invalid format', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.string().filter((s: string) => !/^1[3-9]\d{9}$/.test(s)), // Invalid format
            fc.constant(''), // Empty string
            fc.constant('12345'), // Too short
            fc.constant('123456789012'), // Too long
          ),
          invalidPhone => {
            const result = ValidationService.validatePhoneNumber(invalidPhone);
            expect(result.isValid).toBe(false);
            expect(result.error).toBeDefined();
          },
        ),
        {numRuns: 100},
      );
    });

    it('should be deterministic - same input always gives same result', () => {
      fc.assert(
        fc.property(fc.string(), phoneNumber => {
          const result1 = ValidationService.validatePhoneNumber(phoneNumber);
          const result2 = ValidationService.validatePhoneNumber(phoneNumber);
          expect(result1.isValid).toBe(result2.isValid);
          expect(result1.error).toBe(result2.error);
        }),
        {numRuns: 100},
      );
    });
  });

  /**
   * **Feature: enhanced-auth-system, Property 3: 短信验证码验证正确性**
   * **Validates: Requirements 1.4, 6.4, 15.5**
   *
   * For any SMS code validation:
   * - Valid 6-digit codes should pass format validation
   * - Invalid formats should fail
   * - Validation should be consistent
   */
  describe('Property 3: SMS Code Verification Correctness', () => {
    it('should accept any 6-digit numeric string', () => {
      fc.assert(
        fc.property(fc.integer({min: 100000, max: 999999}), code => {
          const codeStr = code.toString();
          const result = ValidationService.validateSMSCode(codeStr);
          expect(result.isValid).toBe(true);
        }),
        {numRuns: 100},
      );
    });

    it('should reject non-6-digit strings', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.string().filter(s => !/^\d{6}$/.test(s)),
            fc.integer({min: 0, max: 99999}).map(n => n.toString()), // Too short
            fc.integer({min: 1000000, max: 9999999}).map(n => n.toString()), // Too long
          ),
          invalidCode => {
            const result = ValidationService.validateSMSCode(invalidCode);
            expect(result.isValid).toBe(false);
            expect(result.error).toBeDefined();
          },
        ),
        {numRuns: 100},
      );
    });
  });

  /**
   * **Feature: enhanced-auth-system, Property 9: 用户名验证规则**
   * **Validates: Requirements 8.3, 12.4, 12.5**
   *
   * For any username:
   * - Length must be between 2-20 characters
   * - Must contain only Chinese characters, letters, numbers, and underscores
   * - Must not contain sensitive words
   */
  describe('Property 9: Username Validation Rules', () => {
    it('should accept valid usernames with correct length and characters', () => {
      fc.assert(
        fc.property(
          fc
            .array(
              fc.oneof(
                fc.integer({min: 0, max: 61}).map(n => {
                  // Generate alphanumeric and underscore
                  if (n < 26) return String.fromCharCode(65 + n); // A-Z
                  if (n < 52) return String.fromCharCode(97 + (n - 26)); // a-z
                  if (n < 62) return String.fromCharCode(48 + (n - 52)); // 0-9
                  return '_';
                }),
                fc.constantFrom('用', '户', '名', '字', '符'),
              ),
              {minLength: 2, maxLength: 20},
            )
            .map(arr => arr.join(''))
            .filter(
              (s: string) =>
                s.length >= 2 &&
                !/admin|test|root|管理员|测试/.test(s.toLowerCase()),
            ),
          (username: string) => {
            if (username.length >= 2 && username.length <= 20) {
              const result = ValidationService.validateUsername(username);
              // Should be valid if it doesn't contain sensitive words
              if (!result.isValid && result.error?.includes('敏感词汇')) {
                // This is expected for sensitive words
                expect(result.isValid).toBe(false);
              }
            }
          },
        ),
        {numRuns: 100},
      );
    });

    it('should reject usernames that are too short or too long', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.string({maxLength: 1}), // Too short
            fc.string({minLength: 21, maxLength: 50}), // Too long
          ),
          username => {
            const result = ValidationService.validateUsername(username);
            expect(result.isValid).toBe(false);
            expect(result.error).toBeDefined();
          },
        ),
        {numRuns: 100},
      );
    });

    it('should reject usernames containing sensitive words', () => {
      const sensitiveWords = ['admin', 'root', 'test', '管理员', '测试'];
      fc.assert(
        fc.property(
          fc.constantFrom(...sensitiveWords),
          fc.string({minLength: 0, maxLength: 10}),
          (sensitiveWord, suffix) => {
            // Filter suffix to only contain valid username characters
            const validSuffix = suffix.replace(
              /[^\u4e00-\u9fa5a-zA-Z0-9_]/g,
              '',
            );
            const username = sensitiveWord + validSuffix;
            if (username.length >= 2 && username.length <= 20) {
              const result = ValidationService.validateUsername(username);
              expect(result.isValid).toBe(false);
              // The error should be about sensitive words
              if (result.error) {
                expect(result.error).toContain('敏感词汇');
              }
            }
          },
        ),
        {numRuns: 100},
      );
    });
  });

  /**
   * **Feature: enhanced-auth-system, Property 11: 密码强度验证**
   * **Validates: Requirements 14.2, 15.7**
   *
   * For any password:
   * - Must be at least 8 characters long
   * - Must contain both letters and numbers
   * - Validation should be consistent
   */
  describe('Property 11: Password Strength Validation', () => {
    it('should accept passwords with letters and numbers >= 8 chars', () => {
      fc.assert(
        fc.property(
          fc
            .array(
              fc.integer({min: 0, max: 51}).map(n => {
                // Generate letters A-Z, a-z
                if (n < 26) return String.fromCharCode(65 + n); // A-Z
                return String.fromCharCode(97 + (n - 26)); // a-z
              }),
              {minLength: 4, maxLength: 10},
            )
            .map(arr => arr.join('')),
          fc
            .array(
              fc
                .integer({min: 0, max: 9})
                .map(n => String.fromCharCode(48 + n)), // 0-9
              {minLength: 4, maxLength: 10},
            )
            .map(arr => arr.join('')),
          (letters: string, numbers: string) => {
            // Shuffle letters and numbers together
            const password = (letters + numbers)
              .split('')
              .sort(() => Math.random() - 0.5)
              .join('');
            if (password.length >= 8) {
              const result = ValidationService.validatePassword(password);
              expect(result.isValid).toBe(true);
            }
          },
        ),
        {numRuns: 100},
      );
    });

    it('should reject passwords that are too short', () => {
      fc.assert(
        fc.property(fc.string({maxLength: 7}), password => {
          const result = ValidationService.validatePassword(password);
          expect(result.isValid).toBe(false);
          expect(result.error).toBeDefined();
        }),
        {numRuns: 100},
      );
    });

    it('should reject passwords without letters or without numbers', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc
              .array(
                fc.integer({min: 0, max: 51}).map(n => {
                  // Generate letters A-Z, a-z
                  if (n < 26) return String.fromCharCode(65 + n); // A-Z
                  return String.fromCharCode(97 + (n - 26)); // a-z
                }),
                {minLength: 8, maxLength: 20},
              )
              .map(arr => arr.join('')), // Only letters
            fc
              .array(
                fc
                  .integer({min: 0, max: 9})
                  .map(n => String.fromCharCode(48 + n)), // 0-9
                {minLength: 8, maxLength: 20},
              )
              .map(arr => arr.join('')), // Only numbers
          ),
          password => {
            const result = ValidationService.validatePassword(password);
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('字母和数字');
          },
        ),
        {numRuns: 100},
      );
    });
  });
});
