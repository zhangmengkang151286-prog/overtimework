/**
 * 验证 GluestackUIProvider 配置
 * 
 * 这个脚本检查：
 * 1. @gluestack-ui/themed 是否已安装
 * 2. @gluestack-ui/config 是否已安装
 * 3. package.json 中的依赖
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 开始验证 GluestackUIProvider 配置...\n');

// 读取 package.json
const packageJsonPath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// 检查依赖
const dependencies = packageJson.dependencies || {};

console.log('📦 检查 package.json 依赖:\n');

// 检查 @gluestack-ui/themed
if (dependencies['@gluestack-ui/themed']) {
  console.log('✅ @gluestack-ui/themed:', dependencies['@gluestack-ui/themed']);
} else {
  console.log('❌ @gluestack-ui/themed 未在 package.json 中找到');
}

// 检查 @gluestack-ui/config
if (dependencies['@gluestack-ui/config']) {
  console.log('✅ @gluestack-ui/config:', dependencies['@gluestack-ui/config']);
} else {
  console.log('❌ @gluestack-ui/config 未在 package.json 中找到');
}

// 检查 @gluestack-style/react
if (dependencies['@gluestack-style/react']) {
  console.log('✅ @gluestack-style/react:', dependencies['@gluestack-style/react']);
} else {
  console.log('❌ @gluestack-style/react 未在 package.json 中找到');
}

// 检查 lucide-react-native
if (dependencies['lucide-react-native']) {
  console.log('✅ lucide-react-native:', dependencies['lucide-react-native']);
} else {
  console.log('❌ lucide-react-native 未在 package.json 中找到');
}

// 检查 react-native-svg
if (dependencies['react-native-svg']) {
  console.log('✅ react-native-svg:', dependencies['react-native-svg']);
} else {
  console.log('❌ react-native-svg 未在 package.json 中找到');
}

// 检查 react-native-reanimated
if (dependencies['react-native-reanimated']) {
  console.log('✅ react-native-reanimated:', dependencies['react-native-reanimated']);
} else {
  console.log('❌ react-native-reanimated 未在 package.json 中找到');
}

// 检查 node_modules 中的实际安装
console.log('\n📁 检查 node_modules 安装:\n');

const checkNodeModule = (moduleName) => {
  const modulePath = path.join(__dirname, 'node_modules', moduleName);
  if (fs.existsSync(modulePath)) {
    console.log(`✅ ${moduleName} 已安装在 node_modules`);
    return true;
  } else {
    console.log(`❌ ${moduleName} 未在 node_modules 中找到`);
    return false;
  }
};

checkNodeModule('@gluestack-ui/themed');
checkNodeModule('@gluestack-ui/config');
checkNodeModule('@gluestack-style/react');
checkNodeModule('lucide-react-native');

// 检查 App.tsx 是否已更新
console.log('\n📝 检查 App.tsx 配置:\n');

const appTsxPath = path.join(__dirname, 'App.tsx');
const appTsxContent = fs.readFileSync(appTsxPath, 'utf8');

if (appTsxContent.includes('GluestackUIProvider')) {
  console.log('✅ App.tsx 已导入 GluestackUIProvider');
} else {
  console.log('❌ App.tsx 未导入 GluestackUIProvider');
}

if (appTsxContent.includes('@gluestack-ui/config')) {
  console.log('✅ App.tsx 已导入 @gluestack-ui/config');
} else {
  console.log('❌ App.tsx 未导入 @gluestack-ui/config');
}

if (appTsxContent.includes('<GluestackUIProvider')) {
  console.log('✅ App.tsx 已使用 <GluestackUIProvider>');
} else {
  console.log('❌ App.tsx 未使用 <GluestackUIProvider>');
}

console.log('\n✅ GluestackUIProvider 配置验证完成！');
console.log('\n📝 下一步:');
console.log('   1. 清除缓存: npx expo start --clear');
console.log('   2. 重启 Expo 开发服务器');
console.log('   3. 在应用中测试 gluestack-ui 组件');
console.log('   4. 检查是否有任何运行时错误');
