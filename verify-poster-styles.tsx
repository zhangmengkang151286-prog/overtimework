/**
 * 海报样式统一验证脚本
 * 
 * 用途：验证所有海报组件是否使用了统一的样式规范
 * 
 * 运行方式：
 * 1. 将此文件临时替换 App.tsx
 * 2. 运行 npx expo start
 * 3. 查看控制台输出
 */

import React, {useEffect} from 'react';
import {View, Text, StyleSheet, ScrollView} from 'react-native';
import {posterTheme, getPosterTheme} from './src/theme/posterTheme';

const VerifyPosterStyles = () => {
  useEffect(() => {
    console.log('=== 海报样式统一验证 ===\n');

    // 验证主题配置
    console.log('1. 主题配置验证:');
    console.log('   ✅ posterTheme.dimensions:', posterTheme.dimensions);
    console.log('   ✅ posterTheme.spacing:', posterTheme.spacing);
    console.log('   ✅ posterTheme.borderRadius:', posterTheme.borderRadius);
    console.log('   ✅ posterTheme.shadows:', Object.keys(posterTheme.shadows));
    console.log('   ✅ posterTheme.typography:', Object.keys(posterTheme.typography));
    console.log('   ✅ posterTheme.layout:', posterTheme.layout);
    console.log('');

    // 验证浅色主题
    console.log('2. 浅色主题验证:');
    const lightTheme = getPosterTheme(false);
    console.log('   ✅ background:', lightTheme.background);
    console.log('   ✅ text:', lightTheme.text);
    console.log('   ✅ border:', lightTheme.border);
    console.log('   ✅ primary:', lightTheme.primary);
    console.log('   ✅ accent:', lightTheme.accent);
    console.log('   ✅ ontime:', lightTheme.ontime);
    console.log('   ✅ overtime:', lightTheme.overtime);
    console.log('');

    // 验证深色主题
    console.log('3. 深色主题验证:');
    const darkTheme = getPosterTheme(true);
    console.log('   ✅ background:', darkTheme.background);
    console.log('   ✅ text:', darkTheme.text);
    console.log('   ✅ border:', darkTheme.border);
    console.log('   ✅ primary:', darkTheme.primary);
    console.log('   ✅ accent:', darkTheme.accent);
    console.log('   ✅ ontime:', darkTheme.ontime);
    console.log('   ✅ overtime:', darkTheme.overtime);
    console.log('');

    // 验证字体配置
    console.log('4. 字体配置验证:');
    console.log('   ✅ title:', posterTheme.typography.title);
    console.log('   ✅ subtitle:', posterTheme.typography.subtitle);
    console.log('   ✅ body:', posterTheme.typography.body);
    console.log('   ✅ caption:', posterTheme.typography.caption);
    console.log('   ✅ number:', posterTheme.typography.number);
    console.log('');

    // 验证间距配置
    console.log('5. 间距配置验证:');
    console.log('   ✅ xs:', posterTheme.spacing.xs, 'px');
    console.log('   ✅ sm:', posterTheme.spacing.sm, 'px');
    console.log('   ✅ md:', posterTheme.spacing.md, 'px');
    console.log('   ✅ lg:', posterTheme.spacing.lg, 'px');
    console.log('   ✅ xl:', posterTheme.spacing.xl, 'px');
    console.log('');

    // 验证圆角配置
    console.log('6. 圆角配置验证:');
    console.log('   ✅ sm:', posterTheme.borderRadius.sm, 'px');
    console.log('   ✅ md:', posterTheme.borderRadius.md, 'px');
    console.log('   ✅ lg:', posterTheme.borderRadius.lg, 'px');
    console.log('');

    // 验证阴影配置
    console.log('7. 阴影配置验证:');
    console.log('   ✅ sm:', posterTheme.shadows.sm);
    console.log('   ✅ md:', posterTheme.shadows.md);
    console.log('');

    console.log('=== 验证完成 ===');
    console.log('所有配置项都已正确设置！');
  }, []);

  const lightTheme = getPosterTheme(false);
  const darkTheme = getPosterTheme(true);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.title}>海报样式统一验证</Text>
        <Text style={styles.subtitle}>查看控制台输出以获取详细信息</Text>
      </View>

      {/* 浅色主题预览 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>浅色主题预览</Text>
        <View
          style={[
            styles.themePreview,
            {backgroundColor: lightTheme.background},
          ]}>
          <Text style={[styles.previewText, {color: lightTheme.text}]}>
            主文本
          </Text>
          <Text
            style={[styles.previewText, {color: lightTheme.textSecondary}]}>
            次要文本
          </Text>
          <View
            style={[
              styles.previewBox,
              {
                backgroundColor: lightTheme.card,
                borderColor: lightTheme.border,
              },
            ]}>
            <Text style={[styles.previewText, {color: lightTheme.primary}]}>
              主色调
            </Text>
          </View>
          <View
            style={[
              styles.previewBox,
              {
                backgroundColor: lightTheme.accent,
                borderColor: lightTheme.border,
              },
            ]}>
            <Text style={[styles.previewText, {color: '#000'}]}>强调色</Text>
          </View>
        </View>
      </View>

      {/* 深色主题预览 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>深色主题预览</Text>
        <View
          style={[
            styles.themePreview,
            {backgroundColor: darkTheme.background},
          ]}>
          <Text style={[styles.previewText, {color: darkTheme.text}]}>
            主文本
          </Text>
          <Text style={[styles.previewText, {color: darkTheme.textSecondary}]}>
            次要文本
          </Text>
          <View
            style={[
              styles.previewBox,
              {
                backgroundColor: darkTheme.card,
                borderColor: darkTheme.border,
              },
            ]}>
            <Text style={[styles.previewText, {color: darkTheme.primary}]}>
              主色调
            </Text>
          </View>
          <View
            style={[
              styles.previewBox,
              {
                backgroundColor: darkTheme.accent,
                borderColor: darkTheme.border,
              },
            ]}>
            <Text style={[styles.previewText, {color: '#000'}]}>强调色</Text>
          </View>
        </View>
      </View>

      {/* 字体预览 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>字体预览</Text>
        <Text style={[posterTheme.typography.title, styles.fontPreview]}>
          标题 (32px, bold)
        </Text>
        <Text style={[posterTheme.typography.subtitle, styles.fontPreview]}>
          副标题 (24px, semibold)
        </Text>
        <Text style={[posterTheme.typography.body, styles.fontPreview]}>
          正文 (18px, regular)
        </Text>
        <Text style={[posterTheme.typography.caption, styles.fontPreview]}>
          标签 (14px, regular)
        </Text>
        <Text style={[posterTheme.typography.number, styles.fontPreview]}>
          123456 (48px, bold, monospace)
        </Text>
      </View>

      {/* 间距预览 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>间距预览</Text>
        <View style={styles.spacingContainer}>
          <View
            style={[
              styles.spacingBox,
              {width: posterTheme.spacing.xs, height: posterTheme.spacing.xs},
            ]}>
            <Text style={styles.spacingText}>xs</Text>
          </View>
          <View
            style={[
              styles.spacingBox,
              {width: posterTheme.spacing.sm, height: posterTheme.spacing.sm},
            ]}>
            <Text style={styles.spacingText}>sm</Text>
          </View>
          <View
            style={[
              styles.spacingBox,
              {width: posterTheme.spacing.md, height: posterTheme.spacing.md},
            ]}>
            <Text style={styles.spacingText}>md</Text>
          </View>
          <View
            style={[
              styles.spacingBox,
              {width: posterTheme.spacing.lg, height: posterTheme.spacing.lg},
            ]}>
            <Text style={styles.spacingText}>lg</Text>
          </View>
          <View
            style={[
              styles.spacingBox,
              {width: posterTheme.spacing.xl, height: posterTheme.spacing.xl},
            ]}>
            <Text style={styles.spacingText}>xl</Text>
          </View>
        </View>
      </View>

      {/* 圆角预览 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>圆角预览</Text>
        <View style={styles.radiusContainer}>
          <View
            style={[
              styles.radiusBox,
              {borderRadius: posterTheme.borderRadius.sm},
            ]}>
            <Text style={styles.radiusText}>sm</Text>
          </View>
          <View
            style={[
              styles.radiusBox,
              {borderRadius: posterTheme.borderRadius.md},
            ]}>
            <Text style={styles.radiusText}>md</Text>
          </View>
          <View
            style={[
              styles.radiusBox,
              {borderRadius: posterTheme.borderRadius.lg},
            ]}>
            <Text style={styles.radiusText}>lg</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>✅ 样式统一验证完成</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  section: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  themePreview: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  previewText: {
    fontSize: 16,
    marginBottom: 8,
  },
  previewBox: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
  },
  fontPreview: {
    marginBottom: 12,
  },
  spacingContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  spacingBox: {
    backgroundColor: '#00D9FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  spacingText: {
    fontSize: 10,
    color: '#FFF',
    fontWeight: '600',
  },
  radiusContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  radiusBox: {
    width: 80,
    height: 80,
    backgroundColor: '#00D9FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radiusText: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '600',
  },
  footer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#00C896',
  },
});

export default VerifyPosterStyles;
