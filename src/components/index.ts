import {lazy} from 'react';

// 立即加载的核心组件
export {ErrorBoundary} from './ErrorBoundary';
export {
  Skeleton,
  TrendPageSkeleton,
  ListItemSkeleton,
  CardSkeleton,
} from './LoadingSkeleton';
export {NetworkStatusBar} from './NetworkStatusBar';
export {ToastContainer} from './Toast';
export {LazyLoadWrapper, PageLazyLoadWrapper} from './LazyLoadWrapper';

// 懒加载的大型组件（用于性能优化）
export const SearchableSelector = lazy(() =>
  import('./SearchableSelector').then(module => ({
    default: module.SearchableSelector,
  })),
);

// UserStatusSelector 直接导出，避免 lazy + Suspense 导致弹框打开时主页闪烁
export {UserStatusSelector} from './UserStatusSelector';

// HistoricalStatusIndicator 直接导出，避免 Suspense 导致子组件反复卸载/挂载
export {default as HistoricalStatusIndicator} from './HistoricalStatusIndicator';

// AnimatedNumber 是轻量组件，直接导出避免 lazy 导致动画丢失
export {AnimatedNumber} from './AnimatedNumber';

// VersusBar 包含 AnimatedNumber，直接导出保持动画状态
export {VersusBar} from './VersusBar';

// GridChart 直接导出
export {GridChart} from './GridChart';

// DataVisualization 包含 VersusBar + AnimatedNumber，直接导出避免 lazy 导致动画组件反复卸载/挂载
export {DataVisualization} from './DataVisualization';

// DimensionTabSwitcher 已被 react-native-tab-view 替代，集成在 DataVisualization 内部

// DonutChart 行业环形图
export {DonutChart} from './DonutChart';

// PositionVersusBarList 职位对抗条列表
export {PositionVersusBarList} from './PositionVersusBarList';

// PopulationPyramid 年龄对称条形图
export {PopulationPyramid} from './PopulationPyramid';

// DimensionLegend 统一维度图例
export {DimensionLegend} from './DimensionLegend';

export const TagRankingList = lazy(() =>
  import('./TagRankingList').then(module => ({
    default: module.TagRankingList,
  })),
);

export const CalendarView = lazy(() =>
  import('./CalendarView').then(module => ({
    default: module.CalendarView,
  })),
);
