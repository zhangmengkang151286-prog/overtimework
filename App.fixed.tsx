import React from 'react';
import {View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity} from 'react-native';
import {Provider} from 'react-redux';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {store} from './src/store';

const Stack = createStackNavigator();

/**
 * 简化的首页 - 避免复杂组件导致崩溃
 */
function SimpleTrendPage({navigation}: any) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>打工人加班指数</Text>
        <Text style={styles.subtitle}>应用运行正常 ✅</Text>
        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🎉 成功！</Text>
          <Text style={styles.cardText}>所有核心模块都正常工作：</Text>
          <Text style={styles.cardText}>• Redux ✅</Text>
          <Text style={styles.cardText}>• Navigation ✅</Text>
          <Text style={styles.cardText}>• 基础UI ✅</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>📱 功能导航</Text>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => navigation.navigate('Settings')}
          >
            <Text style={styles.buttonText}>设置</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => navigation.navigate('DataManagement')}
          >
            <Text style={styles.buttonText}>数据管理</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>ℹ️ 说明</Text>
          <Text style={styles.cardText}>
            这是简化版本，移除了可能导致崩溃的复杂组件。
          </Text>
          <Text style={styles.cardText}>
            如果这个版本正常运行，说明问题在于某些复杂的UI组件或数据服务。
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SimpleSettingsPage({navigation}: any) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>设置</Text>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>返回</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function SimpleDataManagementPage({navigation}: any) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>数据管理</Text>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>返回</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Trend"
        screenOptions={{
          headerShown: false,
        }}>
        <Stack.Screen name="Trend" component={SimpleTrendPage} />
        <Stack.Screen name="Settings" component={SimpleSettingsPage} />
        <Stack.Screen name="DataManagement" component={SimpleDataManagementPage} />
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
  button: {
    backgroundColor: '#4A90E2',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
