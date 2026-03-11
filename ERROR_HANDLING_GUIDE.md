# Error Handling and UX Optimization Guide

This guide explains the error handling and user experience optimization features implemented in the Overtime Index App.

## Components

### 1. ErrorBoundary

A React error boundary component that catches JavaScript errors in the component tree and displays a fallback UI.

**Usage:**
```tsx
import {ErrorBoundary} from './src/components';

// Wrap your app or specific components
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>

// With custom fallback
<ErrorBoundary fallback={<CustomErrorUI />}>
  <YourComponent />
</ErrorBoundary>

// With error callback
<ErrorBoundary onError={(error, errorInfo) => {
  // Log to error tracking service
  logErrorToService(error, errorInfo);
}}>
  <YourComponent />
</ErrorBoundary>
```

### 2. Loading Skeletons

Skeleton screens provide visual feedback during data loading.

**Available Skeletons:**
- `Skeleton` - Basic skeleton component
- `TrendPageSkeleton` - Full page skeleton for TrendPage
- `ListItemSkeleton` - Skeleton for list items
- `CardSkeleton` - Skeleton for card layouts

**Usage:**
```tsx
import {TrendPageSkeleton, ListItemSkeleton} from './src/components';

function MyComponent() {
  const [loading, setLoading] = useState(true);

  if (loading) {
    return <TrendPageSkeleton />;
  }

  return <ActualContent />;
}
```

### 3. NetworkStatusBar

Displays network connection status at the top of the screen.

**Features:**
- Automatically shows when network is disconnected
- Displays last update time
- Slides in/out with smooth animation

**Usage:**
```tsx
import {NetworkStatusBar} from './src/components';

// Add to your app root (already added in App.tsx)
<NetworkStatusBar />
```

### 4. Toast Notifications

Displays temporary notification messages.

**Types:**
- `success` - Green toast for successful operations
- `error` - Red toast for errors
- `warning` - Yellow toast for warnings
- `info` - Blue toast for information

**Usage:**
```tsx
import {useAppDispatch} from './src/hooks/redux';
import {addNotification} from './src/store/slices/uiSlice';

function MyComponent() {
  const dispatch = useAppDispatch();

  const showNotification = () => {
    dispatch(addNotification({
      type: 'success',
      message: '操作成功！',
      duration: 3000, // Optional, defaults to 3000ms
    }));
  };

  return <Button onPress={showNotification} />;
}
```

## Hooks

### useErrorHandler

A custom hook for unified error handling with notifications.

**Usage:**
```tsx
import {useErrorHandler} from './src/hooks/useErrorHandler';

function MyComponent() {
  const {handleError, showSuccess, showWarning, showInfo} = useErrorHandler();

  const fetchData = async () => {
    try {
      const data = await apiClient.getData();
      showSuccess('数据加载成功');
    } catch (error) {
      handleError(error); // Automatically shows error notification
    }
  };

  return <Button onPress={fetchData} />;
}
```

## Utilities

### Error Handler

Provides standardized error handling and user-friendly error messages.

**Usage:**
```tsx
import {handleError, withRetry, ErrorType} from './src/utils/errorHandler';

// Handle error
try {
  await someOperation();
} catch (error) {
  const standardError = handleError(error);
  console.log(standardError.type); // ErrorType enum
  console.log(standardError.message); // User-friendly message
  console.log(standardError.retryable); // Boolean
}

// Retry wrapper
const result = await withRetry(
  async () => await apiClient.getData(),
  {
    maxAttempts: 3,
    delay: 1000,
    backoff: true, // Exponential backoff
    onRetry: (attempt, error) => {
      console.log(`Retry attempt ${attempt}`);
    },
  }
);
```

### Performance Utilities

Tools for optimizing performance and memory usage.

**Debounce:**
```tsx
import {debounce} from './src/utils/performance';

const handleSearch = debounce((query: string) => {
  // Search logic
}, 300);
```

**Throttle:**
```tsx
import {throttle} from './src/utils/performance';

const handleScroll = throttle(() => {
  // Scroll logic
}, 100);
```

**Memory Cache:**
```tsx
import {MemoryCache} from './src/utils/performance';

const cache = new MemoryCache<string, Data>(100, 5 * 60 * 1000);

// Set
cache.set('key', data);

// Get
const data = cache.get('key');

// Cleanup expired items
cache.cleanup();
```

**Performance Monitoring:**
```tsx
import {measurePerformance, PerformanceMonitor} from './src/utils/performance';

// Measure function performance
const result = await measurePerformance('fetchData', async () => {
  return await apiClient.getData();
});

// Get metrics
const monitor = PerformanceMonitor.getInstance();
const average = monitor.getAverage('fetchData');
console.log(`Average time: ${average}ms`);
```

**Batch Updater:**
```tsx
import {BatchUpdater} from './src/utils/performance';

const updater = new BatchUpdater<Update>(
  (updates) => {
    // Process all updates at once
    processUpdates(updates);
  },
  100 // Delay in ms
);

// Add updates
updater.add(update1);
updater.add(update2);
// Will batch and call callback after 100ms
```

## Best Practices

### 1. Error Handling

- Always wrap API calls in try-catch blocks
- Use `useErrorHandler` hook for consistent error handling
- Provide user-friendly error messages
- Log errors for debugging (in development) and monitoring (in production)

### 2. Loading States

- Show loading skeletons instead of spinners for better UX
- Use appropriate skeleton types for different content
- Keep loading states minimal and fast

### 3. Network Handling

- The `NetworkStatusBar` automatically handles network status
- The `realTimeDataService` includes automatic retry logic
- Use cached data when network is unavailable

### 4. Performance

- Use `debounce` for search inputs
- Use `throttle` for scroll events
- Implement memory caching for frequently accessed data
- Monitor performance in development with `PerformanceMonitor`

### 5. Notifications

- Keep messages concise and actionable
- Use appropriate notification types
- Set reasonable durations (3-4 seconds for most messages)
- Don't spam users with too many notifications

## Error Recovery Strategies

### Network Errors
- Automatic retry with exponential backoff (implemented in API client)
- Fallback to cached data
- User notification with retry option

### Server Errors
- Automatic retry (up to 3 attempts)
- User notification
- Error logging

### Client Errors
- Immediate user feedback
- No automatic retry
- Validation error details

### Validation Errors
- Inline error messages
- Field-specific feedback
- No automatic retry

## Testing

All error handling components and utilities are tested. Run tests with:

```bash
npm test
```

## Integration

The error handling system is already integrated into the app:

1. **App.tsx** - ErrorBoundary wraps the entire app
2. **App.tsx** - NetworkStatusBar and ToastContainer are added
3. **API Client** - Automatic retry and error handling
4. **Real-time Service** - Network monitoring and error recovery
5. **All Screens** - Use loading states and error handling

## Requirements Validation

This implementation satisfies the following requirements:

- ✅ 网络错误的友好提示和重试机制
- ✅ 添加数据加载状态和骨架屏
- ✅ 创建错误边界和崩溃恢复
- ✅ 优化动画性能和内存使用

All error handling features are production-ready and follow React Native best practices.
