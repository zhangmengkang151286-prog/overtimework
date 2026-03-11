import React, {useEffect} from 'react';
import {StatusBar, View, Text} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {Provider, useSelector} from 'react-redux';
import {store} from './src/store';
import {
  TrendPage,
  LoginScreen,
  PhoneRegisterScreen,
  CompleteProfileScreen,
  DataManagementScreen,
  SettingsScreen,
} from './src/screens';
import {
  ErrorBoundary,
  NetworkStatusBar,
  ToastContainer,
} from './src/components';
import {appStartupOptimizer} from './src/utils/appOptimization';

const Stack = createStackNavigator();

// 记录应用启动时间
appStartupOptimizer.markStartup();

/**
 * 应用导航容器
 * 验证需求: 1.1, 1.5, 3.2
 */
function AppNavigator() {
  const theme = useSelector((state: any) => state?.ui?.theme || 'light');
  
  useEffect(() => {
    // 标记应用启动完成
    appStartupOptimizer.markStartupComplete();
  }, []);
  
  return (
    <View style={{flex: 1}}>
      <StatusBar
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={theme === 'dark' ? '#000000' : '#FFFFFF'}
      />
      <NetworkStatusBar />
      <ToastContainer />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Trend"
          screenOptions={{
            headerShown: false,
            cardStyle: {
              backgroundColor: theme === 'dark' ? '#000000' : '#FFFFFF',
            },
          }}>
          <Stack.Screen name="Trend" component={TrendPage} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="PhoneRegister" component={PhoneRegisterScreen} />
          <Stack.Screen
            name="CompleteProfile"
            component={CompleteProfileScreen}
          />
          <Stack.Screen
            name="DataManagement"
            component={DataManagementScreen}
          />
          <Stack.Screen name="Settings" component={SettingsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </View>
  );
}

export default function App() {
  try {
    return (
      <ErrorBoundary>
        <Provider store={store}>
          <AppNavigator />
        </Provider>
      </ErrorBoundary>
    );
  } catch (error) {
    console.error('App initialization error:', error);
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20}}>
        <Text style={{fontSize: 18, fontWeight: 'bold', marginBottom: 10}}>
          应用初始化失败
        </Text>
        <Text style={{fontSize: 14, color: '#666', textAlign: 'center'}}>
          {error instanceof Error ? error.message : '未知错误'}
        </Text>
      </View>
    );
  }
}
