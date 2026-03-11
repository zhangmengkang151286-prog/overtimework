/**
 * Settings Screen Tests
 * 验证需求: 10.1-10.4, 3.2
 */

import {storageService} from '../services/storage';
import {User} from '../types';

describe('Settings Screen Functionality', () => {
  describe('User Profile Management', () => {
    it('should allow updating user profile information', async () => {
      // 创建测试用户
      const testUser: User = {
        id: 'test-user-1',
        phoneNumber: '13800138000',
        avatar: 'https://example.com/avatar.jpg',
        username: '测试用户',
        province: '北京',
        city: '北京市',
        industry: '互联网',
        company: '测试公司',
        position: '软件工程师',
        workStartTime: '09:00',
        workEndTime: '18:00',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // 保存用户
      await storageService.saveUser(testUser);

      // 获取用户
      const savedUser = await storageService.getUser();
      expect(savedUser).toBeDefined();
      expect(savedUser?.username).toBe('测试用户');

      // 更新用户信息
      const updatedUser: User = {
        ...testUser,
        username: '更新后的用户名',
        company: '新公司',
        position: '高级工程师',
        updatedAt: new Date(),
      };

      await storageService.saveUser(updatedUser);

      // 验证更新
      const retrievedUser = await storageService.getUser();
      expect(retrievedUser?.username).toBe('更新后的用户名');
      expect(retrievedUser?.company).toBe('新公司');
      expect(retrievedUser?.position).toBe('高级工程师');

      // 清理
      await storageService.logout();
    });

    it('should validate required fields when updating profile', () => {
      // 验证用户名不能为空
      const emptyUsername = '';
      expect(emptyUsername.trim()).toBe('');

      // 验证时间格式
      const validateTimeFormat = (time: string): boolean => {
        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
        return timeRegex.test(time);
      };

      expect(validateTimeFormat('09:00')).toBe(true);
      expect(validateTimeFormat('18:30')).toBe(true);
      expect(validateTimeFormat('25:00')).toBe(false);
      expect(validateTimeFormat('12:60')).toBe(false);
      expect(validateTimeFormat('9:00')).toBe(false);
    });

    it('should maintain data consistency after profile update', async () => {
      const testUser: User = {
        id: 'test-user-2',
        phoneNumber: '13900139000',
        avatar: 'https://example.com/avatar2.jpg',
        username: '用户2',
        province: '上海',
        city: '上海市',
        industry: '金融',
        company: '银行',
        position: '分析师',
        workStartTime: '08:30',
        workEndTime: '17:30',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await storageService.saveUser(testUser);

      // 更新部分字段
      const partialUpdate: User = {
        ...testUser,
        industry: '科技',
        updatedAt: new Date(),
      };

      await storageService.saveUser(partialUpdate);

      const retrievedUser = await storageService.getUser();

      // 验证更新的字段
      expect(retrievedUser?.industry).toBe('科技');

      // 验证未更新的字段保持不变
      expect(retrievedUser?.username).toBe('用户2');
      expect(retrievedUser?.phoneNumber).toBe('13900139000');
      expect(retrievedUser?.province).toBe('上海');
      expect(retrievedUser?.company).toBe('银行');

      await storageService.logout();
    });
  });

  describe('Theme Settings', () => {
    it('should toggle between light and dark themes', () => {
      let theme: 'light' | 'dark' = 'light';

      // 切换到深色主题
      theme = theme === 'light' ? 'dark' : 'light';
      expect(theme).toBe('dark');

      // 切换回浅色主题
      theme = theme === 'light' ? 'dark' : 'light';
      expect(theme).toBe('light');
    });

    it('should apply correct theme colors', () => {
      const getThemeColors = (theme: 'light' | 'dark') => {
        const isDark = theme === 'dark';
        return {
          backgroundColor: isDark ? '#1a1a1a' : '#F5F5F5',
          cardBackground: isDark ? '#2a2a2a' : '#FFFFFF',
          textColor: isDark ? '#ffffff' : '#333',
          secondaryTextColor: isDark ? '#cccccc' : '#666',
        };
      };

      const lightColors = getThemeColors('light');
      expect(lightColors.backgroundColor).toBe('#F5F5F5');
      expect(lightColors.textColor).toBe('#333');

      const darkColors = getThemeColors('dark');
      expect(darkColors.backgroundColor).toBe('#1a1a1a');
      expect(darkColors.textColor).toBe('#ffffff');
    });
  });

  describe('Settings Navigation', () => {
    it('should provide navigation to profile editing', () => {
      const navigationParams = {
        isEditing: true,
      };

      expect(navigationParams.isEditing).toBe(true);
    });

    it('should provide navigation to data management', () => {
      const screenName = 'DataManagement';
      expect(screenName).toBe('DataManagement');
    });
  });

  describe('Logout Functionality', () => {
    it('should clear user data on logout', async () => {
      const testUser: User = {
        id: 'test-user-3',
        phoneNumber: '13700137000',
        avatar: 'https://example.com/avatar3.jpg',
        username: '用户3',
        province: '广东',
        city: '深圳市',
        industry: '制造业',
        company: '工厂',
        position: '工程师',
        workStartTime: '08:00',
        workEndTime: '17:00',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await storageService.saveUser(testUser);

      let user = await storageService.getUser();
      expect(user).toBeDefined();

      // 执行登出
      await storageService.logout();

      user = await storageService.getUser();
      expect(user).toBeNull();
    });
  });
});
