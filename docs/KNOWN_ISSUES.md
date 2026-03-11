# 已知问题和修复建议

## 概述

本文档记录了项目中当前存在的已知问题和建议的修复方案。

---

## TypeScript 类型错误

### 1. Tamagui `space` 属性问题

**问题描述**:
Tamagui 组件的 `space` 属性在 TypeScript 中报错。

**影响文件**:
- `src/screens/PasswordRecoveryScreen.tsx`
- `src/screens/SetPasswordScreen.tsx`
- `test-tamagui-app.tsx`

**错误示例**:
```typescript
<YStack space="$4">  // ❌ TypeScript 报错
```

**修复方案**:
使用 `gap` 属性替代 `space`:

```typescript
<YStack gap="$4">  // ✅ 正确
```

**批量修复命令**:
```bash
# 在项目根目录执行
find OvertimeIndexApp/src -name "*.tsx" -exec sed -i 's/space="/gap="/g' {} \;
```

---

### 2. AppInput 缺少属性

**问题描述**:
`AppInput` 组件缺少 `editable` 和 `rightElement` 属性。

**影响文件**:
- `src/screens/PasswordRecoveryScreen.tsx`
- `src/screens/SetPasswordScreen.tsx`

**修复方案**:
在 `src/components/tamagui/Input.tsx` 中添加这些属性：

```typescript
export interface AppInputProps extends Omit<InputProps, 'size'> {
  label?: string
  error?: boolean
  errorMessage?: string
  editable?: boolean  // 添加
  rightElement?: React.ReactNode  // 添加
}

export const AppInput = forwardRef<TamaguiElement, AppInputProps>(
  ({ label, error, errorMessage, editable = true, rightElement, ...props }, ref) => {
    return (
      <YStack gap="$2">
        {label && (
          <Label htmlFor={props.id} fontSize="$3" fontWeight="500">
            {label}
          </Label>
        )}
        <XStack alignItems="center" position="relative">
          <Input
            ref={ref}
            flex={1}
            borderColor={error ? '$red8' : '$borderColor'}
            focusStyle={{
              borderColor: error ? '$red10' : '$primary',
            }}
            editable={editable}
            {...props}
          />
          {rightElement && (
            <View position="absolute" right="$3">
              {rightElement}
            </View>
          )}
        </XStack>
        {error && errorMessage && (
          <Text fontSize="$2" color="$red10">
            {errorMessage}
          </Text>
        )}
      </YStack>
    )
  }
)
```

---

### 3. User 类型不匹配

**问题描述**:
`enhanced-auth` 模块的 `User` 类型缺少 `avatar` 字段。

**影响文件**:
- `src/screens/CompleteProfileScreen.tsx`
- `src/screens/LoginScreen.tsx`
- `src/screens/PhoneRegisterScreen.tsx`

**修复方案**:
在 `src/types/enhanced-auth.ts` 中添加 `avatar` 字段：

```typescript
export interface User {
  id: string
  phoneNumber: string
  username: string
  avatar: string  // 添加此字段
  province?: string
  city?: string
  industry?: string
  company?: string
  position?: string
  workStartTime?: string
  workEndTime?: string
  wechatId?: string
  isProfileComplete: boolean
  createdAt: Date
  updatedAt: Date
}
```

---

### 4. Supabase 类型问题

**问题描述**:
Supabase 查询返回 `never` 类型，导致无法访问属性。

**影响文件**:
- `src/services/enhanced-auth/AuthService.ts`
- `src/services/enhanced-auth/ProfileService.ts`
- `src/services/enhanced-auth/SMSCodeService.ts`
- `src/services/enhanced-auth/WeChatAuthService.ts`

**原因**:
Supabase 客户端没有正确的类型定义。

**修复方案**:
1. 生成 Supabase 类型定义：

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/supabase.ts
```

2. 在 `src/services/supabase.ts` 中使用类型：

```typescript
import { Database } from '../types/supabase'

export const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
)
```

---

### 5. DailyStatus 缺少 status 字段

**问题描述**:
`DailyStatus` 类型缺少 `status` 字段。

**影响文件**:
- `src/services/supabaseHistoricalService.ts`
- `src/services/supabaseRealtimeService.ts`

**修复方案**:
在创建 `DailyStatus` 对象时添加 `status` 字段：

```typescript
const stats: DailyStatus = {
  date: new Date(),
  isOvertimeDominant: false,
  participantCount: 0,
  overtimeCount: 0,
  onTimeCount: 0,
  status: 'pending',  // 添加此字段
}
```

---

## 建议的修复优先级

### 高优先级（影响功能）

1. ✅ Tamagui `space` → `gap` 属性修复
2. ✅ AppInput 添加缺失属性
3. ✅ User 类型添加 `avatar` 字段
4. ✅ DailyStatus 添加 `status` 字段

### 中优先级（影响类型安全）

5. ⚠️ Supabase 类型定义生成
6. ⚠️ 测试文件类型错误修复

### 低优先级（不影响运行）

7. ℹ️ 其他 TypeScript 警告

---

## 修复步骤

### 步骤 1: 修复 Tamagui space 属性

```bash
cd OvertimeIndexApp
find src -name "*.tsx" -exec sed -i 's/space="/gap="/g' {} \;
```

### 步骤 2: 更新 AppInput 组件

编辑 `src/components/tamagui/Input.tsx`，添加 `editable` 和 `rightElement` 属性支持。

### 步骤 3: 更新 User 类型

编辑 `src/types/enhanced-auth.ts`，添加 `avatar: string` 字段。

### 步骤 4: 修复 DailyStatus

在所有创建 `DailyStatus` 对象的地方添加 `status` 字段。

### 步骤 5: 生成 Supabase 类型

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/supabase.ts
```

### 步骤 6: 运行测试

```bash
npm test
npx tsc --noEmit
```

---

## 注意事项

1. **不要一次性修复所有问题**: 逐步修复，每次修复后运行测试
2. **备份代码**: 在修复前创建 Git 分支
3. **测试功能**: 修复后测试相关功能是否正常
4. **更新文档**: 修复后更新相关文档

---

## 相关文档

- [Tamagui 使用指南](./TAMAGUI_GUIDE.md)
- [Tamagui 迁移指南](./TAMAGUI_MIGRATION_GUIDE.md)
- [TypeScript 配置](../tsconfig.json)

---

**最后更新**: 2026-02-13  
**版本**: v1.1

---

## 更新日志

### v1.1 (2026-02-13)
- 完成任务 15 最终验证
- 确认所有已知问题不阻塞发布
- 添加修复优先级说明
- 更新修复建议

### v1.0 (2026-02-12)
- 初始版本
- 记录主要已知问题
