import {RefObject} from 'react';
import {View, Alert, Linking, Platform} from 'react-native';
import {captureRef} from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import {PosterType} from '../types/poster';

/**
 * 海报生成器服务
 * 负责海报的截图、保存和分享功能
 */
class PosterGeneratorService {
  // 图片缓存
  private cache: Map<PosterType, string> = new Map();

  /**
   * 将 View 转换为图片
   * @param viewRef View 的引用
   * @returns 图片 URI
   */
  async captureView(viewRef: RefObject<View>): Promise<string> {
    try {
      if (!viewRef.current) {
        throw new Error('View 引用无效');
      }

      // 使用 react-native-view-shot 截图
      const uri = await captureRef(viewRef, {
        format: 'png',
        quality: 1.0,
        width: 750,
        height: 1334,
      });

      return uri;
    } catch (error) {
      console.error('截图失败:', error);
      
      // 显示错误提示
      Alert.alert(
        '生成失败',
        '海报生成失败，请重试',
        [
          {text: '确定', style: 'default'},
        ],
      );
      
      throw new Error('海报生成失败，请重试');
    }
  }

  /**
   * 保存图片到相册
   * @param uri 图片 URI
   */
  async saveToLibrary(uri: string): Promise<void> {
    try {
      // 1. 请求权限
      const {status} = await MediaLibrary.requestPermissionsAsync();

      if (status !== 'granted') {
        // 权限被拒绝，提示用户前往设置
        Alert.alert(
          '需要相册权限',
          '请在设置中开启相册访问权限，以便保存海报',
          [
            {text: '取消', style: 'cancel'},
            {
              text: '去设置',
              onPress: () => {
                if (Platform.OS === 'ios') {
                  Linking.openURL('app-settings:');
                } else {
                  Linking.openSettings();
                }
              },
            },
          ],
        );
        throw new Error('需要相册访问权限');
      }

      // 2. 保存到相册
      await MediaLibrary.saveToLibraryAsync(uri);

      // 3. 显示成功提示
      Alert.alert('保存成功', '海报已保存到相册', [
        {text: '确定', style: 'default'},
      ]);
    } catch (error) {
      console.error('保存到相册失败:', error);

      // 如果不是权限错误，显示通用错误提示
      if (error instanceof Error && !error.message.includes('权限')) {
        Alert.alert(
          '保存失败',
          '无法保存海报到相册，请重试',
          [
            {text: '确定', style: 'default'},
          ],
        );
      }

      throw error;
    }
  }

  /**
   * 分享图片
   * @param uri 图片 URI
   */
  async shareImage(uri: string): Promise<void> {
    try {
      // 检查分享功能是否可用
      const isAvailable = await Sharing.isAvailableAsync();

      if (!isAvailable) {
        Alert.alert(
          '分享失败',
          '当前设备不支持分享功能',
          [
            {text: '确定', style: 'default'},
          ],
        );
        throw new Error('分享功能不可用');
      }

      // 调用系统分享
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: '分享海报',
      });
    } catch (error) {
      console.error('分享失败:', error);

      // 如果不是用户取消分享，显示错误提示
      if (error instanceof Error && !error.message.includes('cancelled')) {
        Alert.alert(
          '分享失败',
          '无法分享海报，请重试',
          [
            {text: '确定', style: 'default'},
          ],
        );
      }

      throw error;
    }
  }

  /**
   * 缓存海报图片
   * @param type 海报类型
   * @param uri 图片 URI
   */
  cacheImage(type: PosterType, uri: string): void {
    this.cache.set(type, uri);
  }

  /**
   * 获取缓存的海报图片
   * @param type 海报类型
   * @returns 图片 URI 或 null
   */
  getCachedImage(type: PosterType): string | null {
    return this.cache.get(type) || null;
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * 清除指定类型的缓存
   * @param type 海报类型
   */
  clearCacheByType(type: PosterType): void {
    this.cache.delete(type);
  }

  /**
   * 检查相册权限状态
   * @returns 权限状态
   */
  async checkMediaLibraryPermission(): Promise<boolean> {
    try {
      const {status} = await MediaLibrary.getPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('检查相册权限失败:', error);
      return false;
    }
  }

  /**
   * 请求相册权限
   * @returns 是否授权成功
   */
  async requestMediaLibraryPermission(): Promise<boolean> {
    try {
      const {status} = await MediaLibrary.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('请求相册权限失败:', error);
      return false;
    }
  }

  /**
   * 生成并保存海报
   * @param viewRef View 的引用
   * @param type 海报类型
   */
  async generateAndSave(
    viewRef: RefObject<View>,
    type: PosterType,
  ): Promise<void> {
    try {
      // 1. 检查缓存
      let uri = this.getCachedImage(type);

      // 2. 如果没有缓存，生成新图片
      if (!uri) {
        uri = await this.captureView(viewRef);
        this.cacheImage(type, uri);
      }

      // 3. 保存到相册
      await this.saveToLibrary(uri);
    } catch (error) {
      console.error('生成并保存海报失败:', error);
      throw error;
    }
  }

  /**
   * 生成并分享海报
   * @param viewRef View 的引用
   * @param type 海报类型
   */
  async generateAndShare(
    viewRef: RefObject<View>,
    type: PosterType,
  ): Promise<void> {
    try {
      // 1. 检查缓存
      let uri = this.getCachedImage(type);

      // 2. 如果没有缓存，生成新图片
      if (!uri) {
        uri = await this.captureView(viewRef);
        this.cacheImage(type, uri);
      }

      // 3. 分享图片
      await this.shareImage(uri);
    } catch (error) {
      console.error('生成并分享海报失败:', error);
      throw error;
    }
  }
}

// 导出单例
export const posterGeneratorService = new PosterGeneratorService();
export default posterGeneratorService;
