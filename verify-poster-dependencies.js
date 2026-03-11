/**
 * 验证分享海报功能所需的所有依赖
 * 
 * 运行方式: node verify-poster-dependencies.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 开始验证分享海报功能依赖...\n');

// 读取 package.json
const packageJsonPath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// 需要检查的依赖
const requiredDependencies = {
  'react-native-reanimated-carousel': '海报滑动容器',
  'react-native-view-shot': '截图功能',
  'expo-media-library': '保存到相册',
  'expo-sharing': '系统分享',
  'react-native-reanimated': 'Carousel 依赖',
  'react-native-gesture-handler': 'Carousel 依赖',
};

// 检查依赖
console.log('📦 检查依赖安装状态:\n');
let allInstalled = true;

Object.entries(requiredDependencies).forEach(([dep, description]) => {
  const version = packageJson.dependencies[dep];
  if (version) {
    console.log(`✅ ${dep}@${version}`);
    console.log(`   用途: ${description}\n`);
  } else {
    console.log(`❌ ${dep} - 未安装`);
    console.log(`   用途: ${description}\n`);
    allInstalled = false;
  }
});

// 检查 app.json 配置
console.log('\n⚙️  检查权限配置:\n');

const appJsonPath = path.join(__dirname, 'app.json');
const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));

const hasMediaLibraryPlugin = appJson.expo.plugins?.some(plugin => {
  if (Array.isArray(plugin)) {
    return plugin[0] === 'expo-media-library';
  }
  return plugin === 'expo-media-library';
});

if (hasMediaLibraryPlugin) {
  console.log('✅ expo-media-library 插件已配置');
  
  const mediaLibraryConfig = appJson.expo.plugins.find(plugin => 
    Array.isArray(plugin) && plugin[0] === 'expo-media-library'
  );
  
  if (mediaLibraryConfig && mediaLibraryConfig[1]) {
    console.log('   权限配置:');
    console.log(`   - photosPermission: "${mediaLibraryConfig[1].photosPermission}"`);
    console.log(`   - savePhotosPermission: "${mediaLibraryConfig[1].savePhotosPermission}"`);
    console.log(`   - isAccessMediaLocationEnabled: ${mediaLibraryConfig[1].isAccessMediaLocationEnabled}`);
  }
} else {
  console.log('❌ expo-media-library 插件未配置');
  allInstalled = false;
}

// 总结
console.log('\n' + '='.repeat(60));
if (allInstalled) {
  console.log('✅ 所有依赖和配置都已就绪！');
  console.log('\n下一步:');
  console.log('1. 创建类型定义 (src/types/poster.ts)');
  console.log('2. 创建海报主题配置 (src/theme/posterTheme.ts)');
  console.log('3. 创建 SharePosterScreen (src/screens/SharePosterScreen.tsx)');
} else {
  console.log('❌ 存在缺失的依赖或配置');
  console.log('\n请执行以下命令安装缺失的依赖:');
  console.log('npm install react-native-reanimated-carousel react-native-view-shot expo-media-library expo-sharing');
}
console.log('='.repeat(60) + '\n');

process.exit(allInstalled ? 0 : 1);
