/**
 * 系统内置头像数据 - 使用本地 SVG 文件
 */

import React from 'react';
import {View, StyleSheet} from 'react-native';

// 导入 SVG 头像文件
import Avatar01 from '../../assets/avatars/avatar_01.svg';
import Avatar02 from '../../assets/avatars/avatar_02.svg';
import Avatar03 from '../../assets/avatars/avatar_03.svg';
import Avatar04 from '../../assets/avatars/avatar_04.svg';
import Avatar05 from '../../assets/avatars/avatar_05.svg';
import Avatar06 from '../../assets/avatars/avatar_06.svg';
import Avatar07 from '../../assets/avatars/avatar_07.svg';
import Avatar08 from '../../assets/avatars/avatar_08.svg';
import Avatar09 from '../../assets/avatars/avatar_09.svg';
import Avatar10 from '../../assets/avatars/avatar_10.svg';
import Avatar11 from '../../assets/avatars/avatar_11.svg';
import Avatar12 from '../../assets/avatars/avatar_12.svg';
import Avatar13 from '../../assets/avatars/avatar_13.svg';
import Avatar14 from '../../assets/avatars/avatar_14.svg';
import Avatar15 from '../../assets/avatars/avatar_15.svg';
import Avatar16 from '../../assets/avatars/avatar_16.svg';
import Avatar17 from '../../assets/avatars/avatar_17.svg';
import Avatar18 from '../../assets/avatars/avatar_18.svg';
import Avatar19 from '../../assets/avatars/avatar_19.svg';
import Avatar20 from '../../assets/avatars/avatar_20.svg';

export interface BuiltInAvatar {
  id: string;
  component: React.FC<any>; // SVG 组件
}

/** 20 个内置头像配置 */
export const BUILT_IN_AVATARS: BuiltInAvatar[] = [
  {id: 'avatar_01', component: Avatar01},
  {id: 'avatar_02', component: Avatar02},
  {id: 'avatar_03', component: Avatar03},
  {id: 'avatar_04', component: Avatar04},
  {id: 'avatar_05', component: Avatar05},
  {id: 'avatar_06', component: Avatar06},
  {id: 'avatar_07', component: Avatar07},
  {id: 'avatar_08', component: Avatar08},
  {id: 'avatar_09', component: Avatar09},
  {id: 'avatar_10', component: Avatar10},
  {id: 'avatar_11', component: Avatar11},
  {id: 'avatar_12', component: Avatar12},
  {id: 'avatar_13', component: Avatar13},
  {id: 'avatar_14', component: Avatar14},
  {id: 'avatar_15', component: Avatar15},
  {id: 'avatar_16', component: Avatar16},
  {id: 'avatar_17', component: Avatar17},
  {id: 'avatar_18', component: Avatar18},
  {id: 'avatar_19', component: Avatar19},
  {id: 'avatar_20', component: Avatar20},
];

/** 根据 avatarId 获取头像配置 */
export function getAvatarById(avatarId: string): BuiltInAvatar | undefined {
  return BUILT_IN_AVATARS.find(a => a.id === avatarId);
}

/**
 * Avatar 组件 - 根据 avatarId 渲染头像
 * 用法: <Avatar avatarId={user.avatar} size={44} />
 */
interface AvatarProps {
  avatarId?: string | null;
  size?: number;
}

export const Avatar: React.FC<AvatarProps> = ({avatarId, size = 44}) => {
  const config = avatarId ? getAvatarById(avatarId) : undefined;
  const avatar = config || BUILT_IN_AVATARS[0];
  const SvgComponent = avatar.component;

  return (
    <View
      style={[
        styles.container,
        {width: size, height: size, borderRadius: size / 2},
      ]}>
      <SvgComponent width={size} height={size} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
});
