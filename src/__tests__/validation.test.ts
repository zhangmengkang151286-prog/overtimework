import {
  validateUser,
  validateStatusRecord,
  validateTag,
  validateRealTimeData,
  validateUserStatusSubmission,
  validateDateFormat,
  validateDisplayTimeFormat,
  searchTags,
  getTop10TagDistribution,
  validateTagDistribution,
} from '../utils';
import type {
  User,
  StatusRecord,
  Tag,
  RealTimeData,
  TagDistribution,
} from '../types';

describe('数据验证函数测试', () => {
  describe('validateUser', () => {
    test('应该验证有效的用户数据', () => {
      const validUser: User = {
        id: 'user123',
        phoneNumber: '13812345678',
        avatar: 'https://example.com/avatar.jpg',
        username: '张三',
        province: '北京',
        city: '北京市',
        industry: '互联网',
        company: '科技公司',
        position: '工程师',
        workStartTime: '09:00',
        workEndTime: '18:00',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = validateUser(validUser);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('应该拒绝无效的手机号', () => {
      const invalidUser: Partial<User> = {
        id: 'user123',
        phoneNumber: '12345678901',
        username: '张三',
      };

      const result = validateUser(invalidUser);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('手机号'))).toBe(true);
    });

    test('应该拒绝无效的时间格式', () => {
      const invalidUser: Partial<User> = {
        id: 'user123',
        phoneNumber: '13812345678',
        username: '张三',
        workStartTime: '25:00',
        workEndTime: '18:00',
      };

      const result = validateUser(invalidUser);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('上班时间'))).toBe(true);
    });
  });

  describe('validateStatusRecord', () => {
    test('应该验证有效的状态记录', () => {
      const validRecord: StatusRecord = {
        id: 'record123',
        userId: 'user123',
        date: '2024-01-01',
        isOvertime: true,
        tagId: 'tag123',
        overtimeHours: 2,
        submittedAt: new Date(),
      };

      const result = validateStatusRecord(validRecord);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('应该验证加班时长范围', () => {
      const invalidRecord: Partial<StatusRecord> = {
        id: 'record123',
        userId: 'user123',
        date: '2024-01-01',
        isOvertime: true,
        tagId: 'tag123',
        overtimeHours: 15,
        submittedAt: new Date(),
      };

      const result = validateStatusRecord(invalidRecord);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('加班时长'))).toBe(true);
    });
  });

  describe('validateTag', () => {
    test('应该验证有效的标签', () => {
      const validTag: Tag = {
        id: 'tag123',
        name: '互联网',
        type: 'industry',
        isActive: true,
        usageCount: 100,
        createdAt: new Date(),
      };

      const result = validateTag(validTag);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('应该拒绝无效的标签类型', () => {
      const invalidTag: Partial<Tag> = {
        id: 'tag123',
        name: '互联网',
        type: 'invalid' as any,
        isActive: true,
        usageCount: 100,
        createdAt: new Date(),
      };

      const result = validateTag(invalidTag);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('标签类型'))).toBe(true);
    });
  });

  describe('validateRealTimeData', () => {
    test('应该验证有效的实时数据', () => {
      const validData: RealTimeData = {
        timestamp: new Date(),
        participantCount: 100,
        overtimeCount: 60,
        onTimeCount: 40,
        tagDistribution: [],
        dailyStatus: [],
      };

      const result = validateRealTimeData(validData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('应该验证人数一致性', () => {
      const invalidData: Partial<RealTimeData> = {
        timestamp: new Date(),
        participantCount: 100,
        overtimeCount: 60,
        onTimeCount: 50, // 不一致
        tagDistribution: [],
        dailyStatus: [],
      };

      const result = validateRealTimeData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('参与人数'))).toBe(true);
    });
  });

  describe('validateDateFormat', () => {
    test('应该验证有效的日期格式', () => {
      expect(validateDateFormat('2024-01-01')).toBe(true);
      expect(validateDateFormat('2024-12-31')).toBe(true);
    });

    test('应该拒绝无效的日期格式', () => {
      expect(validateDateFormat('2024/01/01')).toBe(false);
      expect(validateDateFormat('2024-13-01')).toBe(false);
      expect(validateDateFormat('2024-01-32')).toBe(false);
    });
  });

  describe('validateDisplayTimeFormat', () => {
    test('应该验证有效的显示时间格式', () => {
      expect(validateDisplayTimeFormat('2024/01/01 12:30:45')).toBe(true);
      expect(validateDisplayTimeFormat('2024/12/31 23:59:59')).toBe(true);
    });

    test('应该拒绝无效的显示时间格式', () => {
      expect(validateDisplayTimeFormat('2024-01-01 12:30:45')).toBe(false);
      expect(validateDisplayTimeFormat('2024/01/01 25:30:45')).toBe(false);
    });
  });

  describe('searchTags', () => {
    const mockTags: Tag[] = [
      {
        id: '1',
        name: '互联网',
        type: 'industry',
        isActive: true,
        usageCount: 100,
        createdAt: new Date(),
      },
      {
        id: '2',
        name: '金融',
        type: 'industry',
        isActive: true,
        usageCount: 80,
        createdAt: new Date(),
      },
      {
        id: '3',
        name: '阿里巴巴',
        type: 'company',
        isActive: true,
        usageCount: 200,
        createdAt: new Date(),
      },
      {
        id: '4',
        name: '腾讯',
        type: 'company',
        isActive: false,
        usageCount: 150,
        createdAt: new Date(),
      },
    ];

    test('应该根据搜索词过滤标签', () => {
      const result = searchTags(mockTags, '互联网');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('互联网');
    });

    test('应该根据类型过滤标签', () => {
      const result = searchTags(mockTags, '', 'company');
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('company');
    });

    test('应该只返回激活的标签', () => {
      const result = searchTags(mockTags, '腾讯');
      expect(result).toHaveLength(0);
    });

    test('空搜索词应该返回所有激活的标签', () => {
      const result = searchTags(mockTags, '');
      expect(result.length).toBeGreaterThan(0);
      expect(result.every(tag => tag.isActive)).toBe(true);
    });
  });

  describe('getTop10TagDistribution', () => {
    test('应该返回Top10标签', () => {
      const mockDistribution: TagDistribution[] = Array.from(
        {length: 15},
        (_, i) => ({
          tagId: `tag${i}`,
          tagName: `标签${i}`,
          count: 100 - i * 5,
          isOvertime: i % 2 === 0,
          color: i % 2 === 0 ? '#FF6B6B' : '#4ECDC4',
        }),
      );

      const result = getTop10TagDistribution(mockDistribution);

      // 应该有Top10加班标签 + Top10准时下班标签 + 可能的"其他"类别
      expect(result.length).toBeGreaterThan(0);
      expect(result.length).toBeLessThanOrEqual(22); // 最多10+10+2
    });

    test('应该正确合并"其他"类别', () => {
      const mockDistribution: TagDistribution[] = Array.from(
        {length: 15},
        (_, i) => ({
          tagId: `tag${i}`,
          tagName: `标签${i}`,
          count: 100 - i * 5,
          isOvertime: true,
          color: '#FF6B6B',
        }),
      );

      const result = getTop10TagDistribution(mockDistribution);

      // 应该有"其他"类别
      const otherCategory = result.find(tag => tag.tagName === '其他');
      expect(otherCategory).toBeDefined();
      expect(otherCategory?.isOvertime).toBe(true);
    });
  });

  describe('validateTagDistribution', () => {
    test('应该验证有效的标签分布', () => {
      const validDistribution: TagDistribution = {
        tagId: 'tag123',
        tagName: '互联网',
        count: 100,
        isOvertime: true,
        color: '#FF6B6B',
      };

      const result = validateTagDistribution(validDistribution);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('应该拒绝负数数量', () => {
      const invalidDistribution: Partial<TagDistribution> = {
        tagId: 'tag123',
        tagName: '互联网',
        count: -10,
        isOvertime: true,
        color: '#FF6B6B',
      };

      const result = validateTagDistribution(invalidDistribution);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('数量'))).toBe(true);
    });
  });
});
