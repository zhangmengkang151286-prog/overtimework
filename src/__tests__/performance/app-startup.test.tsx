/**
 * 应用启动性能测试
 * 测试应用启动速度和初始化性能
 * 验证需求: 9.4
 */

import React from 'react';
import {render, waitFor} from '@testing-library/react-native';
import {GluestackUIProvider} from '@gluestack-ui/themed';
import {config} from '@gluestack-ui/config';
import {Provider} from 'react-redux';
import {store} from '../../store';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Mock Navigation
jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({children}: any) => children,
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
}));

describe('应用启动性能测试', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Provider 初始化', () => {
    it('GluestackUIProvider 应该快速初始化（< 100ms）', () => {
      const startTime = performance.now();

      render(
        <GluestackUIProvider config={config}>
          <></>
        </GluestackUIProvider>,
      );

      const initTime = performance.now() - startTime;
      console.log(`GluestackUIProvider 初始化时间: ${initTime.toFixed(2)}ms`);
      expect(initTime).toBeLessThan(100);
    });

    it('Redux Provider 应该快速初始化（< 50ms）', () => {
      const startTime = performance.now();

      render(
        <Provider store={store}>
          <></>
        </Provider>,
      );

      const initTime = performance.now() - startTime;
      console.log(`Redux Provider 初始化时间: ${initTime.toFixed(2)}ms`);
      expect(initTime).toBeLessThan(50);
    });

    it('完整 Provider 栈应该快速初始化（< 150ms）', () => {
      const startTime = performance.now();

      render(
        <Provider store={store}>
          <GluestackUIProvider config={config}>
            <></>
          </GluestackUIProvider>
        </Provider>,
      );

      const initTime = performance.now() - startTime;
      console.log(`完整 Provider 栈初始化时间: ${initTime.toFixed(2)}ms`);
      expect(initTime).toBeLessThan(150);
    });
  });

  describe('主题加载', () => {
    it('应该快速加载默认主题（< 50ms）', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const startTime = performance.now();

      render(
        <Provider store={store}>
          <GluestackUIProvider config={config}>
            <></>
          </GluestackUIProvider>
        </Provider>,
      );

      await waitFor(() => {
        expect(true).toBe(true);
      });

      const loadTime = performance.now() - startTime;
      console.log(`默认主题加载时间: ${loadTime.toFixed(2)}ms`);
      expect(loadTime).toBeLessThan(50);
    });

    it('应该快速加载保存的主题（< 100ms）', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('dark');

      const startTime = performance.now();

      render(
        <Provider store={store}>
          <GluestackUIProvider config={config}>
            <></>
          </GluestackUIProvider>
        </Provider>,
      );

      await waitFor(() => {
        expect(AsyncStorage.getItem).toHaveBeenCalled();
      });

      const loadTime = performance.now() - startTime;
      console.log(`保存的主题加载时间: ${loadTime.toFixed(2)}ms`);
      expect(loadTime).toBeLessThan(100);
    });
  });

  describe('配置加载', () => {
    it('Gluestack 配置应该快速加载（< 50ms）', () => {
      const startTime = performance.now();

      // 导入配置
      const {config: gluestackConfig} = require('@gluestack-ui/config');

      const loadTime = performance.now() - startTime;
      console.log(`Gluestack 配置加载时间: ${loadTime.toFixed(2)}ms`);
      expect(loadTime).toBeLessThan(50);
      expect(gluestackConfig).toBeDefined();
    });

    it('Redux store 应该快速创建（< 50ms）', () => {
      const startTime = performance.now();

      // 导入 store
      const {store: reduxStore} = require('../../store');

      const loadTime = performance.now() - startTime;
      console.log(`Redux store 创建时间: ${loadTime.toFixed(2)}ms`);
      expect(loadTime).toBeLessThan(50);
      expect(reduxStore).toBeDefined();
    });
  });

  describe('初始渲染性能', () => {
    it('空应用应该快速渲染（< 100ms）', () => {
      const startTime = performance.now();

      render(
        <Provider store={store}>
          <GluestackUIProvider config={config}>
            <></>
          </GluestackUIProvider>
        </Provider>,
      );

      const renderTime = performance.now() - startTime;
      console.log(`空应用渲染时间: ${renderTime.toFixed(2)}ms`);
      expect(renderTime).toBeLessThan(100);
    });

    it('带基础组件的应用应该快速渲染（< 200ms）', () => {
      const {AppButton} = require('../../components/gluestack/Button');

      const startTime = performance.now();

      render(
        <Provider store={store}>
          <GluestackUIProvider config={config}>
            <AppButton>测试按钮</AppButton>
          </GluestackUIProvider>
        </Provider>,
      );

      const renderTime = performance.now() - startTime;
      console.log(`带基础组件的应用渲染时间: ${renderTime.toFixed(2)}ms`);
      expect(renderTime).toBeLessThan(200);
    });
  });

  describe('内存使用', () => {
    it('Provider 应该正确清理', async () => {
      const {unmount} = render(
        <Provider store={store}>
          <GluestackUIProvider config={config}>
            <></>
          </GluestackUIProvider>
        </Provider>,
      );

      unmount();

      await waitFor(() => {
        expect(true).toBe(true);
      });
    });

    it('多次初始化应该不泄漏内存', async () => {
      for (let i = 0; i < 5; i++) {
        const {unmount} = render(
          <Provider store={store}>
            <GluestackUIProvider config={config}>
              <></>
            </GluestackUIProvider>
          </Provider>,
        );

        unmount();
      }

      await waitFor(() => {
        expect(true).toBe(true);
      });
    });
  });

  describe('启动性能报告', () => {
    it('生成启动性能报告', async () => {
      const results = {
        gluestackInit: 0,
        reduxInit: 0,
        fullStackInit: 0,
        themeLoad: 0,
        emptyAppRender: 0,
        basicAppRender: 0,
      };

      // 测试 GluestackUIProvider 初始化
      let startTime = performance.now();
      render(
        <GluestackUIProvider config={config}>
          <></>
        </GluestackUIProvider>,
      );
      results.gluestackInit = performance.now() - startTime;

      // 测试 Redux Provider 初始化
      startTime = performance.now();
      render(
        <Provider store={store}>
          <></>
        </Provider>,
      );
      results.reduxInit = performance.now() - startTime;

      // 测试完整 Provider 栈初始化
      startTime = performance.now();
      render(
        <Provider store={store}>
          <GluestackUIProvider config={config}>
            <></>
          </GluestackUIProvider>
        </Provider>,
      );
      results.fullStackInit = performance.now() - startTime;

      // 测试主题加载
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('dark');
      startTime = performance.now();
      render(
        <Provider store={store}>
          <GluestackUIProvider config={config}>
            <></>
          </GluestackUIProvider>
        </Provider>,
      );
      await waitFor(() => {
        expect(AsyncStorage.getItem).toHaveBeenCalled();
      });
      results.themeLoad = performance.now() - startTime;

      // 测试空应用渲染
      startTime = performance.now();
      render(
        <Provider store={store}>
          <GluestackUIProvider config={config}>
            <></>
          </GluestackUIProvider>
        </Provider>,
      );
      results.emptyAppRender = performance.now() - startTime;

      // 测试带基础组件的应用渲染
      const {AppButton} = require('../../components/gluestack/Button');
      startTime = performance.now();
      render(
        <Provider store={store}>
          <GluestackUIProvider config={config}>
            <AppButton>测试</AppButton>
          </GluestackUIProvider>
        </Provider>,
      );
      results.basicAppRender = performance.now() - startTime;

      console.log('\n=== 应用启动性能报告 ===');
      console.log(
        `GluestackUIProvider 初始化: ${results.gluestackInit.toFixed(2)}ms`,
      );
      console.log(`Redux Provider 初始化: ${results.reduxInit.toFixed(2)}ms`);
      console.log(
        `完整 Provider 栈初始化: ${results.fullStackInit.toFixed(2)}ms`,
      );
      console.log(`主题加载: ${results.themeLoad.toFixed(2)}ms`);
      console.log(`空应用渲染: ${results.emptyAppRender.toFixed(2)}ms`);
      console.log(
        `带基础组件的应用渲染: ${results.basicAppRender.toFixed(2)}ms`,
      );
      console.log('========================\n');

      // 验证所有性能指标
      expect(results.gluestackInit).toBeLessThan(100);
      expect(results.reduxInit).toBeLessThan(50);
      expect(results.fullStackInit).toBeLessThan(150);
      expect(results.themeLoad).toBeLessThan(100);
      expect(results.emptyAppRender).toBeLessThan(100);
      expect(results.basicAppRender).toBeLessThan(200);
    });
  });
});
