# 错误处理和性能优化指南

本指南详细说明了应用中实现的错误处理和性能优化机制。

## 目录

1. [错误处理系统](#错误处理系统)
2. [性能优化系统](#性能优化系统)
3. [使用示例](#使用示例)
4. [最佳实践](#最佳实践)

## 错误处理系统

### 核心功能

#### 1. 错误类型识别

系统自动识别以下错误类型：
- **网络错误** (NETWORK): 网络连接失败
- **超时错误** (TIMEOUT): 请求超时
- **服务器错误** (SERVER): 5xx 服务器错误
- **客户端错误** (CLIENT): 4xx 客户端错误
- **认证错误** (AUTHENTICATION): 401 未授权
- **权限错误** (PERMISSION): 403 禁止访问
- **未找到错误** (NOT_FOUND): 404 资源不存在
- **验证错误** (VALIDATION): 数据验证失败
- **未知错误** (UNKNOWN): 其他错误

#### 2. 用户友好的错误消息

所有错误都会转换为用户友好的中文消息：

```typescript
import {getUserFriendlyMessage} from './utils/errorHandler';

const error = {code: 'NETWORK_ERROR'};
const message = getUserFriendlyMessage(error);
// 输出: "网络连接失败，请检查网络设置后重试"
```

#### 3. 自动重试机制

支持可配置的自动重试，包括指数退避：

```typescript
import {withRetry} from './utils/errorHandler';

const result = await withRetry(
  async () => {
    return await apiClient.getData();
  },
  {
    maxAttempts: 3,
    delay: 1000,
    backoff: true, // 使用指数退避
    onRetry: (attempt, error) => {
      console.log(`重试第 ${attempt} 次`);
    },
  }
);
```

#### 4. 电路断路器模式

防止对失败服务的持续请求：

```typescript
import {CircuitBreaker} from './utils/errorHandler';

const breaker = new CircuitBreaker(
  5,      // 失败阈值
  60000,  // 超时时间（毫秒）
  30000   // 重置超时（毫秒）
);

const result = await breaker.execute(async () => {
  return await apiClient.getData();
});
```

电路断路器状态：
- **CLOSED**: 正常运行
- **OPEN**: 服务不可用，快速失败
- **HALF_OPEN**: 尝试恢复，测试服务是否可用

#### 5. 错误恢复 Hook

提供完整的错误恢复功能：

```typescript
import {useErrorRecovery} from './hooks/useErrorRecovery';

function MyComponent() {
  const {executeWithRecovery, getCircuitBreakerState} = useErrorRecovery();

  const fetchData = async () => {
    const result = await executeWithRecovery(
      async () => {
        return await apiClient.getData();
      },
      {
        maxRetries: 3,
        retryDelay: 1000,
        useCircuitBreaker: true,
        onSuccess: () => {
          console.log('数据获取成功');
        },
        onFailure: (error) => {
          console.error('数据获取失败', error);
        },
      }
    );
  };

  return <View>...</View>;
}
```

### 错误边界

应用使用 ErrorBoundary 组件捕获 React 组件树中的错误：

```typescript
import {ErrorBoundary} from './components/ErrorBoundary';

<ErrorBoundary
  onError={(error, errorInfo) => {
    // 记录错误到监控服务
    console.error('Component error:', error, errorInfo);
  }}
>
  <YourComponent />
</ErrorBoundary>
```

### 网络状态监控

NetworkStatusBar 组件实时显示网络状态和错误信息：

- 自动检测网络连接状态
- 显示最后更新时间
- 提供重试按钮
- 友好的错误提示

## 性能优化系统

### 核心功能

#### 1. 内存缓存管理

```typescript
import {MemoryCache} from './utils/performance';

const cache = new MemoryCache<string, Data>(
  100,        // 最大缓存项数
  5 * 60 * 1000  // TTL（毫秒）
);

cache.set('key', data);
const data = cache.get('key');
```

#### 2. 防抖和节流

```typescript
import {debounce, throttle} from './utils/performance';

// 防抖：延迟执行，适用于搜索输入
const debouncedSearch = debounce((query) => {
  performSearch(query);
}, 300);

// 节流：限制执行频率，适用于滚动事件
const throttledScroll = throttle((event) => {
  handleScroll(event);
}, 100);
```

#### 3. 批量更新

```typescript
import {BatchUpdater} from './utils/performance';

const updater = new BatchUpdater<Update>(
  (updates) => {
    // 批量处理所有更新
    processUpdates(updates);
  },
  100 // 延迟时间（毫秒）
);

updater.add(update1);
updater.add(update2);
updater.add(update3);
// 100ms 后自动批量处理
```

#### 4. 性能监控

```typescript
import {PerformanceMonitor, measurePerformance} from './utils/performance';

const monitor = PerformanceMonitor.getInstance();

// 方式1：手动记录
const end = monitor.start('operation');
// ... 执行操作
end();

// 方式2：自动测量
const result = await measurePerformance('operation', async () => {
  return await performOperation();
});

// 获取性能统计
const average = monitor.getAverage('operation');
const allMetrics = monitor.getAllMetrics();
```

#### 5. 内存监控

```typescript
import {MemoryMonitor} from './utils/performance';

const monitor = MemoryMonitor.getInstance();

monitor.startMonitoring();

// 订阅内存警告
const unsubscribe = monitor.onMemoryWarning(() => {
  console.warn('内存警告！');
  // 执行清理操作
  cleanupResources();
});

// 获取清理建议
const suggestions = monitor.suggestCleanup();
```

#### 6. 资源清理管理

```typescript
import {ResourceCleanupManager} from './utils/performance';

const manager = new ResourceCleanupManager();

// 注册需要清理的资源
manager.register('timer', () => {
  clearInterval(timerId);
});

manager.register('subscription', () => {
  subscription.unsubscribe();
});

// 清理所有资源
manager.cleanupAll();
```

#### 7. 动画优化

```typescript
import {AnimationOptimizer} from './utils/performance';

const optimizer = AnimationOptimizer.getInstance();

// 设置最大并发动画数
optimizer.setMaxConcurrentAnimations(10);

// 注册动画
if (optimizer.registerAnimation('myAnimation')) {
  // 执行动画
  Animated.timing(value, {
    toValue: 1,
    duration: 300,
    useNativeDriver: true,
  }).start(() => {
    optimizer.unregisterAnimation('myAnimation');
  });
}
```

#### 8. 性能优化 Hook

```typescript
import {usePerformanceOptimization} from './hooks/usePerformanceOptimization';

function MyComponent() {
  const {
    registerCleanup,
    optimizeAnimation,
    measureOperation,
    getPerformanceStats,
  } = usePerformanceOptimization({
    enableMemoryMonitoring: true,
    enableAnimationOptimization: true,
    componentName: 'MyComponent',
  });

  useEffect(() => {
    const timer = setInterval(() => {
      // ...
    }, 1000);

    // 注册清理函数
    registerCleanup('timer', () => {
      clearInterval(timer);
    });

    return () => {
      // 自动清理
    };
  }, []);

  const handleAnimation = () => {
    optimizeAnimation('fadeIn', () => {
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
  };

  const fetchData = async () => {
    const data = await measureOperation('fetchData', async () => {
      return await apiClient.getData();
    });
  };

  return <View>...</View>;
}
```

## 使用示例

### 示例 1: 带错误处理的数据获取

```typescript
import {useErrorRecovery} from './hooks/useErrorRecovery';
import {usePerformanceOptimization} from './hooks/usePerformanceOptimization';

function DataFetchingComponent() {
  const {executeWithRecovery} = useErrorRecovery();
  const {measureOperation} = usePerformanceOptimization({
    componentName: 'DataFetchingComponent',
  });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);

    const result = await executeWithRecovery(
      async () => {
        return await measureOperation('fetchData', async () => {
          return await apiClient.getData();
        });
      },
      {
        maxRetries: 3,
        retryDelay: 1000,
        useCircuitBreaker: true,
        onSuccess: () => {
          console.log('数据获取成功');
        },
      }
    );

    if (result) {
      setData(result);
    }

    setLoading(false);
  };

  return (
    <View>
      {loading ? <LoadingSkeleton /> : <DataView data={data} />}
    </View>
  );
}
```

### 示例 2: 优化的搜索组件

```typescript
import {debounce} from './utils/performance';
import {useErrorHandler} from './hooks/useErrorHandler';

function SearchComponent() {
  const {handleError} = useErrorHandler();
  const [results, setResults] = useState([]);

  const performSearch = async (query: string) => {
    try {
      const results = await apiClient.search(query);
      setResults(results);
    } catch (error) {
      handleError(error);
    }
  };

  // 防抖搜索，减少 API 调用
  const debouncedSearch = useMemo(
    () => debounce(performSearch, 300),
    []
  );

  return (
    <TextInput
      onChangeText={debouncedSearch}
      placeholder="搜索..."
    />
  );
}
```

### 示例 3: 带性能监控的列表组件

```typescript
import {usePerformanceOptimization} from './hooks/usePerformanceOptimization';
import {LIST_OPTIMIZATION_CONFIG} from './utils/performance';

function OptimizedList({items}) {
  const {measureOperation, getPerformanceStats} = usePerformanceOptimization({
    componentName: 'OptimizedList',
  });

  const renderItem = useCallback(({item}) => {
    return <ListItem item={item} />;
  }, []);

  useEffect(() => {
    // 定期检查性能
    const timer = setInterval(() => {
      const stats = getPerformanceStats();
      console.log('List performance:', stats);
    }, 10000);

    return () => clearInterval(timer);
  }, []);

  return (
    <FlatList
      data={items}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      {...LIST_OPTIMIZATION_CONFIG}
    />
  );
}
```

## 最佳实践

### 错误处理

1. **始终使用 ErrorBoundary 包裹组件树**
   ```typescript
   <ErrorBoundary>
     <App />
   </ErrorBoundary>
   ```

2. **对网络请求使用自动重试**
   ```typescript
   const result = await withRetry(apiCall, {
     maxAttempts: 3,
     delay: 1000,
   });
   ```

3. **为关键服务使用电路断路器**
   ```typescript
   const breaker = new CircuitBreaker();
   const result = await breaker.execute(criticalApiCall);
   ```

4. **提供用户友好的错误消息**
   ```typescript
   const {handleError} = useErrorHandler();
   try {
     await operation();
   } catch (error) {
     handleError(error); // 自动显示友好消息
   }
   ```

### 性能优化

1. **使用防抖优化搜索和输入**
   ```typescript
   const debouncedFn = debounce(fn, 300);
   ```

2. **使用节流优化滚动和调整大小事件**
   ```typescript
   const throttledFn = throttle(fn, 100);
   ```

3. **缓存频繁访问的数据**
   ```typescript
   const cache = new MemoryCache(100, 5 * 60 * 1000);
   ```

4. **监控组件性能**
   ```typescript
   const {measureOperation} = usePerformanceOptimization({
     componentName: 'MyComponent',
   });
   ```

5. **限制并发动画数量**
   ```typescript
   const optimizer = AnimationOptimizer.getInstance();
   optimizer.setMaxConcurrentAnimations(10);
   ```

6. **注册和清理资源**
   ```typescript
   const {registerCleanup} = usePerformanceOptimization();
   registerCleanup('resource', cleanupFn);
   ```

7. **使用骨架屏改善加载体验**
   ```typescript
   {loading ? <TrendPageSkeleton /> : <TrendPage />}
   ```

### 内存管理

1. **订阅内存警告并执行清理**
   ```typescript
   const monitor = MemoryMonitor.getInstance();
   monitor.onMemoryWarning(() => {
     cache.clear();
     cleanupResources();
   });
   ```

2. **定期清理过期缓存**
   ```typescript
   setInterval(() => {
     cache.cleanup();
   }, 60000);
   ```

3. **在组件卸载时清理资源**
   ```typescript
   useEffect(() => {
     return () => {
       cleanupManager.cleanupAll();
     };
   }, []);
   ```

## 验证需求

本实现验证以下需求：

- ✅ 网络错误的友好提示和重试机制
- ✅ 数据加载状态和骨架屏
- ✅ 错误边界和崩溃恢复
- ✅ 优化动画性能和内存使用
- ✅ 所有错误处理相关需求

## 测试覆盖

所有核心功能都有完整的单元测试覆盖：

- ✅ 错误类型识别
- ✅ 用户友好消息生成
- ✅ 重试机制
- ✅ 电路断路器
- ✅ 防抖和节流
- ✅ 内存缓存
- ✅ 批量更新
- ✅ 性能监控
- ✅ 内存监控
- ✅ 资源清理
- ✅ 动画优化

运行测试：
```bash
npm test -- --testNamePattern="Error Handler|Performance"
```
