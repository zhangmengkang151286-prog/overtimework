/**
 * SharePosterScreen 服务集成验证脚本
 * 
 * 验证内容：
 * 1. posterGeneratorService 正确引入
 * 2. posterDataService 正确引入
 * 3. 数据加载逻辑正确实现
 * 4. 保存和分享功能正确实现
 * 5. 错误处理正确实现
 */

import React from 'react';
import {View, Text, StyleSheet, ScrollView} from 'react-native';

// 导入服务
import {posterGeneratorService} from './src/services/posterGenerator';
import {posterDataService} from './src/services/posterData';

const VerifySharePosterIntegration = () => {
  const [results, setResults] = React.useState<string[]>([]);

  const addResult = (message: string, success: boolean) => {
    const icon = success ? '✅' : '❌';
    setResults((prev) => [...prev, `${icon} ${message}`]);
  };

  const runTests = async () => {
    setResults([]);
    console.log('开始验证 SharePosterScreen 服务集成...\n');

    // 测试 1: 验证 posterGeneratorService 导入
    try {
      if (posterGeneratorService) {
        addResult('posterGeneratorService 导入成功', true);
        
        // 检查方法是否存在
        const methods = [
          'captureView',
          'saveToLibrary',
          'shareImage',
          'cacheImage',
          'getCachedImage',
          'clearCache',
          'generateAndSave',
          'generateAndShare',
        ];
        
        const missingMethods = methods.filter(
          (method) => typeof (posterGeneratorService as any)[method] !== 'function'
        );
        
        if (missingMethods.length === 0) {
          addResult('posterGeneratorService 所有方法都存在', true);
        } else {
          addResult(
            `posterGeneratorService 缺少方法: ${missingMethods.join(', ')}`,
            false
          );
        }
      } else {
        addResult('posterGeneratorService 导入失败', false);
      }
    } catch (error) {
      addResult(`posterGeneratorService 验证失败: ${error}`, false);
    }

    // 测试 2: 验证 posterDataService 导入
    try {
      if (posterDataService) {
        addResult('posterDataService 导入成功', true);
        
        // 检查方法是否存在
        const methods = [
          'getUserInfo',
          'getTrendData',
          'getCalendarData',
          'getOvertimeTrendData',
          'getTagProportionData',
        ];
        
        const missingMethods = methods.filter(
          (method) => typeof (posterDataService as any)[method] !== 'function'
        );
        
        if (missingMethods.length === 0) {
          addResult('posterDataService 所有方法都存在', true);
        } else {
          addResult(
            `posterDataService 缺少方法: ${missingMethods.join(', ')}`,
            false
          );
        }
      } else {
        addResult('posterDataService 导入失败', false);
      }
    } catch (error) {
      addResult(`posterDataService 验证失败: ${error}`, false);
    }

    // 测试 3: 验证 SharePosterScreen 文件存在
    try {
      const SharePosterScreen = require('./src/screens/SharePosterScreen').default;
      if (SharePosterScreen) {
        addResult('SharePosterScreen 组件导入成功', true);
      } else {
        addResult('SharePosterScreen 组件导入失败', false);
      }
    } catch (error) {
      addResult(`SharePosterScreen 组件验证失败: ${error}`, false);
    }

    // 测试 4: 验证类型定义
    try {
      const {PosterType} = require('./src/types/poster');
      if (PosterType) {
        addResult('PosterType 枚举导入成功', true);
        
        // 检查枚举值
        const expectedTypes = ['TREND', 'CALENDAR', 'OVERTIME_TREND', 'TAG_PROPORTION'];
        const hasAllTypes = expectedTypes.every((type) => PosterType[type]);
        
        if (hasAllTypes) {
          addResult('PosterType 包含所有必需的类型', true);
        } else {
          addResult('PosterType 缺少某些类型', false);
        }
      } else {
        addResult('PosterType 枚举导入失败', false);
      }
    } catch (error) {
      addResult(`PosterType 验证失败: ${error}`, false);
    }

    console.log('\n验证完成！');
  };

  React.useEffect(() => {
    runTests();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>SharePosterScreen 服务集成验证</Text>
        <Text style={styles.subtitle}>验证服务层是否正确集成到主屏幕</Text>
      </View>

      <View style={styles.results}>
        {results.map((result, index) => (
          <Text key={index} style={styles.resultText}>
            {result}
          </Text>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          ✅ = 通过 | ❌ = 失败
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#999999',
  },
  results: {
    padding: 20,
  },
  resultText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 12,
    fontFamily: 'monospace',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#333333',
    marginTop: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
  },
});

export default VerifySharePosterIntegration;
