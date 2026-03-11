@echo off
echo ========================================
echo 清理 Expo 和 React Native 缓存
echo ========================================
echo.

echo [1/5] 停止所有 Node 进程...
taskkill /F /IM node.exe 2>nul
if %errorlevel% == 0 (
    echo ✓ Node 进程已停止
) else (
    echo ℹ 没有运行中的 Node 进程
)
echo.

echo [2/5] 删除 .expo 缓存目录...
if exist .expo (
    rmdir /s /q .expo
    echo ✓ .expo 目录已删除
) else (
    echo ℹ .expo 目录不存在
)
echo.

echo [3/5] 删除 node_modules 缓存...
if exist node_modules\.cache (
    rmdir /s /q node_modules\.cache
    echo ✓ node_modules\.cache 已删除
) else (
    echo ℹ node_modules\.cache 不存在
)
echo.

echo [4/5] 清理 npm 缓存...
call npm cache clean --force
echo ✓ npm 缓存已清理
echo.

echo [5/5] 清理 Metro Bundler 缓存...
if exist %TEMP%\metro-* (
    del /q %TEMP%\metro-* 2>nul
    echo ✓ Metro 缓存已清理
) else (
    echo ℹ 没有 Metro 缓存
)
if exist %TEMP%\react-* (
    del /q %TEMP%\react-* 2>nul
    echo ✓ React 缓存已清理
) else (
    echo ℹ 没有 React 缓存
)
echo.

echo ========================================
echo 缓存清理完成！
echo ========================================
echo.
echo 下一步：
echo 1. 在手机上完全关闭应用（从任务管理器中关闭）
echo 2. 运行: npx expo start --clear
echo 3. 重新打开应用
echo.
pause
