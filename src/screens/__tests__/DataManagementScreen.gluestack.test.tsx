import React from 'react';
import {render, fireEvent, waitFor} from '@testing-library/react-native';
import {GluestackUIProvider} from '@gluestack-ui/themed';
import {config} from '@gluestack-ui/config';
import {DataManagementScreen} from '../DataManagementScreen';
import {supabaseService} from '../../services/supabaseService';

// Mock supabaseService
jest.mock('../../services/supabaseService', () => ({
  supabaseService: {
    getTags: jest.fn(),
    createTag: jest.fn(),
    updateTag: jest.fn(),
    deleteTag: jest.fn(),
  },
}));

// Mock Alert
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    Alert: {
      alert: jest.fn(),
    },
  };
});

const mockTags = [
  {
    id: '1',
    name: '互联网',
    type: 'industry',
    is_active: true,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: '金融',
    type: 'industry',
    is_active: true,
    createdAt: '2024-01-02T00:00:00Z',
  },
];

describe('DataManagementScreen - gluestack-ui 迁移测试', () => {
  const renderScreen = () =>
    render(
      <GluestackUIProvider config={config}>
        <DataManagementScreen />
      </GluestackUIProvider>,
    );

  beforeEach(() => {
    jest.clearAllMocks();
    (supabaseService.getTags as jest.Mock).mockResolvedValue(mockTags);
  });

  it('应该正确渲染所有 gluestack-ui 组件', async () => {
    const {getByText, getByPlaceholderText} = renderScreen();

    await waitFor(() => {
      expect(getByText('数据管理')).toBeTruthy();
      expect(getByText('行业')).toBeTruthy();
      expect(getByText('公司')).toBeTruthy();
      expect(getByText('职位')).toBeTruthy();
      expect(getByPlaceholderText('搜索...')).toBeTruthy();
      expect(getByText('+ 添加')).toBeTruthy();
    });
  });

  it('应该加载并显示数据列表', async () => {
    const {getByText} = renderScreen();

    await waitFor(() => {
      expect(supabaseService.getTags).toHaveBeenCalledWith('industry');
      expect(getByText('互联网')).toBeTruthy();
      expect(getByText('金融')).toBeTruthy();
    });
  });

  it('应该能够切换数据类型', async () => {
    const {getByText} = renderScreen();

    await waitFor(() => {
      expect(getByText('互联网')).toBeTruthy();
    });

    const companyButton = getByText('公司');
    fireEvent.press(companyButton);

    await waitFor(() => {
      expect(supabaseService.getTags).toHaveBeenCalledWith('company');
    });
  });

  it('应该能够搜索数据', async () => {
    const {getByPlaceholderText, getByText, queryByText} = renderScreen();

    await waitFor(() => {
      expect(getByText('互联网')).toBeTruthy();
      expect(getByText('金融')).toBeTruthy();
    });

    const searchInput = getByPlaceholderText('搜索...');
    fireEvent.changeText(searchInput, '互联网');

    await waitFor(() => {
      expect(getByText('互联网')).toBeTruthy();
      expect(queryByText('金融')).toBeNull();
    });
  });

  it('应该能够打开添加模态框', async () => {
    const {getByText} = renderScreen();

    await waitFor(() => {
      expect(getByText('互联网')).toBeTruthy();
    });

    const addButton = getByText('+ 添加');
    fireEvent.press(addButton);

    await waitFor(() => {
      expect(getByText('添加行业')).toBeTruthy();
    });
  });

  it('应该能够创建新数据', async () => {
    const {getByText, getByPlaceholderText} = renderScreen();

    (supabaseService.createTag as jest.Mock).mockResolvedValue({
      success: true,
    });

    await waitFor(() => {
      expect(getByText('互联网')).toBeTruthy();
    });

    // 打开添加模态框
    const addButton = getByText('+ 添加');
    fireEvent.press(addButton);

    await waitFor(() => {
      expect(getByText('添加行业')).toBeTruthy();
    });

    // 输入名称并保存
    const nameInput = getByPlaceholderText('请输入名称');
    fireEvent.changeText(nameInput, '教育');

    const saveButton = getByText('保存');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(supabaseService.createTag).toHaveBeenCalledWith({
        name: '教育',
        type: 'industry',
        is_active: true,
      });
    });
  });

  it('应该能够编辑数据', async () => {
    const {getByText, getAllByText, getByPlaceholderText} = renderScreen();

    (supabaseService.updateTag as jest.Mock).mockResolvedValue({
      success: true,
    });

    await waitFor(() => {
      expect(getByText('互联网')).toBeTruthy();
    });

    // 点击编辑按钮
    const editButtons = getAllByText('编辑');
    fireEvent.press(editButtons[0]);

    await waitFor(() => {
      expect(getByText('编辑行业')).toBeTruthy();
    });

    // 修改名称并保存
    const nameInput = getByPlaceholderText('请输入名称');
    fireEvent.changeText(nameInput, 'IT行业');

    const saveButton = getByText('保存');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(supabaseService.updateTag).toHaveBeenCalledWith('1', {
        name: 'IT行业',
      });
    });
  });

  it('应该能够删除数据', async () => {
    const {getByText, getAllByText} = renderScreen();

    (supabaseService.deleteTag as jest.Mock).mockResolvedValue({
      success: true,
    });

    await waitFor(() => {
      expect(getByText('互联网')).toBeTruthy();
    });

    // 点击删除按钮
    const deleteButtons = getAllByText('删除');
    fireEvent.press(deleteButtons[0]);

    // Alert 应该被调用
    expect(require('react-native').Alert.alert).toHaveBeenCalled();
  });

  it('应该在没有数据时显示提示', async () => {
    (supabaseService.getTags as jest.Mock).mockResolvedValue([]);

    const {getByText} = renderScreen();

    await waitFor(() => {
      expect(getByText('暂无数据')).toBeTruthy();
    });
  });

  it('应该能够关闭模态框', async () => {
    const {getByText, queryByText} = renderScreen();

    await waitFor(() => {
      expect(getByText('互联网')).toBeTruthy();
    });

    // 打开模态框
    const addButton = getByText('+ 添加');
    fireEvent.press(addButton);

    await waitFor(() => {
      expect(getByText('添加行业')).toBeTruthy();
    });

    // 关闭模态框
    const cancelButton = getByText('取消');
    fireEvent.press(cancelButton);

    await waitFor(() => {
      expect(queryByText('添加行业')).toBeNull();
    });
  });
});
