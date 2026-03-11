import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, SafeAreaView, ScrollView, Dimensions} from 'react-native';
import {Provider} from 'react-redux';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import {VictoryBar, VictoryChart, VictoryTheme} from 'victory-native';
import SQLite from 'react-native-sqlite-storage';
import {store} from './src/store';

const Stack = createStackNavigator();

const chartData = [
  {x: '周一', y: 2},
  {x: '周二', y: 3},
  {x: '周三', y: 5},
  {x: '周四', y: 4},
  {x: '周五', y: 7},
];

/**
 * 测试版本5 - 添加SQLite
 * 测试SQLite数据库是否导致崩溃
 */
function HomeScreen() {
  const [dbStatus, setDbStatus] = useState('初始化中...');
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.5, {duration: 1000}), -1, true);

    // 测试SQLite
    const testDatabase = async () => {
      try {
        const db = await SQLite.openDatabase({
          name: 'test.db',
          location: 'default',
        });
        setDbStatus('数据库连接成功 ✅');
      } catch (error) {
        setDbStatus(`数据库连接失败: ${error}`);
      }
    };

    testDatabase();
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>打工人加班指数</Text>
        <Text style={styles.subtitle}>测试版本5 - SQLite</Text>
        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>💾 数据库测试</Text>
          <Text style={styles.cardText}>{dbStatus}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>📊 图表测试</Text>
          <VictoryChart
            theme={VictoryTheme.material}
            width={Dimensions.get('window').width - 80}
            height={200}
          >
            <VictoryBar
              data={chartData}
              style={{
                data: {fill: '#4A90E2'},
              }}
            />
          </VictoryChart>
        </View>

        <Animated.View style={[styles.card, animatedStyle]}>
          <Text style={styles.cardTitle}>✨ 动画测试</Text>
          <Text style={styles.cardText}>这个卡片应该在闪烁 ✅</Text>
        </Animated.View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>✅ 测试内容</Text>
          <Text style={styles.cardText}>• Redux Provider ✅</Text>
          <Text style={styles.cardText}>• NavigationContainer ✅</Text>
          <Text style={styles.cardText}>• Reanimated动画 ✅</Text>
          <Text style={styles.cardText}>• Victory图表 ✅</Text>
          <Text style={styles.cardText}>• SQLite数据库</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>📱 如果看到这个界面</Text>
          <Text style={styles.cardText}>说明所有核心模块都正常 ✅</Text>
          <Text style={styles.cardText}>问题可能在业务逻辑中</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>❌ 如果应用崩溃</Text>
          <Text style={styles.cardText}>说明SQLite有问题</Text>
          <Text style={styles.cardText}>可以考虑使用AsyncStorage</Text>
        </View>

        <Text style={styles.footer}>
          测试版本5/5{'\n'}
          SQLite数据库测试
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{headerShown: false}}>
        <Stack.Screen name="Home" component={HomeScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <AppNavigator />
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  cardText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  footer: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 40,
    lineHeight: 18,
  },
});
