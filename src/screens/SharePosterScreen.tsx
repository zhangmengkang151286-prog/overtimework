/**
 * SharePosterScreen - 已废弃，重定向到 AchievementPosterScreen
 *
 * 旧的 4 种海报轮播已替换为单一的个人成就海报。
 * 保留此文件用于向后兼容导航引用。
 */

import React, {useEffect} from 'react';
import {useNavigation, CommonActions} from '@react-navigation/native';

export const SharePosterScreen: React.FC = () => {
  const navigation = useNavigation();

  useEffect(() => {
    // 重定向到新的个人成就海报页面
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{name: 'AchievementPoster'}],
      }),
    );
  }, [navigation]);

  return null;
};

export default SharePosterScreen;
