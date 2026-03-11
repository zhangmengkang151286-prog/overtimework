import React from 'react';
import {View, Text, StyleSheet, SafeAreaView, ScrollView} from 'react-native';
import {Provider} from 'react-redux';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {store} from './src/store';

const Stack = createStackNavigator();

/**
 * 测试版本2 - 添加Navigation
 * 测试React Navigation是否导致崩溃
 */
function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>打工人加班指数</Text>
        <Text style={styles.subtitle}>测试版本2 - Navigation</Text>
        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>✅ 测试内容</Text>
          <Text style={styles.cardText}>• Redux Provider ✅</Text>
          <Text style={styles.cardText}>• NavigationContainer</Text>
          <Text style={styles.cardText}>• Stack Navigator</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>📱 如果看到这个界面</Text>
          <Text style={styles.cardText}>说明Navigation工作正常 ✅</Text>
          <Text style={styles.cardText}>可以继续测试版本3</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>❌ 如果应用崩溃</Text>
          <Text style={styles.cardText}>说明Navigation有问题</Text>
          <Text style={styles.cardText}>需要检查导航配置</Text>
        </View>

        <Text style={styles.footer}>
          测试版本2/5{'\n'}
          React Navigation测试
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
