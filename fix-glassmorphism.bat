@echo off
echo ========================================
echo Glassmorphism 依赖修复脚本
echo ========================================
echo.

echo [1/3] 停止所有 Expo 进程...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo [2/3] 清除所有缓存...
if exist node_modules\.cache rmdir /s /q node_modules\.cache
if exist .expo rmdir /s /q .expo
if exist %TEMP%\metro-* rmdir /s /q %TEMP%\metro-*
if exist %TEMP%\react-* rmdir /s /q %TEMP%\react-*

echo [3/3] 启动 Expo（清除缓存模式）...
echo.
echo ========================================
echo 修复完成！正在启动应用...
echo ========================================
echo.

npx expo start --clear
