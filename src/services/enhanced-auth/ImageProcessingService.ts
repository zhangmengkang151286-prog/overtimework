/**
 * 图片处理服务
 *
 * 提供图片压缩、格式验证、上传等功能
 */

import {Platform} from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';

export interface ImageProcessingOptions {
  maxWidth?: number;
  maxHeight?: number;
  maxSizeInMB?: number;
  quality?: number;
  format?: 'jpeg' | 'png';
}

export interface ProcessedImage {
  uri: string;
  width: number;
  height: number;
  size: number;
  format: string;
}

export class ImageProcessingService {
  private static instance: ImageProcessingService;

  // 默认配置
  private static readonly DEFAULT_MAX_WIDTH = 1024;
  private static readonly DEFAULT_MAX_HEIGHT = 1024;
  private static readonly DEFAULT_MAX_SIZE_MB = 5;
  private static readonly DEFAULT_QUALITY = 0.8;
  private static readonly SUPPORTED_FORMATS = [
    'image/jpeg',
    'image/jpg',
    'image/png',
  ];

  private constructor() {}

  public static getInstance(): ImageProcessingService {
    if (!ImageProcessingService.instance) {
      ImageProcessingService.instance = new ImageProcessingService();
    }
    return ImageProcessingService.instance;
  }

  /**
   * 验证图片格式
   * @param imageType 图片MIME类型
   * @returns 是否为支持的格式
   */
  public validateImageFormat(imageType: string): boolean {
    return ImageProcessingService.SUPPORTED_FORMATS.includes(
      imageType.toLowerCase(),
    );
  }

  /**
   * 验证图片大小
   * @param sizeInBytes 图片大小(字节)
   * @param maxSizeInMB 最大大小(MB)
   * @returns 是否符合大小要求
   */
  public validateImageSize(
    sizeInBytes: number,
    maxSizeInMB: number = ImageProcessingService.DEFAULT_MAX_SIZE_MB,
  ): boolean {
    const sizeInMB = sizeInBytes / (1024 * 1024);
    return sizeInMB <= maxSizeInMB;
  }

  /**
   * 处理图片(压缩、调整大小)
   * @param imageUri 图片URI
   * @param options 处理选项
   * @returns 处理后的图片信息
   */
  public async processImage(
    imageUri: string,
    options: ImageProcessingOptions = {},
  ): Promise<ProcessedImage> {
    try {
      const {
        maxWidth = ImageProcessingService.DEFAULT_MAX_WIDTH,
        maxHeight = ImageProcessingService.DEFAULT_MAX_HEIGHT,
        quality = ImageProcessingService.DEFAULT_QUALITY,
        format = 'jpeg',
      } = options;

      // 获取图片信息
      const imageInfo = await this.getImageInfo(imageUri);

      // 计算新的尺寸
      const {width, height} = this.calculateNewDimensions(
        imageInfo.width,
        imageInfo.height,
        maxWidth,
        maxHeight,
      );

      // 压缩和调整大小
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        imageUri,
        [{resize: {width, height}}],
        {
          compress: quality,
          format:
            format === 'png'
              ? ImageManipulator.SaveFormat.PNG
              : ImageManipulator.SaveFormat.JPEG,
        },
      );

      // 获取处理后的图片大小
      const processedSize = await this.getImageSize(manipulatedImage.uri);

      return {
        uri: manipulatedImage.uri,
        width: manipulatedImage.width,
        height: manipulatedImage.height,
        size: processedSize,
        format,
      };
    } catch (error: any) {
      throw new Error(`图片处理失败: ${error.message || error}`);
    }
  }

  /**
   * 自动压缩图片直到满足大小要求
   * @param imageUri 图片URI
   * @param maxSizeInMB 最大大小(MB)
   * @returns 压缩后的图片信息
   */
  public async compressImageToSize(
    imageUri: string,
    maxSizeInMB: number = ImageProcessingService.DEFAULT_MAX_SIZE_MB,
  ): Promise<ProcessedImage> {
    let quality = ImageProcessingService.DEFAULT_QUALITY;
    let processedImage: ProcessedImage;

    // 最多尝试5次压缩
    for (let attempt = 0; attempt < 5; attempt++) {
      processedImage = await this.processImage(imageUri, {quality});

      // 检查大小是否满足要求
      if (this.validateImageSize(processedImage.size, maxSizeInMB)) {
        return processedImage;
      }

      // 降低质量继续压缩
      quality -= 0.15;
      if (quality < 0.3) {
        quality = 0.3; // 最低质量
      }
    }

    throw new Error(`图片压缩失败: 无法将图片压缩到${maxSizeInMB}MB以内`);
  }

  /**
   * 获取图片信息
   * @param imageUri 图片URI
   * @returns 图片信息
   */
  private async getImageInfo(
    imageUri: string,
  ): Promise<{width: number; height: number}> {
    return new Promise((resolve, reject) => {
      if (Platform.OS === 'web') {
        const img = new Image();
        img.onload = () => {
          resolve({width: img.width, height: img.height});
        };
        img.onerror = () => {
          reject(new Error('无法加载图片'));
        };
        img.src = imageUri;
      } else {
        // React Native
        const Image = require('react-native').Image;
        Image.getSize(
          imageUri,
          (width: number, height: number) => {
            resolve({width, height});
          },
          (error: any) => {
            reject(new Error(`获取图片信息失败: ${error}`));
          },
        );
      }
    });
  }

  /**
   * 获取图片文件大小
   * @param imageUri 图片URI
   * @returns 文件大小(字节)
   */
  private async getImageSize(imageUri: string): Promise<number> {
    try {
      if (Platform.OS === 'web') {
        const response = await fetch(imageUri);
        const blob = await response.blob();
        return blob.size;
      } else {
        // React Native - 使用 FileSystem
        const FileSystem = require('expo-file-system');
        const fileInfo = await FileSystem.getInfoAsync(imageUri);
        return fileInfo.size || 0;
      }
    } catch (error) {
      console.warn('获取图片大小失败:', error);
      return 0;
    }
  }

  /**
   * 计算新的图片尺寸(保持宽高比)
   * @param originalWidth 原始宽度
   * @param originalHeight 原始高度
   * @param maxWidth 最大宽度
   * @param maxHeight 最大高度
   * @returns 新的宽度和高度
   */
  private calculateNewDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number,
  ): {width: number; height: number} {
    let width = originalWidth;
    let height = originalHeight;

    // 如果宽度超过最大值
    if (width > maxWidth) {
      height = (maxWidth / width) * height;
      width = maxWidth;
    }

    // 如果高度超过最大值
    if (height > maxHeight) {
      width = (maxHeight / height) * width;
      height = maxHeight;
    }

    return {
      width: Math.round(width),
      height: Math.round(height),
    };
  }

  /**
   * 将图片转换为Blob对象(用于上传)
   * @param imageUri 图片URI
   * @returns Blob对象
   */
  public async imageToBlob(imageUri: string): Promise<Blob> {
    try {
      const response = await fetch(imageUri);
      return await response.blob();
    } catch (error: any) {
      throw new Error(`图片转换失败: ${error.message || error}`);
    }
  }

  /**
   * 获取用户友好的错误信息
   * @param error 错误对象
   * @returns 用户友好的错误信息
   */
  public getErrorMessage(error: any): string {
    if (error.message?.includes('格式')) {
      return '仅支持JPG、PNG格式的图片';
    }
    if (error.message?.includes('大小') || error.message?.includes('压缩')) {
      return '图片过大,请选择较小的图片';
    }
    if (error.message?.includes('权限')) {
      return '请授权访问相册';
    }
    if (error.message?.includes('取消')) {
      return '已取消选择图片';
    }
    return '图片处理失败,请重试';
  }
}

// 导出单例实例
export const imageProcessingService = ImageProcessingService.getInstance();
