@echo off
echo ========================================
echo 清除所有缓存 - 显示真实 SVG 头像
echo ========================================
echo.

echo [1/5] 清除 Metro bundler 缓存...
if exist "node_modules\.cache" (
    rmdir /s /q "node_modules\.cache"
    echo ✓ Metro 缓存已清除
) else (
    echo - Metro 缓存不存在
)
echo.

echo [2/5] 清除 Expo 缓存...
if exist ".expo" (
    rmdir /s /q ".expo"
    echo ✓ Expo 缓存已清除
) else (
    echo - Expo 缓存不存在
)
echo.

echo [3/5] 清除 Metro 日志...
del /q /f metro-*.log 2>nul
echo ✓ Metro 日志已清除
echo.

echo [4/5] 清除 Watchman 缓存...
watchman watch-del-all 2>nul
echo ✓ Watchman 缓存已清除
echo.

echo [5/5] 启动 Expo（清除缓存模式）...
echo.
echo ========================================
echo 缓存清除完成！正在启动 Expo...
echo ========================================
echo.
echo 提示：
echo - 在手机上摇晃设备，选择 "Reload"
echo - 应该看到真实的 SVG 头像（不是数字）
echo.

npx expo start --clear
