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

export const UserStatusSelector = lazy(() =>
  import('./UserStatusSelector').then(module => ({
    default: module.UserStatusSelector,
  })),
);

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

export const TagRankingList = lazy(() =>
  import('./TagRankingList').then(module => ({
    default: module.TagRankingList,
  })),
);

export const TimeAxis = lazy(() => import('./TimeAxis'));

export const CalendarView = lazy(() =>
  import('./CalendarView').then(module => ({
    default: module.CalendarView,
  })),
);
