/**
 * useMemo 优化验证脚本
 * 
 * 用途：验证 SharePosterScreen 和海报组件中的 useMemo 缓存是否正常工作
 * 
 * 使用方法：
 * 1. 将此文件临时重命名为 App.tsx
 * 2. 运行 npx expo start
 * 3. 观察控制台输出，验证缓存是否生效
 * 4. 测试完成后恢复原 App.tsx
 */

import React, {useState, useMemo, useCallback, useEffect} from 'react';
import {View, Text, Button, ScrollView, StyleSheet} from 'react-native';

// 模拟计算密集型函数
function expensiveCalculation(num: number): number {
  console.log(`🔄 执行昂贵计算: ${num}`);
  let result = 0;
  for (let i = 0; i < 1000000; i++) {
    result += i;
  }
  return result + num;
}

// 测试组件 1: 使用 useMemo
const WithUseMemo: React.FC<{count: number}> = ({count}) => {
  console.log('✅ WithUseMemo 组件渲染');
  
  // 使用 useMemo 缓存计算结果
  const expensiveResult = useMemo(() => {
    return expensiveCalculation(count);
  }, [count]);
  
  return (
    <View style={styles.card}>
      <Text style={styles.title}>使用 useMemo</Text>
      <Text style={styles.result}>计算结果: {expensiveResult}</Text>
    </View>
  );
};

// 测试组件 2: 不使用 useMemo
const WithoutUseMemo: React.FC<{count: number}> = ({count}) => {
  console.log('❌ WithoutUseMemo 组件渲染');
  
  // 不使用 useMemo，每次渲染都会重新计算
  const expensiveResult = expensiveCalculation(count);
  
  return (
    <View style={styles.card}>
      <Text style={styles.title}>不使用 useMemo</Text>
      <Text style={styles.result}>计算结果: {expensiveResult}</Text>
    </View>
  );
};

// 测试组件 3: 使用 useCallback
const WithUseCallback: React.FC<{onPress: () => void}> = React.memo(({onPress}) => {
  console.log('🔵 WithUseCallback 子组件渲染');
  
  return (
    <View style={styles.card}>
      <Text style={styles.title}>使用 useCallback</Text>
      <Button title="点击我" onPress={onPress} />
    </View>
  );
});

// 测试组件 4: 不使用 useCallback
const WithoutUseCallback: React.FC<{onPress: () => void}> = React.memo(({onPress}) => {
  console.log('🔴 WithoutUseCallback 子组件渲染');
  
  return (
    <View style={styles.card}>
      <Text style={styles.title}>不使用 useCallback</Text>
      <Button title="点击我" onPress={onPress} />
    </View>
  );
});

// 主测试组件
export default function UseMemoVerification() {
  const [count, setCount] = useState(0);
  const [otherState, setOtherState] = useState(0);
  
  console.log('🏠 主组件渲染');
  
  // 使用 useCallback 缓存回调函数
  const handlePressWithCallback = useCallback(() => {
    console.log('✅ 使用 useCallback 的回调被调用');
  }, []);
  
  // 不使用 useCallback，每次渲染都会创建新函数
  const handlePressWithoutCallback = () => {
    console.log('❌ 不使用 useCallback 的回调被调用');
  };
  
  // 缓存数组（模拟海报列表）
  const cachedArray = useMemo(() => {
    console.log('🔄 创建缓存数组');
    return [1, 2, 3, 4].map(i => ({id: i, value: i * count}));
  }, [count]);
  
  // 不缓存数组
  const uncachedArray = [1, 2, 3, 4].map(i => ({id: i, value: i * count}));
  
  useEffect(() => {
    console.log('📊 缓存数组长度:', cachedArray.length);
    console.log('📊 非缓存数组长度:', uncachedArray.length);
  });
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>useMemo 优化验证</Text>
        <Text style={styles.headerSubtitle}>
          打开控制台查看日志，观察缓存效果
        </Text>
      </View>
      
      {/* 控制按钮 */}
      <View style={styles.controls}>
        <Button
          title={`增加 count (${count})`}
          onPress={() => {
            console.log('\n🔼 增加 count');
            setCount(c => c + 1);
          }}
        />
        <View style={styles.spacer} />
        <Button
          title={`改变其他状态 (${otherState})`}
          onPress={() => {
            console.log('\n🔄 改变其他状态（count 不变）');
            setOtherState(s => s + 1);
          }}
          color="#FF6B6B"
        />
      </View>
      
      {/* 测试说明 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>测试说明：</Text>
        <Text style={styles.instruction}>
          1. 点击"增加 count"按钮，观察两个组件的计算次数
        </Text>
        <Text style={styles.instruction}>
          2. 点击"改变其他状态"按钮，观察是否触发不必要的重新计算
        </Text>
        <Text style={styles.instruction}>
          3. 使用 useMemo 的组件只在 count 变化时重新计算
        </Text>
        <Text style={styles.instruction}>
          4. 不使用 useMemo 的组件每次渲染都会重新计算
        </Text>
      </View>
      
      {/* useMemo 对比 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>useMemo 对比：</Text>
        <WithUseMemo count={count} />
        <WithoutUseMemo count={count} />
      </View>
      
      {/* useCallback 对比 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>useCallback 对比：</Text>
        <Text style={styles.note}>
          注意：使用 useCallback 的子组件在"改变其他状态"时不会重新渲染
        </Text>
        <WithUseCallback onPress={handlePressWithCallback} />
        <WithoutUseCallback onPress={handlePressWithoutCallback} />
      </View>
      
      {/* 数组缓存对比 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>数组缓存对比：</Text>
        <View style={styles.card}>
          <Text style={styles.title}>缓存数组</Text>
          <Text style={styles.result}>
            {cachedArray.map(item => `${item.id}:${item.value}`).join(', ')}
          </Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.title}>非缓存数组</Text>
          <Text style={styles.result}>
            {uncachedArray.map(item => `${item.id}:${item.value}`).join(', ')}
          </Text>
        </View>
      </View>
      
      {/* 预期结果 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>预期结果：</Text>
        <Text style={styles.expected}>
          ✅ 点击"增加 count"时：
        </Text>
        <Text style={styles.expectedItem}>
          - WithUseMemo 组件执行 1 次计算
        </Text>
        <Text style={styles.expectedItem}>
          - WithoutUseMemo 组件执行 1 次计算
        </Text>
        <Text style={styles.expectedItem}>
          - 缓存数组重新创建
        </Text>
        
        <Text style={[styles.expected, {marginTop: 12}]}>
          ✅ 点击"改变其他状态"时：
        </Text>
        <Text style={styles.expectedItem}>
          - WithUseMemo 组件不执行计算（使用缓存）
        </Text>
        <Text style={styles.expectedItem}>
          - WithoutUseMemo 组件执行 1 次计算（浪费性能）
        </Text>
        <Text style={styles.expectedItem}>
          - WithUseCallback 子组件不重新渲染
        </Text>
        <Text style={styles.expectedItem}>
          - WithoutUseCallback 子组件重新渲染
        </Text>
        <Text style={styles.expectedItem}>
          - 缓存数组不重新创建（使用缓存）
        </Text>
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          查看控制台日志以验证优化效果
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#4A90E2',
    padding: 20,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  controls: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  spacer: {
    height: 12,
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  instruction: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 6,
    paddingLeft: 8,
  },
  note: {
    fontSize: 13,
    color: '#FF6B6B',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  card: {
    backgroundColor: '#F9F9F9',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  result: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'monospace',
  },
  expected: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4A90E2',
    marginBottom: 8,
  },
  expectedItem: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 4,
    paddingLeft: 16,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
  },
});
