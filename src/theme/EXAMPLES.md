# 主题系统使用示例

## 基础用法

### 1. 使用主题颜色

```typescript
import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useTheme} from '../hooks/useTheme';

function MyComponent() {
  const theme = useTheme();
  
  return (
    <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <Text style={[styles.title, {color: theme.colors.text}]}>
        标题文本
      </Text>
      <Text style={[styles.subtitle, {color: theme.colors.textSecondary}]}>
        副标题文本
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
  },
});
```

### 2. 使用排版样式

```typescript
import React from 'react';
import {View, Text} from 'react-native';
import {useTheme} from '../hooks/useTheme';

function TypographyExample() {
  const theme = useTheme();
  
  return (
    <View>
      <Text style={[theme.typography.styles.h1, {color: theme.colors.text}]}>
        这是 H1 标题
      </Text>
      <Text style={[theme.typography.styles.h2, {color: theme.colors.text}]}>
        这是 H2 标题
      </Text>
      <Text style={[theme.typography.styles.body, {color: theme.colors.text}]}>
        这是正文内容
      </Text>
      <Text style={[theme.typography.styles.caption, {color: theme.colors.textSecondary}]}>
        这是说明文字
      </Text>
    </View>
  );
}
```

### 3. 使用间距系统

```typescript
import React from 'react';
import {View, StyleSheet} from 'react-native';
import {useTheme} from '../hooks/useTheme';

function SpacingExample() {
  const theme = useTheme();
  
  return (
    <View style={[
      styles.container,
      {
        padding: theme.spacing.base,
        gap: theme.spacing.md,
      }
    ]}>
      <View style={{marginBottom: theme.spacing.sm}}>
        {/* 内容 */}
      </View>
      <View style={{marginBottom: theme.spacing.lg}}>
        {/* 内容 */}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
```

### 4. 使用响应式布局

```typescript
import React from 'react';
import {View, StyleSheet} from 'react-native';
import {responsive} from '../theme';

function ResponsiveExample() {
  return (
    <View style={styles.container}>
      {/* 内容会根据屏幕尺寸自动调整 */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // 根据屏幕宽度缩放
    padding: responsive.scale(16),
    
    // 根据屏幕尺寸选择不同的值
    width: responsive.select({
      xs: '100%',
      sm: '90%',
      md: '80%',
      lg: '70%',
      default: '100%',
    }),
    
    // 适度缩放
    fontSize: responsive.moderateScale(16),
  },
});
```

### 5. 使用阴影效果

```typescript
import React from 'react';
import {View, StyleSheet} from 'react-native';
import {useTheme} from '../hooks/useTheme';

function ShadowExample() {
  const theme = useTheme();
  
  return (
    <View style={[
      styles.card,
      theme.layout.shadow.md,
      {backgroundColor: theme.colors.surface}
    ]}>
      {/* 卡片内容 */}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
  },
});
```

### 6. 使用动画配置

```typescript
import React, {useEffect} from 'react';
import {View} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import {useTheme} from '../hooks/useTheme';

function AnimationExample() {
  const theme = useTheme();
  const opacity = useSharedValue(0);
  
  useEffect(() => {
    opacity.value = withTiming(1, {
      duration: theme.animations.duration.normal,
      easing: theme.animations.easing.easeOut,
    });
  }, []);
  
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));
  
  return (
    <Animated.View style={animatedStyle}>
      {/* 内容 */}
    </Animated.View>
  );
}
```

## 高级用法

### 1. 创建主题化的样式函数

```typescript
import {StyleSheet} from 'react-native';
import {Theme, createThemedStyles} from '../theme';

const createStyles = createThemedStyles((theme: Theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.base,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.layout.borderRadius.md,
    padding: theme.spacing.md,
    ...theme.layout.shadow.md,
  },
  title: {
    ...theme.typography.styles.h2,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  text: {
    ...theme.typography.styles.body,
    color: theme.colors.textSecondary,
  },
}));

function ThemedComponent() {
  const theme = useTheme();
  const styles = createStyles(theme);
  
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>标题</Text>
        <Text style={styles.text}>内容</Text>
      </View>
    </View>
  );
}
```

### 2. 使用主题工具函数

```typescript
import React from 'react';
import {View, StyleSheet} from 'react-native';
import {useTheme} from '../hooks/useTheme';
import {addOpacity, createBorder, createBorderRadius} from '../theme';

function UtilsExample() {
  const theme = useTheme();
  
  return (
    <View style={[
      styles.container,
      {
        backgroundColor: addOpacity(theme.colors.primary, 0.1),
        ...createBorder(theme, 'thin', theme.colors.primary),
        ...createBorderRadius(theme, 'md'),
      }
    ]}>
      {/* 内容 */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
});
```

### 3. 条件样式

```typescript
import React from 'react';
import {View, StyleSheet} from 'react-native';
import {useTheme} from '../hooks/useTheme';
import {themeValue} from '../theme';

function ConditionalStyleExample() {
  const theme = useTheme();
  
  const borderColor = themeValue(
    theme,
    theme.colors.border,      // 浅色模式
    theme.colors.borderLight  // 深色模式
  );
  
  return (
    <View style={[styles.container, {borderColor}]}>
      {/* 内容 */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    padding: 16,
  },
});
```

### 4. 状态颜色使用

```typescript
import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useTheme} from '../hooks/useTheme';

function StatusExample() {
  const theme = useTheme();
  
  return (
    <View>
      {/* 加班状态 */}
      <View style={[styles.badge, {backgroundColor: theme.colors.overtime}]}>
        <Text style={styles.badgeText}>加班</Text>
      </View>
      
      {/* 准时下班状态 */}
      <View style={[styles.badge, {backgroundColor: theme.colors.ontime}]}>
        <Text style={styles.badgeText}>准时下班</Text>
      </View>
      
      {/* 待定状态 */}
      <View style={[styles.badge, {backgroundColor: theme.colors.pending}]}>
        <Text style={styles.badgeText}>待定</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 8,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
```

### 5. 按钮样式

```typescript
import React from 'react';
import {TouchableOpacity, Text, StyleSheet} from 'react-native';
import {useTheme} from '../hooks/useTheme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
}

function ThemedButton({title, onPress, variant = 'primary'}: ButtonProps) {
  const theme = useTheme();
  
  const backgroundColor = variant === 'primary' 
    ? theme.colors.buttonPrimary 
    : theme.colors.buttonSecondary;
    
  const textColor = variant === 'primary'
    ? theme.colors.buttonPrimaryText
    : theme.colors.buttonSecondaryText;
  
  return (
    <TouchableOpacity
      style={[
        styles.button,
        {backgroundColor},
        theme.layout.shadow.sm,
      ]}
      onPress={onPress}>
      <Text style={[
        theme.typography.styles.button,
        {color: textColor}
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
```

## 完整示例：卡片组件

```typescript
import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {useTheme} from '../hooks/useTheme';

interface CardProps {
  title: string;
  description: string;
  onPress?: () => void;
}

function Card({title, description, onPress}: CardProps) {
  const theme = useTheme();
  
  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
        theme.layout.shadow.md,
      ]}
      onPress={onPress}
      disabled={!onPress}>
      <Text style={[
        theme.typography.styles.h4,
        {color: theme.colors.text},
        styles.title,
      ]}>
        {title}
      </Text>
      <Text style={[
        theme.typography.styles.body,
        {color: theme.colors.textSecondary},
      ]}>
        {description}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  title: {
    marginBottom: 8,
  },
});

export default Card;
```

这些示例展示了如何在实际应用中使用主题系统，确保UI的一致性和可维护性。
