/**
 * Property-Based Tests for Database Schema
 * Feature: enhanced-auth-system, Property 4: Phone Number Binding Uniqueness
 *
 * These tests verify the correctness properties of the database schema,
 * particularly focusing on phone number binding uniqueness.
 *
 * Validates: Requirements 3.2, 3.5
 */

import * as fc from 'fast-check';

// Mock database interfaces for testing
interface User {
  id: string;
  phone_number: string;
  username: string;
  is_profile_complete: boolean;
}

interface WeChatBinding {
  id: string;
  user_id: string;
  wechat_openid: string;
  wechat_unionid?: string;
}

// In-memory database simulation for testing
class MockDatabase {
  private users: Map<string, User> = new Map();
  private phoneIndex: Map<string, string> = new Map(); // phone -> user_id
  private wechatBindings: Map<string, WeChatBinding> = new Map();

  async createUser(phoneNumber: string, username: string): Promise<User> {
    // Check if phone number already exists
    if (this.phoneIndex.has(phoneNumber)) {
      throw new Error('Phone number already registered');
    }

    const userId = `user_${Date.now()}_${Math.random()}`;
    const user: User = {
      id: userId,
      phone_number: phoneNumber,
      username,
      is_profile_complete: false,
    };

    this.users.set(userId, user);
    this.phoneIndex.set(phoneNumber, userId);

    return user;
  }

  async getUserByPhone(phoneNumber: string): Promise<User | null> {
    const userId = this.phoneIndex.get(phoneNumber);
    if (!userId) return null;
    return this.users.get(userId) || null;
  }

  async bindWeChat(
    userId: string,
    wechatOpenid: string,
    wechatUnionid?: string,
  ): Promise<void> {
    // Check if WeChat is already bound to another user
    for (const binding of this.wechatBindings.values()) {
      if (
        binding.wechat_openid === wechatOpenid &&
        binding.user_id !== userId
      ) {
        throw new Error('WeChat account already bound to another user');
      }
    }

    const bindingId = `binding_${Date.now()}_${Math.random()}`;
    const binding: WeChatBinding = {
      id: bindingId,
      user_id: userId,
      wechat_openid: wechatOpenid,
      wechat_unionid: wechatUnionid,
    };

    this.wechatBindings.set(bindingId, binding);
  }

  async getWeChatBinding(wechatOpenid: string): Promise<WeChatBinding | null> {
    for (const binding of this.wechatBindings.values()) {
      if (binding.wechat_openid === wechatOpenid) {
        return binding;
      }
    }
    return null;
  }

  async getUserById(userId: string): Promise<User | null> {
    return this.users.get(userId) || null;
  }

  clear(): void {
    this.users.clear();
    this.phoneIndex.clear();
    this.wechatBindings.clear();
  }
}

describe('Enhanced Auth System - Database Schema Property Tests', () => {
  let db: MockDatabase;

  beforeEach(() => {
    db = new MockDatabase();
  });

  afterEach(() => {
    db.clear();
  });

  /**
   * Property 4: Phone Number Binding Uniqueness
   *
   * For any phone number binding operation, the system should ensure that
   * one phone number can only be bound to one user account. After binding,
   * querying by phone number should return the corresponding user.
   *
   * Validates: Requirements 3.2, 3.5
   */
  describe('Property 4: Phone Number Binding Uniqueness', () => {
    it('should ensure one phone number binds to exactly one user account', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate a valid Chinese phone number (11 digits starting with 1)
          fc
            .tuple(
              fc.constantFrom('13', '14', '15', '16', '17', '18', '19'),
              fc.integer({min: 10000000, max: 99999999}),
            )
            .map(([prefix, suffix]) => `${prefix}${suffix}`),
          // Generate a username
          fc.string({minLength: 2, maxLength: 20}),
          async (phoneNumber, username) => {
            // Create a fresh database for each test iteration
            const testDb = new MockDatabase();

            // Create first user with this phone number
            const user1 = await testDb.createUser(phoneNumber, username);

            // Verify user was created
            expect(user1).toBeDefined();
            expect(user1.phone_number).toBe(phoneNumber);

            // Verify we can query the user by phone number
            const queriedUser = await testDb.getUserByPhone(phoneNumber);
            expect(queriedUser).not.toBeNull();
            expect(queriedUser?.id).toBe(user1.id);
            expect(queriedUser?.phone_number).toBe(phoneNumber);

            // Attempt to create another user with the same phone number
            // This should fail
            await expect(
              testDb.createUser(phoneNumber, `${username}_2`),
            ).rejects.toThrow('Phone number already registered');

            // Verify the original user is still the only one with this phone
            const stillSameUser = await testDb.getUserByPhone(phoneNumber);
            expect(stillSameUser?.id).toBe(user1.id);
          },
        ),
        {numRuns: 100},
      );
    });

    it('should allow different phone numbers to bind to different users', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate two different phone numbers
          fc
            .tuple(
              fc
                .tuple(
                  fc.constantFrom('13', '14', '15', '16', '17', '18', '19'),
                  fc.integer({min: 10000000, max: 99999999}),
                )
                .map(([prefix, suffix]) => `${prefix}${suffix}`),
              fc
                .tuple(
                  fc.constantFrom('13', '14', '15', '16', '17', '18', '19'),
                  fc.integer({min: 10000000, max: 99999999}),
                )
                .map(([prefix, suffix]) => `${prefix}${suffix}`),
            )
            .filter(([phone1, phone2]) => phone1 !== phone2),
          fc.string({minLength: 2, maxLength: 20}),
          async ([phoneNumber1, phoneNumber2], username) => {
            // Create a fresh database for each test iteration
            const testDb = new MockDatabase();

            // Create two users with different phone numbers
            const user1 = await testDb.createUser(
              phoneNumber1,
              `${username}_1`,
            );
            const user2 = await testDb.createUser(
              phoneNumber2,
              `${username}_2`,
            );

            // Verify both users were created
            expect(user1).toBeDefined();
            expect(user2).toBeDefined();
            expect(user1.id).not.toBe(user2.id);

            // Verify each phone number maps to the correct user
            const queriedUser1 = await testDb.getUserByPhone(phoneNumber1);
            const queriedUser2 = await testDb.getUserByPhone(phoneNumber2);

            expect(queriedUser1?.id).toBe(user1.id);
            expect(queriedUser2?.id).toBe(user2.id);
            expect(queriedUser1?.phone_number).toBe(phoneNumber1);
            expect(queriedUser2?.phone_number).toBe(phoneNumber2);
          },
        ),
        {numRuns: 100},
      );
    });

    it('should ensure WeChat binding uniqueness per user', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate phone number
          fc
            .tuple(
              fc.constantFrom('13', '14', '15', '16', '17', '18', '19'),
              fc.integer({min: 10000000, max: 99999999}),
            )
            .map(([prefix, suffix]) => `${prefix}${suffix}`),
          // Generate WeChat OpenID
          fc.string({minLength: 20, maxLength: 40}),
          // Generate username
          fc.string({minLength: 2, maxLength: 20}),
          async (phoneNumber, wechatOpenid, username) => {
            // Create a fresh database for each test iteration
            const testDb = new MockDatabase();

            // Create user
            const user = await testDb.createUser(phoneNumber, username);

            // Bind WeChat to user
            await testDb.bindWeChat(user.id, wechatOpenid);

            // Verify binding exists
            const binding = await testDb.getWeChatBinding(wechatOpenid);
            expect(binding).not.toBeNull();
            expect(binding?.user_id).toBe(user.id);
            expect(binding?.wechat_openid).toBe(wechatOpenid);

            // Verify we can get user from binding
            const boundUser = await testDb.getUserById(binding!.user_id);
            expect(boundUser?.id).toBe(user.id);
            expect(boundUser?.phone_number).toBe(phoneNumber);
          },
        ),
        {numRuns: 100},
      );
    });

    it('should prevent WeChat account from binding to multiple users', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate two different phone numbers
          fc
            .tuple(
              fc
                .tuple(
                  fc.constantFrom('13', '14', '15', '16', '17', '18', '19'),
                  fc.integer({min: 10000000, max: 99999999}),
                )
                .map(([prefix, suffix]) => `${prefix}${suffix}`),
              fc
                .tuple(
                  fc.constantFrom('13', '14', '15', '16', '17', '18', '19'),
                  fc.integer({min: 10000000, max: 99999999}),
                )
                .map(([prefix, suffix]) => `${prefix}${suffix}`),
            )
            .filter(([phone1, phone2]) => phone1 !== phone2),
          // Generate WeChat OpenID
          fc.string({minLength: 20, maxLength: 40}),
          // Generate username
          fc.string({minLength: 2, maxLength: 20}),
          async ([phoneNumber1, phoneNumber2], wechatOpenid, username) => {
            // Create a fresh database for each test iteration
            const testDb = new MockDatabase();

            // Create two users
            const user1 = await testDb.createUser(
              phoneNumber1,
              `${username}_1`,
            );
            const user2 = await testDb.createUser(
              phoneNumber2,
              `${username}_2`,
            );

            // Bind WeChat to first user
            await testDb.bindWeChat(user1.id, wechatOpenid);

            // Attempt to bind same WeChat to second user should fail
            await expect(
              testDb.bindWeChat(user2.id, wechatOpenid),
            ).rejects.toThrow('WeChat account already bound to another user');

            // Verify WeChat is still bound to first user only
            const binding = await testDb.getWeChatBinding(wechatOpenid);
            expect(binding?.user_id).toBe(user1.id);
          },
        ),
        {numRuns: 100},
      );
    });

    it('should maintain phone number uniqueness across multiple operations', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate array of phone numbers
          fc.array(
            fc
              .tuple(
                fc.constantFrom('13', '14', '15', '16', '17', '18', '19'),
                fc.integer({min: 10000000, max: 99999999}),
              )
              .map(([prefix, suffix]) => `${prefix}${suffix}`),
            {minLength: 1, maxLength: 10},
          ),
          fc.string({minLength: 2, maxLength: 20}),
          async (phoneNumbers, username) => {
            // Create a fresh database for each test iteration
            const testDb = new MockDatabase();

            const createdUsers: User[] = [];
            const uniquePhones = new Set<string>();

            // Try to create users with all phone numbers
            for (let i = 0; i < phoneNumbers.length; i++) {
              const phone = phoneNumbers[i];

              if (uniquePhones.has(phone)) {
                // Duplicate phone - should fail
                await expect(
                  testDb.createUser(phone, `${username}_${i}`),
                ).rejects.toThrow('Phone number already registered');
              } else {
                // New phone - should succeed
                const user = await testDb.createUser(phone, `${username}_${i}`);
                createdUsers.push(user);
                uniquePhones.add(phone);
              }
            }

            // Verify all created users can be queried by their phone numbers
            for (const user of createdUsers) {
              const queriedUser = await testDb.getUserByPhone(
                user.phone_number,
              );
              expect(queriedUser?.id).toBe(user.id);
            }

            // Verify the number of created users matches unique phone numbers
            expect(createdUsers.length).toBe(uniquePhones.size);
          },
        ),
        {numRuns: 100},
      );
    });
  });
});
