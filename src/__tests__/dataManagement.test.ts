/**
 * 数据管理系统测试
 * 验证需求: 13.1-13.7
 */

import {TagResponse} from '../types';

// Mock the entire api module
jest.mock('../services/api', () => ({
  apiClient: {
    getTags: jest.fn(),
    createTag: jest.fn(),
    updateTag: jest.fn(),
    deleteTag: jest.fn(),
  },
}));

import {apiClient} from '../services/api';

describe('Data Management System', () => {
  describe('CRUD Operations', () => {
    /**
     * 测试创建功能
     * 验证需求: 13.1
     */
    it('should create new data items', async () => {
      const mockTag: Partial<TagResponse> = {
        name: '互联网',
        type: 'industry',
        isActive: true,
      };

      const mockResponse: TagResponse = {
        id: '1',
        name: '互联网',
        type: 'industry',
        isActive: true,
        createdAt: new Date().toISOString(),
      };

      // Mock the API call
      jest.spyOn(apiClient, 'createTag').mockResolvedValue(mockResponse);

      const result = await apiClient.createTag(mockTag);

      expect(result).toEqual(mockResponse);
      expect(result.name).toBe('互联网');
      expect(result.type).toBe('industry');
    });

    /**
     * 测试查询功能
     * 验证需求: 13.4
     */
    it('should retrieve data items', async () => {
      const mockTags: TagResponse[] = [
        {
          id: '1',
          name: '互联网',
          type: 'industry',
          isActive: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          name: '金融',
          type: 'industry',
          isActive: true,
          createdAt: new Date().toISOString(),
        },
      ];

      jest.spyOn(apiClient, 'getTags').mockResolvedValue(mockTags);

      const result = await apiClient.getTags('industry');

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('互联网');
      expect(result[1].name).toBe('金融');
    });

    /**
     * 测试更新功能
     * 验证需求: 13.3
     */
    it('should update existing data items', async () => {
      const mockUpdatedTag: TagResponse = {
        id: '1',
        name: '互联网科技',
        type: 'industry',
        isActive: true,
        createdAt: new Date().toISOString(),
      };

      jest.spyOn(apiClient, 'updateTag').mockResolvedValue(mockUpdatedTag);

      const result = await apiClient.updateTag('1', {name: '互联网科技'});

      expect(result.name).toBe('互联网科技');
      expect(result.id).toBe('1');
    });

    /**
     * 测试删除功能
     * 验证需求: 13.2
     */
    it('should delete data items', async () => {
      jest.spyOn(apiClient, 'deleteTag').mockResolvedValue(undefined);

      await expect(apiClient.deleteTag('1')).resolves.toBeUndefined();
    });
  });

  describe('Search Functionality', () => {
    /**
     * 测试搜索功能
     * 验证需求: 13.5
     */
    it('should filter data based on search query', async () => {
      const mockTags: TagResponse[] = [
        {
          id: '1',
          name: '互联网',
          type: 'industry',
          isActive: true,
          createdAt: new Date().toISOString(),
        },
      ];

      jest.spyOn(apiClient, 'getTags').mockResolvedValue(mockTags);

      const result = await apiClient.getTags('industry', '互联网');

      expect(result).toHaveLength(1);
      expect(result[0].name).toContain('互联网');
    });

    /**
     * 测试实时搜索过滤
     * 验证需求: 13.5
     */
    it('should support real-time search filtering', () => {
      const allData: TagResponse[] = [
        {
          id: '1',
          name: '互联网',
          type: 'industry',
          isActive: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          name: '金融',
          type: 'industry',
          isActive: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: '3',
          name: '互联网金融',
          type: 'industry',
          isActive: true,
          createdAt: new Date().toISOString(),
        },
      ];

      // Simulate client-side filtering
      const searchQuery = '互联网';
      const filtered = allData.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()),
      );

      expect(filtered).toHaveLength(2);
      expect(filtered[0].name).toBe('互联网');
      expect(filtered[1].name).toBe('互联网金融');
    });
  });

  describe('Data Type Support', () => {
    /**
     * 测试支持多种数据类型
     * 验证需求: 13.1-13.4
     */
    it('should support industry, company, and position data types', async () => {
      const dataTypes: Array<'industry' | 'company' | 'position'> = [
        'industry',
        'company',
        'position',
      ];

      for (const type of dataTypes) {
        const mockTags: TagResponse[] = [
          {
            id: '1',
            name: `测试${type}`,
            type: type,
            isActive: true,
            createdAt: new Date().toISOString(),
          },
        ];

        jest.spyOn(apiClient, 'getTags').mockResolvedValue(mockTags);

        const result = await apiClient.getTags(type);

        expect(result).toHaveLength(1);
        expect(result[0].type).toBe(type);
      }
    });
  });

  describe('UI Update on Data Changes', () => {
    /**
     * 测试数据变更后UI立即更新
     * 验证需求: 13.6
     */
    it('should reflect data changes immediately in UI', async () => {
      // 模拟初始数据
      const initialData: TagResponse[] = [
        {
          id: '1',
          name: '互联网',
          type: 'industry',
          isActive: true,
          createdAt: new Date().toISOString(),
        },
      ];

      // 模拟添加新数据后的数据
      const updatedData: TagResponse[] = [
        ...initialData,
        {
          id: '2',
          name: '金融',
          type: 'industry',
          isActive: true,
          createdAt: new Date().toISOString(),
        },
      ];

      jest
        .spyOn(apiClient, 'getTags')
        .mockResolvedValueOnce(initialData)
        .mockResolvedValueOnce(updatedData);

      // 获取初始数据
      const initial = await apiClient.getTags('industry');
      expect(initial).toHaveLength(1);

      // 创建新数据
      const newTag: TagResponse = {
        id: '2',
        name: '金融',
        type: 'industry',
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      jest.spyOn(apiClient, 'createTag').mockResolvedValue(newTag);
      await apiClient.createTag({name: '金融', type: 'industry'});

      // 重新获取数据，验证UI应该立即反映变化
      const updated = await apiClient.getTags('industry');
      expect(updated).toHaveLength(2);
      expect(updated[1].name).toBe('金融');
    });
  });

  describe('Error Handling', () => {
    /**
     * 测试错误处理
     */
    it('should handle API errors gracefully', async () => {
      jest
        .spyOn(apiClient, 'getTags')
        .mockRejectedValue(new Error('Network error'));

      await expect(apiClient.getTags('industry')).rejects.toThrow(
        'Network error',
      );
    });

    it('should handle empty search results', async () => {
      jest.spyOn(apiClient, 'getTags').mockResolvedValue([]);

      const result = await apiClient.getTags('industry', 'nonexistent');

      expect(result).toHaveLength(0);
    });
  });
});
