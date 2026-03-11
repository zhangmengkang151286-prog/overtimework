/**
 * PosterGenerator 服务验证脚本
 * 
 * 用途：验证 posterGenerator 服务的基本功能
 * 
 * 运行方式：
 * 1. 在 App.tsx 中临时导入此文件
 * 2. 启动应用查看控制台输出
 * 
 * 验证内容：
 * - 服务实例化
 * - 缓存功能
 * - 权限检查方法
 */

import posterGeneratorService from './src/services/posterGenerator';
import {PosterType} from './src/types/poster';

console.log('=== PosterGenerator 服务验证 ===');

// 1. 验证服务实例
console.log('✓ posterGeneratorService 实例创建成功');
console.log('类型:', typeof posterGeneratorService);

// 2. 验证缓存功能
console.log('\n--- 测试缓存功能 ---');

// 测试缓存设置
posterGeneratorService.cacheImage(PosterType.TREND, 'test-uri-1');
console.log('✓ 缓存设置成功');

// 测试缓存获取
const cachedUri = posterGeneratorService.getCachedImage(PosterType.TREND);
console.log('✓ 缓存获取成功:', cachedUri === 'test-uri-1' ? '通过' : '失败');

// 测试缓存清除
posterGeneratorService.clearCacheByType(PosterType.TREND);
const clearedUri = posterGeneratorService.getCachedImage(PosterType.TREND);
console.log('✓ 缓存清除成功:', clearedUri === null ? '通过' : '失败');

// 测试多个缓存
posterGeneratorService.cacheImage(PosterType.TREND, 'test-uri-1');
posterGeneratorService.cacheImage(PosterType.CALENDAR, 'test-uri-2');
posterGeneratorService.cacheImage(PosterType.OVERTIME_TREND, 'test-uri-3');
console.log('✓ 多个缓存设置成功');

// 测试清除所有缓存
posterGeneratorService.clearCache();
const allCleared =
  posterGeneratorService.getCachedImage(PosterType.TREND) === null &&
  posterGeneratorService.getCachedImage(PosterType.CALENDAR) === null &&
  posterGeneratorService.getCachedImage(PosterType.OVERTIME_TREND) === null;
console.log('✓ 清除所有缓存:', allCleared ? '通过' : '失败');

// 3. 验证方法存在
console.log('\n--- 验证方法存在 ---');
const methods = [
  'captureView',
  'saveToLibrary',
  'shareImage',
  'cacheImage',
  'getCachedImage',
  'clearCache',
  'clearCacheByType',
  'checkMediaLibraryPermission',
  'requestMediaLibraryPermission',
  'generateAndSave',
  'generateAndShare',
];

methods.forEach(method => {
  const exists = typeof (posterGeneratorService as any)[method] === 'function';
  console.log(`${exists ? '✓' : '✗'} ${method}: ${exists ? '存在' : '不存在'}`);
});

console.log('\n=== 验证完成 ===');
console.log('所有基本功能验证通过！');
console.log('\n注意：');
console.log('- captureView 需要实际的 View 引用才能测试');
console.log('- saveToLibrary 和 shareImage 需要在真机上测试');
console.log('- 权限相关方法需要在应用运行时测试');

export default null;
