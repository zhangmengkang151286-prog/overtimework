import {Dimensions} from 'react-native';

// ========== 常量 ==========
const {width: SCREEN_WIDTH} = Dimensions.get('window');

/** 抽屉宽度：屏幕宽度的 85% */
export const DRAWER_WIDTH = SCREEN_WIDTH * 0.85;

/** 边缘触发区宽度（像素） */
export const EDGE_WIDTH = 35;

/** 关闭距离阈值：拖拽超过抽屉宽度的 35% 触发关闭 */
export const CLOSE_DISTANCE_THRESHOLD = 0.35;

/** 关闭速度阈值：向左速度超过 300px/s 触发关闭 */
export const CLOSE_VELOCITY_THRESHOLD = -300;

/** 打开距离阈值：拖拽超过抽屉宽度的 50% 触发打开 */
export const OPEN_DISTANCE_THRESHOLD = 0.5;

/** 打开速度阈值：向右速度超过 500px/s 触发打开 */
export const OPEN_VELOCITY_THRESHOLD = 500;

// ========== 类型 ==========
export interface DrawerState {
  translateX: number;
  isOpen: boolean;
}

// ========== 纯函数 ==========

/**
 * 判断是否应该关闭抽屉
 * 条件：向左速度超过阈值 或 拖拽距离超过 35% 宽度
 *
 * @param translateX 当前 translateX 值，范围 [-DRAWER_WIDTH, 0]
 * @param velocityX 手势速度（负值表示向左）
 * @param drawerWidth 抽屉宽度
 */
export function shouldCloseDrawer(
  translateX: number,
  velocityX: number,
  drawerWidth: number,
): boolean {
  return (
    velocityX < CLOSE_VELOCITY_THRESHOLD ||
    Math.abs(translateX) > drawerWidth * CLOSE_DISTANCE_THRESHOLD
  );
}

/**
 * 判断是否应该打开抽屉
 * 条件：向右速度超过阈值 或 拖拽距离超过 50% 宽度
 *
 * @param translationX 从关闭位置开始的位移量（正值表示向右拖拽）
 * @param velocityX 手势速度（正值表示向右）
 * @param drawerWidth 抽屉宽度
 */
export function shouldOpenDrawer(
  translationX: number,
  velocityX: number,
  drawerWidth: number,
): boolean {
  return (
    velocityX > OPEN_VELOCITY_THRESHOLD ||
    translationX > drawerWidth * OPEN_DISTANCE_THRESHOLD
  );
}

/**
 * 将 translateX 限制在有效范围 [-drawerWidth, 0] 内
 *
 * @param rawTranslateX 原始计算值
 * @param drawerWidth 抽屉宽度
 */
export function clampTranslateX(
  rawTranslateX: number,
  drawerWidth: number,
): number {
  return Math.max(-drawerWidth, Math.min(0, rawTranslateX));
}

/**
 * 计算遮罩层透明度，线性插值 [0, 0.5]
 * translateX = -drawerWidth 时透明度为 0
 * translateX = 0 时透明度为 0.5
 *
 * @param translateX 当前 translateX 值，范围 [-drawerWidth, 0]
 * @param drawerWidth 抽屉宽度
 */
export function computeBackdropOpacity(
  translateX: number,
  drawerWidth: number,
): number {
  if (drawerWidth === 0) {
    return 0;
  }
  const ratio = (translateX + drawerWidth) / drawerWidth;
  return Math.max(0, Math.min(0.5, 0.5 * ratio));
}

/**
 * 根据 isOpen 值计算目标 translateX
 *
 * @param isOpen 是否打开
 * @param drawerWidth 抽屉宽度
 */
export function getTargetTranslateX(
  isOpen: boolean,
  drawerWidth: number,
): number {
  return isOpen ? 0 : -drawerWidth;
}

/**
 * 将 DrawerState 序列化为 JSON 字符串
 */
export function serializeDrawerState(state: DrawerState): string {
  return JSON.stringify({
    translateX: state.translateX,
    isOpen: state.isOpen,
  });
}

/**
 * 将 JSON 字符串反序列化为 DrawerState
 * @throws 如果 JSON 无效或字段缺失
 */
export function deserializeDrawerState(json: string): DrawerState {
  const parsed = JSON.parse(json);
  if (
    typeof parsed.translateX !== 'number' ||
    typeof parsed.isOpen !== 'boolean'
  ) {
    throw new Error(
      'Invalid DrawerState JSON: translateX must be number, isOpen must be boolean',
    );
  }
  return {
    translateX: parsed.translateX,
    isOpen: parsed.isOpen,
  };
}
