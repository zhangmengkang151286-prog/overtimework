/**
 * 清除本地存储的用户状态
 * 用于重置"今日已提交"状态
 * 
 * 使用方法：
 * 1. 在应用中打开 React Native Debugger
 * 2. 在 Console 中复制粘贴此脚本并执行
 * 3. 或者在代码中临时调用 clearUserStatus()
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

async function clearUserStatus() {
  try {
    // 清除用户状态
    await AsyncStorage.removeItem('@OvertimeIndexApp:userStatus');
    
    // 清除重置日期（可选，会触发每日重置）
    await AsyncStorage.removeItem('@OvertimeIndexApp:lastResetDate');
    
    console.log('✅ 用户状态已清除');
    console.log('请重启应用以查看效果');
    
    return true;
  } catch (error) {
    console.error('❌ 清除失败:', error);
    return false;
  }
}

// 导出函数
export { clearUserStatus };

// 如果直接运行此脚本
if (require.main === module) {
  clearUserStatus();
}
