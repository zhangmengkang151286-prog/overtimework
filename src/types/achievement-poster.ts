/**
 * 个人成就海报类型定义
 * 用于个人成就海报 V2 功能的所有类型接口
 */

import {ImageSourcePropType} from 'react-native';

// ============================================================
// 海报数据接口
// ============================================================

/**
 * 个人成就海报完整数据
 */
export interface AchievementPosterData {
  // 用户信息
  username: string;
  avatarId: string;

  // 排名数据
  rankPercentage: number; // 0-100，比当前用户下班晚的人占比
  participantCount: number; // 本轮已打卡总人数
  isOnTime: boolean; // true=准时（百分比>50%），false=加班

  // 插画
  illustrationSource: ImageSourcePropType; // require() 返回的图片资源

  // 文案
  caption: string; // 动态一句话文案

  // 格式化文本
  percentageText: string; // "70%"
  participantText: string; // "200"
  prefixText: string; // "你比"
  suffixText: string; // "的人走得早" 或 "的人走得晚"
}

/**
 * 可序列化的海报数据（不含 illustrationSource 等不可序列化字段）
 */
export interface SerializableAchievementPosterData {
  username: string;
  avatarId: string;
  rankPercentage: number;
  participantCount: number;
  isOnTime: boolean;
  caption: string;
  percentageText: string;
  participantText: string;
  prefixText: string;
  suffixText: string;
}

// ============================================================
// 插画池常量
// ============================================================

/**
 * 准时插画池（9 张）
 */
export const ONTIME_ILLUSTRATIONS: ImageSourcePropType[] = [
  require('../../assets/ontime/flat_arms_up.png'),
  require('../../assets/ontime/flat_cheering.png'),
  require('../../assets/ontime/flat_handstand.png'),
  require('../../assets/ontime/flat_hurdling.png'),
  require('../../assets/ontime/flat_one_hand_lean.png'),
  require('../../assets/ontime/flat_punching_air.png'),
  require('../../assets/ontime/flat_skating_away.png'),
  require('../../assets/ontime/flat_stretching.png'),
  require('../../assets/ontime/flat_tossing_bag.png'),
];

/**
 * 加班插画池（9 张）
 */
export const OVERTIME_ILLUSTRATIONS: ImageSourcePropType[] = [
  require('../../assets/overtime/flat_curled_up.png'),
  require('../../assets/overtime/flat_dragging_feet.png'),
  require('../../assets/overtime/flat_facepalm.png'),
  require('../../assets/overtime/flat_kneeling.png'),
  require('../../assets/overtime/flat_lying_down.png'),
  require('../../assets/overtime/flat_melted_on_chair.png'),
  require('../../assets/overtime/flat_sitting_rest.png'),
  require('../../assets/overtime/flat_sliding_knees.png'),
  require('../../assets/overtime/flat_slumped.png'),
];

// ============================================================
// 文案池常量
// ============================================================

/**
 * 文案分档类型
 */
export type CaptionTier =
  | 'ontimeHigh'
  | 'ontimeMid'
  | 'overtimeLow'
  | 'overtimeHigh';

/**
 * 动态文案池（每档至少 3 条）
 */
export const CAPTIONS: Record<CaptionTier, string[]> = {
  // ≥70%
  ontimeHigh: [
    '光速下班选手',
    '今天也是准时下班的一天',
    '下班冲刺冠军',
    '自由的空气真香',
  ],
  // ≥50% && <70%
  ontimeMid: [
    '稳稳地准时下班',
    '不急不慢，刚刚好',
    '准时收工，生活继续',
  ],
  // ≥30% && <50%
  overtimeLow: [
    '今天稍微多待了一会儿',
    '加班不多，还行',
    '小小加班，问题不大',
  ],
  // <30%
  overtimeHigh: [
    '深夜战神',
    '今晚又是你最晚走',
    '办公室守夜人',
    '夜深了，你还在拼',
  ],
};

// ============================================================
// 颜色常量
// ============================================================

/** 加班百分比颜色（红色） */
export const OVERTIME_PERCENTAGE_COLOR = '#FF4444';

/** 准时百分比颜色（绿色） */
export const ONTIME_PERCENTAGE_COLOR = '#00C805';
