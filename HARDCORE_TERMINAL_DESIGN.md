# 🖥️ 硬核终端风格设计方案

## 💀 设计定位：极客黑客风

适合想要**极致硬核、技术感爆棚**的数据应用

---

## 🎯 方案一：黑客终端风（最硬核）⭐⭐⭐

### 视觉特征
- **纯黑背景** + 绿色文字（经典黑客终端）
- **等宽字体**：所有文字都用 Monospace
- **ASCII 艺术**：用字符画装饰
- **扫描线效果**：模拟 CRT 显示器
- **闪烁光标**：命令行风格

### 配色方案
```
背景：#000000 (纯黑)
主文字：#00FF00 (矩阵绿)
次要文字：#00AA00 (深绿)
强调：#00FFFF (青色)
警告：#FFFF00 (黄色)
错误：#FF0000 (红色)

特效：
- 文字发光：text-shadow: 0 0 5px #00FF00
- 扫描线：repeating-linear-gradient
```

### 布局示例
```
┌─────────────────────────────────────┐
│ root@overtime:~$ status --today     │
├─────────────────────────────────────┤
│                                     │
│ [████████████████████████] 67%      │
│ WORKDAY_PROGRESS: 10h 23m remaining │
│                                     │
│ > PARTICIPANTS: 1234                │
│ > OVERTIME:     456  [████████]     │
│ > ON_TIME:      778  [████████████] │
│                                     │
│ TREND [7d]:                         │
│ ● ● ● ● ● ● ●                      │
│                                     │
│ TAG_DISTRIBUTION:                   │
│ [互联网] ████████████ 234           │
│ [金融]   ████████ 156               │
│ [教育]   ████ 89                    │
│                                     │
│ TIMELINE:                           │
│ 06:00 ─────●───────────── 05:59    │
│       ^NOW                          │
│                                     │
│ root@overtime:~$ _                  │
└─────────────────────────────────────┘
```

### 实现要点

#### 1. 终端字体
```typescript
const terminalFont = {
  fontFamily: Platform.select({
    ios: 'Courier New',
    android: 'monospace',
  }),
  fontSize: 14,
  color: '#00FF00',
  textShadowColor: '#00FF00',
  textShadowOffset: { width: 0, height: 0 },
  textShadowRadius: 5,
};
```

#### 2. ASCII 边框
```typescript
const ASCIIBox = ({ children, title }) => (
  <View style={styles.asciiBox}>
    <Text style={styles.asciiText}>┌{'─'.repeat(35)}┐</Text>
    <Text style={styles.asciiText}>│ {title.padEnd(33)} │</Text>
    <Text style={styles.asciiText}>├{'─'.repeat(35)}┤</Text>
    {children}
    <Text style={styles.asciiText}>└{'─'.repeat(35)}┘</Text>
  </View>
);
```

#### 3. 扫描线效果
```typescript
const ScanlineOverlay = () => (
  <View style={styles.scanlineContainer}>
    {Array.from({ length: 50 }).map((_, i) => (
      <View
        key={i}
        style={[
          styles.scanline,
          { top: i * 10 }
        ]}
      />
    ))}
  </View>
);

const styles = StyleSheet.create({
  scanline: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(0, 255, 0, 0.05)',
  },
});
```

#### 4. 闪烁光标
```typescript
const BlinkingCursor = () => {
  const [visible, setVisible] = useState(true);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(v => !v);
    }, 500);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <Text style={[styles.cursor, { opacity: visible ? 1 : 0 }]}>
      █
    </Text>
  );
};
```

#### 5. 打字机效果
```typescript
const TypewriterText = ({ text, speed = 50 }) => {
  const [displayText, setDisplayText] = useState('');
  
  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayText(text.substring(0, i + 1));
        i++;
      } else {
        clearInterval(timer);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text]);
  
  return <Text style={styles.terminal}>{displayText}</Text>;
};
```

---

## 🎯 方案二：赛博朋克风

### 视觉特征
- **霓虹色彩**：粉色、青色、紫色
- **故障效果**：Glitch 动画
- **网格背景**：透视网格
- **发光边框**：Neon 效果

### 配色方案
```
背景：#0D0221 (深紫黑)
主色：#FF006E (霓虹粉)
辅色：#00F5FF (霓虹青)
强调：#FFBE0B (霓虹黄)

特效：
- 霓虹发光：box-shadow: 0 0 20px #FF006E
- 故障效果：transform + animation
```

### 特色元素
```typescript
// 霓虹文字
const NeonText = styled(Text)`
  color: #FF006E;
  font-family: 'Orbitron';
  font-size: 32px;
  text-shadow: 
    0 0 10px #FF006E,
    0 0 20px #FF006E,
    0 0 30px #FF006E,
    0 0 40px #FF006E;
`;

// 故障效果
const GlitchText = ({ children }) => {
  const glitchAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glitchAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.delay(3000),
      ])
    ).start();
  }, []);
  
  return (
    <Animated.Text
      style={[
        styles.glitch,
        {
          transform: [{
            translateX: glitchAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 5],
            }),
          }],
        },
      ]}
    >
      {children}
    </Animated.Text>
  );
};
```

---

## 🎯 方案三：军事雷达风

### 视觉特征
- **军绿配色**：军事装备风格
- **雷达扫描**：旋转扫描动画
- **网格坐标**：坐标系背景
- **数字代码**：军事编号风格

### 配色方案
```
背景：#0A0E0F (军事黑)
主色：#39FF14 (雷达绿)
辅色：#FFD700 (警戒黄)
网格：#1A3A1A (深军绿)

字体：
- 标题：Stencil / Impact
- 数字：Courier New (等宽)
```

### 特色元素
```typescript
// 雷达扫描动画
const RadarScan = () => {
  const rotation = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);
  
  const rotate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  
  return (
    <Animated.View
      style={[
        styles.radarSweep,
        { transform: [{ rotate }] }
      ]}
    />
  );
};

// 网格背景
const GridBackground = () => (
  <Svg width="100%" height="100%" style={styles.grid}>
    {Array.from({ length: 20 }).map((_, i) => (
      <Line
        key={`h${i}`}
        x1="0"
        y1={i * 20}
        x2="100%"
        y2={i * 20}
        stroke="#1A3A1A"
        strokeWidth="1"
      />
    ))}
    {Array.from({ length: 20 }).map((_, i) => (
      <Line
        key={`v${i}`}
        x1={i * 20}
        y1="0"
        x2={i * 20}
        y2="100%"
        stroke="#1A3A1A"
        strokeWidth="1"
      />
    ))}
  </Svg>
);
```

---

## 🎯 方案四：Matrix 矩阵风

### 视觉特征
- **下落代码**：Matrix 数字雨
- **绿色矩阵**：经典 Matrix 配色
- **数字流动**：动态数字效果
- **深度感**：3D 透视

### 配色方案
```
背景：#000000 (纯黑)
主色：#00FF41 (Matrix 绿)
辅色：#008F11 (深绿)
高亮：#00FF41 (亮绿)
```

### 特色元素
```typescript
// Matrix 数字雨背景
const MatrixRain = () => {
  const columns = 20;
  const [drops, setDrops] = useState(
    Array.from({ length: columns }, () => Math.random() * 100)
  );
  
  useEffect(() => {
    const interval = setInterval(() => {
      setDrops(prev => prev.map((drop, i) => {
        if (drop > 100 && Math.random() > 0.95) {
          return 0;
        }
        return drop + 1;
      }));
    }, 50);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <View style={styles.matrixContainer}>
      {drops.map((drop, i) => (
        <Text
          key={i}
          style={[
            styles.matrixChar,
            {
              left: i * 20,
              top: drop * 10,
              opacity: 1 - (drop / 100),
            }
          ]}
        >
          {String.fromCharCode(0x30A0 + Math.random() * 96)}
        </Text>
      ))}
    </View>
  );
};
```

---

## 🎯 方案五：DOS 复古风

### 视觉特征
- **蓝屏背景**：经典 DOS 蓝
- **白色文字**：高对比度
- **方框字符**：ASCII 边框
- **命令行界面**：纯文本风格

### 配色方案
```
背景：#0000AA (DOS 蓝)
文字：#FFFFFF (纯白)
高亮：#FFFF55 (亮黄)
边框：#AAAAAA (灰色)

字体：
- Perfect DOS VGA 437
- Courier New
```

### 布局示例
```
╔═══════════════════════════════════════╗
║  OVERTIME INDEX SYSTEM v1.0.0         ║
╠═══════════════════════════════════════╣
║                                       ║
║  PARTICIPANTS............ 1234        ║
║  OVERTIME................ 456  [37%]  ║
║  ON_TIME................. 778  [63%]  ║
║                                       ║
║  WORKDAY PROGRESS: [████████░░] 67%   ║
║  TIME REMAINING: 10:23:45             ║
║                                       ║
║  PRESS ANY KEY TO CONTINUE...         ║
║                                       ║
╚═══════════════════════════════════════╝
```

---

## 🚀 推荐实施方案

### 最硬核：黑客终端风（方案一）

#### 为什么最硬核？
1. **极客文化**：黑客、程序员的经典审美
2. **高辨识度**：一眼就知道这是技术应用
3. **实用性强**：等宽字体、高对比度，数据清晰
4. **装逼指数**：MAX 💯

#### 快速实现步骤

1. **更新全局字体**
```typescript
// src/theme/typography.ts
export const typography = {
  terminal: {
    fontFamily: 'Courier New',
    fontSize: 14,
    color: '#00FF00',
    textShadowColor: '#00FF00',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
  },
  terminalBold: {
    fontFamily: 'Courier New',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00FF00',
  },
};
```

2. **添加终端背景**
```typescript
// 纯黑背景 + 扫描线
<View style={styles.terminalScreen}>
  <ScanlineOverlay />
  {children}
</View>
```

3. **ASCII 边框装饰**
```typescript
// 用 ASCII 字符装饰各个模块
┌─────────────────┐
│ 参与人数: 1234  │
└─────────────────┘
```

4. **添加命令行提示符**
```typescript
<Text style={styles.prompt}>
  root@overtime:~$ status --today
</Text>
```

5. **数字发光效果**
```typescript
const GlowNumber = ({ value }) => (
  <Text style={styles.glowNumber}>
    {value.toLocaleString()}
  </Text>
);

const styles = StyleSheet.create({
  glowNumber: {
    fontFamily: 'Courier New',
    fontSize: 48,
    color: '#00FF00',
    textShadowColor: '#00FF00',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
});
```

---

## 💡 硬核元素库

### 1. 进度条（终端风格）
```
[████████████████░░░░] 67%
```

### 2. 状态指示器
```
● ONLINE  ○ OFFLINE  ◉ SYNCING
```

### 3. 数据表格
```
TAG        | COUNT | PERCENT
-----------|-------|--------
互联网     | 234   | 45%
金融       | 156   | 30%
教育       | 89    | 17%
```

### 4. 加载动画
```
LOADING [⣾⣽⣻⢿⡿⣟⣯⣷]
```

### 5. 警告信息
```
[!] WARNING: High overtime rate detected
[✓] SUCCESS: Status submitted
[✗] ERROR: Network connection failed
```

---

## 🎨 配色对比

| 风格 | 背景 | 主色 | 硬核指数 | 适用场景 |
|------|------|------|----------|----------|
| 黑客终端 | #000000 | #00FF00 | ⭐⭐⭐⭐⭐ | 极客、程序员 |
| 赛博朋克 | #0D0221 | #FF006E | ⭐⭐⭐⭐ | 年轻、潮流 |
| 军事雷达 | #0A0E0F | #39FF14 | ⭐⭐⭐⭐ | 严肃、专业 |
| Matrix | #000000 | #00FF41 | ⭐⭐⭐⭐⭐ | 科幻、酷炫 |
| DOS 复古 | #0000AA | #FFFFFF | ⭐⭐⭐ | 怀旧、复古 |

---

## 🔥 终极硬核组合

如果你想要**最最最硬核**的效果，可以组合多种元素：

1. **黑客终端** 作为基础风格
2. 添加 **Matrix 数字雨** 作为背景动画
3. 使用 **军事雷达** 的扫描效果
4. 加入 **赛博朋克** 的霓虹发光
5. 配合 **打字机效果** 和 **闪烁光标**

这样你就有了一个**终极硬核数据终端**！

---

**需要我帮你实现黑客终端风格吗？我可以直接修改代码！** 🚀
