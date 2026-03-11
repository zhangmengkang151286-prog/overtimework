# React Hooks 错误最终修复

## 修复时间
2026-02-23

## 问题描述

应用在打开分享海报页面时报错：
```
ERROR [Error: Rendered fewer hooks than expected. This may be caused by an accidental early return statement.]
```

## 根本原因

**违反了 React Hooks 规则**：Hooks 必须在组件的顶层调用，不能在条件语句、循环或嵌套函数之后调用。

在 `SharePosterScreen.tsx` 中存在两个问题：

### 问题 1：Hooks 在条件渲染之后调用
```typescript
// ❌ 错误：在 if (error) return 之后调用 useMemo
if (error) {
  return <ErrorView />;
}

// 这些 Hooks 永远不会被执行到
const defaultTrendData = useMemo(() => {...}, []);
```

### 问题 2：Hooks 调用顺序不一致
```typescript
// ❌ 错误：posterTypes 在定义之前被 useCallback 使用
const handleSave = useCallback(() => {
  const currentType = posterTypes[currentIndex]; // posterTypes 还未定义
}, [posterTypes]);

const posterTypes = useMemo(() => [...], []); // 定义在后面
```

## 修复方案

### 修复 1：将所有 Hooks 移到条件渲染之前

```typescript
export const SharePosterScreen: React.FC = () => {
  // 1. 所有 useState
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  // ...

  // 2. 所有 useRef
  const posterRefs = useRef<Array<View | null>>([null, null, null, null]);

  // 3. 所有函数定义
  const loadPosterData = async () => { /* ... */ };
  const loadTrendData = async () => { /* ... */ };
  // ...

  // 4. 所有 useEffect
  useEffect(() => {
    loadPosterData();
  }, []);

  // 5. 所有 useMemo（按依赖顺序）
  const posterTypes = useMemo(() => [...], []);
  const defaultTrendData = useMemo(() => ({...}), []);
  const defaultCalendarData = useMemo(() => ({...}), []);
  // ...

  // 6. 所有 useCallback（依赖 useMemo 的结果）
  const handleSave = useCallback(() => { /* ... */ }, [currentIndex, posterTypes]);
  const handleShare = useCallback(() => { /* ... */ }, [currentIndex, posterTypes]);
  const handleCalendarYearMonthChange = useCallback(() => { /* ... */ }, [currentUser?.id]);
  // ...

  // 7. 最后的 useMemo（依赖前面的所有 Hooks）
  const posters = useMemo(() => {
    if (!posterData) return [];
    return [...];
  }, [posterData, trendData, /* ... */]);

  // 8. 条件渲染（所有 Hooks 之后）
  if (loading && !posterData) {
    return <LoadingView />;
  }

  if (error) {
    return <ErrorView />;
  }

  // 9. 正常渲染
  return <MainView />;
};
```

### 修复 2：确保 Hooks 调用顺序正确

```typescript
// ✅ 正确：posterTypes 在 useCallback 之前定义
const posterTypes = useMemo(() => [
  PosterType.TREND,
  PosterType.CALENDAR,
  PosterType.OVERTIME_TREND,
  PosterType.TAG_PROPORTION,
], []);

// ✅ 正确：现在可以安全使用 posterTypes
const handleSave = useCallback(async () => {
  const currentType = posterTypes[currentIndex];
  // ...
}, [currentIndex, posterTypes]);
```

## React Hooks 规则总结

### 规则 1：只在顶层调用 Hooks
```typescript
// ❌ 错误
if (condition) {
  const [state, setState] = useState(0); // 不能在条件语句中
}

// ✅ 正确
const [state, setState] = useState(0);
if (condition) {
  setState(1);
}
```

### 规则 2：只在 React 函数中调用 Hooks
```typescript
// ❌ 错误
function regularFunction() {
  const [state, setState] = useState(0); // 不能在普通函数中
}

// ✅ 正确
const MyComponent: React.FC = () => {
  const [state, setState] = useState(0); // 在组件中
};
```

### 规则 3：Hooks 必须按固定顺序调用
```typescript
// ❌ 错误：条件性地调用 Hook
const MyComponent: React.FC = () => {
  const [state1, setState1] = useState(0);
  
  if (condition) {
    const [state2, setState2] = useState(0); // 顺序不固定
  }
  
  return <View />;
};

// ✅ 正确：始终按相同顺序调用
const MyComponent: React.FC = () => {
  const [state1, setState1] = useState(0);
  const [state2, setState2] = useState(0);
  
  if (condition) {
    setState2(1); // 使用 Hook 的结果
  }
  
  return <View />;
};
```

### 规则 4：早期返回必须在所有 Hooks 之后
```typescript
// ❌ 错误
const MyComponent: React.FC = () => {
  const [state1, setState1] = useState(0);
  
  if (error) {
    return <ErrorView />; // 早期返回
  }
  
  const [state2, setState2] = useState(0); // 永远不会执行
  
  return <View />;
};

// ✅ 正确
const MyComponent: React.FC = () => {
  const [state1, setState1] = useState(0);
  const [state2, setState2] = useState(0); // 所有 Hooks 在前
  
  if (error) {
    return <ErrorView />; // 早期返回在后
  }
  
  return <View />;
};
```

## 修复后的代码结构

```typescript
export const SharePosterScreen: React.FC = () => {
  // ============================================
  // 1. 基础 Hooks（useState, useRef, 自定义 Hooks）
  // ============================================
  const navigation = useNavigation();
  const {isDark} = useThemeToggle();
  const currentUser = useSelector((state: any) => state?.user?.currentUser);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [posterData, setPosterData] = useState<PosterData | null>(null);
  const [trendData, setTrendData] = useState<any>(null);
  const [calendarData, setCalendarData] = useState<any>(null);
  const [overtimeTrendData, setOvertimeTrendData] = useState<any>(null);
  const [tagProportionData, setTagProportionData] = useState<any>(null);
  const posterRefs = useRef<Array<View | null>>([null, null, null, null]);

  // ============================================
  // 2. 计算值和常量
  // ============================================
  const themeColors = isDark ? colors.dark : colors.light;

  // ============================================
  // 3. 异步函数定义
  // ============================================
  const loadPosterData = async () => { /* ... */ };
  const loadTrendData = async () => { /* ... */ };
  const loadCalendarData = async (year: number, month: number) => { /* ... */ };
  const loadOvertimeTrendData = async (dimension: 'day' | 'week' | 'month') => { /* ... */ };
  const loadTagProportionData = async (year: number, month: number) => { /* ... */ };

  // ============================================
  // 4. useEffect
  // ============================================
  useEffect(() => {
    loadPosterData();
  }, []);

  // ============================================
  // 5. 事件处理函数
  // ============================================
  const handleIndexChange = (index: number) => {
    setCurrentIndex(index);
  };

  const handleBack = () => {
    navigation.goBack();
  };

  // ============================================
  // 6. useMemo（按依赖顺序）
  // ============================================
  const posterTypes = useMemo(() => [...], []);
  const defaultTrendData = useMemo(() => ({...}), []);
  const defaultCalendarData = useMemo(() => ({...}), []);
  const defaultOvertimeTrendData = useMemo(() => ({...}), []);
  const defaultTagProportionData = useMemo(() => ({...}), []);

  // ============================================
  // 7. useCallback（依赖 useMemo 的结果）
  // ============================================
  const handleSave = useCallback(async () => { /* ... */ }, [currentIndex, posterTypes]);
  const handleShare = useCallback(async () => { /* ... */ }, [currentIndex, posterTypes]);
  const handleCalendarYearMonthChange = useCallback(async (year, month) => { /* ... */ }, [currentUser?.id]);
  const handleOvertimeDimensionChange = useCallback(async (dimension) => { /* ... */ }, [currentUser?.id]);
  const handleTagYearMonthChange = useCallback(async (year, month) => { /* ... */ }, [currentUser?.id]);

  // ============================================
  // 8. 最后的 useMemo（依赖所有前面的 Hooks）
  // ============================================
  const posters = useMemo(() => {
    if (!posterData) return [];
    return [...];
  }, [posterData, trendData, /* ... */]);

  // ============================================
  // 9. 条件渲染（所有 Hooks 之后）
  // ============================================
  if (loading && !posterData) {
    return <LoadingView />;
  }

  if (error) {
    return <ErrorView />;
  }

  // ============================================
  // 10. 正常渲染
  // ============================================
  return <MainView />;
};
```

## 验证步骤

1. ✅ 代码已修复
2. ✅ TypeScript 编译通过
3. ✅ ESLint 检查通过
4. ⏳ 等待运行时测试

## 测试清单

- [ ] 清除缓存并重启应用
- [ ] 打开分享海报页面
- [ ] 验证不再出现 Hooks 错误
- [ ] 验证海报正常显示
- [ ] 验证切换海报功能
- [ ] 验证保存和分享功能

## 相关文件

- ✅ `OvertimeIndexApp/src/screens/SharePosterScreen.tsx` - 已修复
- ✅ `OvertimeIndexApp/src/services/supabaseService.ts` - 已修复（数据库表问题）

## 相关文档

- 📄 `OvertimeIndexApp/USER_PROFILES_FIX_COMPLETE.md` - 数据库表修复
- 📄 `OvertimeIndexApp/HOOKS_ERROR_FIX_FINAL.md` - 本文档

## React Hooks 最佳实践

1. **始终在组件顶层调用 Hooks**
2. **不要在循环、条件或嵌套函数中调用 Hooks**
3. **使用 ESLint 插件 `eslint-plugin-react-hooks` 检查 Hooks 规则**
4. **按照固定顺序组织 Hooks**：
   - useState / useRef
   - useEffect
   - useMemo
   - useCallback
5. **条件渲染放在所有 Hooks 之后**
6. **使用 TypeScript 确保类型安全**

## 完成状态

- ✅ Hooks 顺序修复完成
- ✅ 条件渲染位置修复完成
- ✅ 代码编译通过
- ⏳ 等待运行时验证

---

**修复完成时间**: 2026-02-23  
**修复人员**: Kiro AI Assistant  
**状态**: 代码修复完成，等待测试验证
