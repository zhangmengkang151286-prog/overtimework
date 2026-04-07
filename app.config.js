import 'dotenv/config';

export default {
  expo: {
    name: '下班指数',
    slug: 'OvertimeIndexApp',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/image_1024x1024_sharp.png',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#000000',
    },
    ios: {
      bundleIdentifier: 'com.overtimeindexapp',
      buildNumber: '1.0.4',
      supportsTablet: true,
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSPhotoLibraryUsageDescription: '允许访问相册以上传头像',
        NSCameraUsageDescription: '允许使用相机拍摄头像',
        NSLocationWhenInUseUsageDescription: '允许访问位置以自动填充省份城市',
      },
    },
    android: {
      package: 'com.overtimeindexapp',
      versionCode: 1,
      adaptiveIcon: {
        foregroundImage: './assets/image_1024x1024_sharp.png',
        backgroundColor: '#000000',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      permissions: [
        'READ_EXTERNAL_STORAGE',
        'WRITE_EXTERNAL_STORAGE',
        'ACCESS_FINE_LOCATION',
        'ACCESS_COARSE_LOCATION',
        'CAMERA',
      ],
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: [
      '@react-native-community/datetimepicker',
      [
        'expo-notifications',
        {
          sounds: [],
        },
      ],
      [
        'expo-media-library',
        {
          photosPermission: '允许下班指数保存海报到相册',
          savePhotosPermission: '允许下班指数保存海报到相册',
          isAccessMediaLocationEnabled: true,
        },
      ],
      [
        '@sentry/react-native',
        {
          organization: 'overtime-index',
          project: 'react-native',
        },
      ],
    ],
    extra: {
      eas: {
        projectId: '62b123ec-2cc4-4cdd-b96c-dafddd511138',
      },
      API_BASE_URL: process.env.API_BASE_URL,
      API_KEY: process.env.API_KEY,
    },
  },
};
