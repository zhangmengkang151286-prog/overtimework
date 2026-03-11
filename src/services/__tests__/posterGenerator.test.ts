import {RefObject} from 'react';
import {View, Alert} from 'react-native';
import {PosterType} from '../../types/poster';

// Mock 函数
const mockCaptureRef = jest.fn();
const mockRequestPermissionsAsync = jest.fn();
const mockSaveToLibraryAsync = jest.fn();
const mockGetPermissionsAsync = jest.fn();
const mockIsAvailableAsync = jest.fn();
const mockShareAsync = jest.fn();

// Mock 模块
jest.mock('react-native-view-shot', () => ({
  captureRef: mockCaptureRef,
}));

jest.mock('expo-media-library', () => ({
  requestPermissionsAsync: mockRequestPermissionsAsync,
  saveToLibraryAsync: mockSaveToLibraryAsync,
  getPermissionsAsync: mockGetPermissionsAsync,
}));

jest.mock('expo-sharing', () => ({
  isAvailableAsync: mockIsAvailableAsync,
  shareAsync: mockShareAsync,
}));

// Mock Alert.alert
jest.spyOn(Alert, 'alert');

// 导入服务
import {posterGeneratorService} from '../posterGenerator';

describe('PosterGeneratorService', () => {
  beforeEach(() => {
    mockCaptureRef.mockClear();
    mockRequestPermissionsAsync.mockClear();
    mockSaveToLibraryAsync.mockClear();
    mockGetPermissionsAsync.mockClear();
    mockIsAvailableAsync.mockClear();
    mockShareAsync.mockClear();
    jest.clearAllMocks();
    posterGeneratorService.clearCache();
  });

  describe('captureView', () => {
    it('应该成功截图并返回 URI', async () => {
      const mockUri = 'file:///path/to/image.png';
      const mockViewRef = {
        current: {} as View,
      } as RefObject<View>;

      mockCaptureRef.mockResolvedValueOnce(mockUri);

      const result = await posterGeneratorService.captureView(mockViewRef);

      expect(result).toBe(mockUri);
      expect(mockCaptureRef).toHaveBeenCalledWith(mockViewRef, {
        format: 'png',
        quality: 1.0,
        width: 750,
        height: 1334,
      });
    });

    it('当 View 引用无效时应该抛出错误', async () => {
      const mockViewRef = {
        current: null,
      } as unknown as RefObject<View>;

      await expect(
        posterGeneratorService.captureView(mockViewRef),
      ).rejects.toThrow();
    });

    it('当截图失败时应该显示错误提示并抛出错误', async () => {
      const mockViewRef = {
        current: {} as View,
      } as RefObject<View>;

      mockCaptureRef.mockRejectedValueOnce(new Error('截图失败'));

      await expect(
        posterGeneratorService.captureView(mockViewRef),
      ).rejects.toThrow();

      expect(Alert.alert).toHaveBeenCalled();
    });
  });

  describe('saveToLibrary', () => {
    it('应该成功保存图片到相册', async () => {
      const mockUri = 'file:///path/to/image.png';

      mockRequestPermissionsAsync.mockResolvedValueOnce({status: 'granted'});
      mockSaveToLibraryAsync.mockResolvedValueOnce({});

      await posterGeneratorService.saveToLibrary(mockUri);

      expect(mockRequestPermissionsAsync).toHaveBeenCalled();
      expect(mockSaveToLibraryAsync).toHaveBeenCalledWith(mockUri);
      expect(Alert.alert).toHaveBeenCalledWith(
        '保存成功',
        '海报已保存到相册',
        expect.any(Array),
      );
    });

    it('当权限被拒绝时应该提示用户前往设置', async () => {
      const mockUri = 'file:///path/to/image.png';

      mockRequestPermissionsAsync.mockResolvedValueOnce({status: 'denied'});

      await expect(
        posterGeneratorService.saveToLibrary(mockUri),
      ).rejects.toThrow('需要相册访问权限');

      expect(Alert.alert).toHaveBeenCalledWith(
        '需要相册权限',
        expect.any(String),
        expect.any(Array),
      );
    });

    it('当保存失败时应该显示错误提示', async () => {
      const mockUri = 'file:///path/to/image.png';

      mockRequestPermissionsAsync.mockResolvedValueOnce({status: 'granted'});
      mockSaveToLibraryAsync.mockRejectedValueOnce(new Error('保存失败'));

      await expect(
        posterGeneratorService.saveToLibrary(mockUri),
      ).rejects.toThrow();

      expect(Alert.alert).toHaveBeenCalled();
    });
  });

  describe('shareImage', () => {
    it('应该成功分享图片', async () => {
      const mockUri = 'file:///path/to/image.png';

      mockIsAvailableAsync.mockResolvedValueOnce(true);
      mockShareAsync.mockResolvedValueOnce({});

      await posterGeneratorService.shareImage(mockUri);

      expect(mockIsAvailableAsync).toHaveBeenCalled();
      expect(mockShareAsync).toHaveBeenCalledWith(mockUri, {
        mimeType: 'image/png',
        dialogTitle: '分享海报',
      });
    });

    it('当分享功能不可用时应该显示错误提示', async () => {
      const mockUri = 'file:///path/to/image.png';

      mockIsAvailableAsync.mockResolvedValueOnce(false);

      await expect(
        posterGeneratorService.shareImage(mockUri),
      ).rejects.toThrow('分享功能不可用');

      expect(Alert.alert).toHaveBeenCalledWith(
        '分享失败',
        '当前设备不支持分享功能',
        expect.any(Array),
      );
    });

    it('当分享失败时应该显示错误提示', async () => {
      const mockUri = 'file:///path/to/image.png';

      mockIsAvailableAsync.mockResolvedValueOnce(true);
      mockShareAsync.mockRejectedValueOnce(new Error('分享失败'));

      await expect(
        posterGeneratorService.shareImage(mockUri),
      ).rejects.toThrow();

      expect(Alert.alert).toHaveBeenCalled();
    });

    it('当用户取消分享时不应该显示错误提示', async () => {
      const mockUri = 'file:///path/to/image.png';

      mockIsAvailableAsync.mockResolvedValueOnce(true);
      mockShareAsync.mockRejectedValueOnce(new Error('User cancelled'));

      await expect(
        posterGeneratorService.shareImage(mockUri),
      ).rejects.toThrow();

      // Alert.alert 不应该被调用（用户主动取消）
      expect(Alert.alert).not.toHaveBeenCalled();
    });
  });

  describe('缓存管理', () => {
    it('应该能够缓存图片', () => {
      const mockUri = 'file:///path/to/image.png';
      const posterType = PosterType.TREND;

      posterGeneratorService.cacheImage(posterType, mockUri);

      const cachedUri = posterGeneratorService.getCachedImage(posterType);
      expect(cachedUri).toBe(mockUri);
    });

    it('当缓存不存在时应该返回 null', () => {
      const cachedUri = posterGeneratorService.getCachedImage(
        PosterType.OVERTIME_TREND,
      );

      expect(cachedUri).toBeNull();
    });

    it('应该能够清除所有缓存', () => {
      posterGeneratorService.cacheImage(
        PosterType.TREND,
        'file:///path/to/trend.png',
      );
      posterGeneratorService.cacheImage(
        PosterType.CALENDAR,
        'file:///path/to/calendar.png',
      );

      posterGeneratorService.clearCache();

      expect(posterGeneratorService.getCachedImage(PosterType.TREND)).toBeNull();
      expect(
        posterGeneratorService.getCachedImage(PosterType.CALENDAR),
      ).toBeNull();
    });

    it('应该能够清除指定类型的缓存', () => {
      posterGeneratorService.cacheImage(
        PosterType.TREND,
        'file:///path/to/trend.png',
      );
      posterGeneratorService.cacheImage(
        PosterType.CALENDAR,
        'file:///path/to/calendar.png',
      );

      posterGeneratorService.clearCacheByType(PosterType.TREND);

      expect(posterGeneratorService.getCachedImage(PosterType.TREND)).toBeNull();
      expect(
        posterGeneratorService.getCachedImage(PosterType.CALENDAR),
      ).toBe('file:///path/to/calendar.png');
    });
  });

  describe('权限检查', () => {
    it('应该能够检查相册权限状态', async () => {
      mockGetPermissionsAsync.mockResolvedValueOnce({status: 'granted'});

      const hasPermission =
        await posterGeneratorService.checkMediaLibraryPermission();

      expect(mockGetPermissionsAsync).toHaveBeenCalled();
      expect(hasPermission).toBe(true);
    });

    it('当没有权限时应该返回 false', async () => {
      mockGetPermissionsAsync.mockResolvedValueOnce({status: 'denied'});

      const hasPermission =
        await posterGeneratorService.checkMediaLibraryPermission();

      expect(hasPermission).toBe(false);
    });

    it('当检查权限失败时应该返回 false', async () => {
      mockGetPermissionsAsync.mockRejectedValueOnce(new Error('检查失败'));

      const hasPermission =
        await posterGeneratorService.checkMediaLibraryPermission();

      expect(hasPermission).toBe(false);
    });

    it('应该能够请求相册权限', async () => {
      mockRequestPermissionsAsync.mockResolvedValueOnce({status: 'granted'});

      const granted =
        await posterGeneratorService.requestMediaLibraryPermission();

      expect(granted).toBe(true);
      expect(mockRequestPermissionsAsync).toHaveBeenCalled();
    });

    it('当用户拒绝权限时应该返回 false', async () => {
      mockRequestPermissionsAsync.mockResolvedValueOnce({status: 'denied'});

      const granted =
        await posterGeneratorService.requestMediaLibraryPermission();

      expect(granted).toBe(false);
    });
  });

  describe('generateAndSave', () => {
    it('应该使用缓存的图片保存', async () => {
      const mockUri = 'file:///path/to/cached.png';
      const mockViewRef = {
        current: {} as View,
      } as RefObject<View>;

      // 先缓存图片
      posterGeneratorService.cacheImage(PosterType.TREND, mockUri);

      mockRequestPermissionsAsync.mockResolvedValueOnce({status: 'granted'});
      mockSaveToLibraryAsync.mockResolvedValueOnce({});

      await posterGeneratorService.generateAndSave(
        mockViewRef,
        PosterType.TREND,
      );

      // 不应该调用截图，因为使用了缓存
      expect(mockCaptureRef).not.toHaveBeenCalled();
      expect(mockSaveToLibraryAsync).toHaveBeenCalledWith(mockUri);
    });

    it('当没有缓存时应该生成新图片并保存', async () => {
      const mockUri = 'file:///path/to/new.png';
      const mockViewRef = {
        current: {} as View,
      } as RefObject<View>;

      mockCaptureRef.mockResolvedValueOnce(mockUri);
      mockRequestPermissionsAsync.mockResolvedValueOnce({status: 'granted'});
      mockSaveToLibraryAsync.mockResolvedValueOnce({});

      await posterGeneratorService.generateAndSave(
        mockViewRef,
        PosterType.CALENDAR,
      );

      expect(mockCaptureRef).toHaveBeenCalled();
      expect(mockSaveToLibraryAsync).toHaveBeenCalledWith(mockUri);
      // 应该缓存新生成的图片
      expect(posterGeneratorService.getCachedImage(PosterType.CALENDAR)).toBe(
        mockUri,
      );
    });
  });

  describe('generateAndShare', () => {
    it('应该使用缓存的图片分享', async () => {
      const mockUri = 'file:///path/to/cached.png';
      const mockViewRef = {
        current: {} as View,
      } as RefObject<View>;

      // 先缓存图片
      posterGeneratorService.cacheImage(PosterType.TREND, mockUri);

      mockIsAvailableAsync.mockResolvedValueOnce(true);
      mockShareAsync.mockResolvedValueOnce({});

      await posterGeneratorService.generateAndShare(
        mockViewRef,
        PosterType.TREND,
      );

      // 不应该调用截图，因为使用了缓存
      expect(mockCaptureRef).not.toHaveBeenCalled();
      expect(mockShareAsync).toHaveBeenCalledWith(mockUri, expect.any(Object));
    });

    it('当没有缓存时应该生成新图片并分享', async () => {
      const mockUri = 'file:///path/to/new.png';
      const mockViewRef = {
        current: {} as View,
      } as RefObject<View>;

      mockCaptureRef.mockResolvedValueOnce(mockUri);
      mockIsAvailableAsync.mockResolvedValueOnce(true);
      mockShareAsync.mockResolvedValueOnce({});

      await posterGeneratorService.generateAndShare(
        mockViewRef,
        PosterType.TAG_PROPORTION,
      );

      expect(mockCaptureRef).toHaveBeenCalled();
      expect(mockShareAsync).toHaveBeenCalledWith(mockUri, expect.any(Object));
      // 应该缓存新生成的图片
      expect(
        posterGeneratorService.getCachedImage(PosterType.TAG_PROPORTION),
      ).toBe(mockUri);
    });
  });
});
