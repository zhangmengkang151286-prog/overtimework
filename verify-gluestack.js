/**
 * gluestack-ui 安装验证脚本
 * 验证所有必需的包是否正确安装
 */

console.log('🔍 验证 gluestack-ui 安装...\n');

try {
  // 验证核心包
  console.log('✓ 检查 @gluestack-ui/themed...');
  require('@gluestack-ui/themed');
  
  console.log('✓ 检查 @gluestack-style/react...');
  require('@gluestack-style/react');
  
  console.log('✓ 检查 lucide-react-native...');
  require('lucide-react-native');
  
  console.log('✓ 检查 react-native-svg...');
  require('react-native-svg');
  
  console.log('✓ 检查 react-native-reanimated...');
  require('react-native-reanimated');
  
  console.log('\n✅ 所有 gluestack-ui 依赖安装成功！');
  console.log('\n📦 已安装的包:');
  console.log('  - @gluestack-ui/themed');
  console.log('  - @gluestack-style/react');
  console.log('  - lucide-react-native');
  console.log('  - react-native-svg');
  console.log('  - react-native-reanimated');
  
  console.log('\n🎉 gluestack-ui 已准备就绪！');
  console.log('\n下一步: 配置 GluestackUIProvider (任务 2)');
  
  process.exit(0);
} catch (error) {
  console.error('\n❌ 验证失败:', error.message);
  console.error('\n请检查安装是否正确完成。');
  process.exit(1);
}
