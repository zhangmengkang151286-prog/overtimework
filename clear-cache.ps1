# PowerShell 清理脚本
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "清理 Expo 和 React Native 缓存" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. 停止 Node 进程
Write-Host "[1/5] 停止所有 Node 进程..." -ForegroundColor Yellow
try {
    Get-Process node -ErrorAction Stop | Stop-Process -Force
    Write-Host "[OK] Node 进程已停止" -ForegroundColor Green
} catch {
    Write-Host "[INFO] 没有运行中的 Node 进程" -ForegroundColor Gray
}
Write-Host ""

# 2. 删除 .expo 目录
Write-Host "[2/5] 删除 .expo 缓存目录..." -ForegroundColor Yellow
if (Test-Path ".expo") {
    Remove-Item -Recurse -Force ".expo"
    Write-Host "[OK] .expo 目录已删除" -ForegroundColor Green
} else {
    Write-Host "[INFO] .expo 目录不存在" -ForegroundColor Gray
}
Write-Host ""

# 3. 删除 node_modules 缓存
Write-Host "[3/5] 删除 node_modules 缓存..." -ForegroundColor Yellow
if (Test-Path "node_modules\.cache") {
    Remove-Item -Recurse -Force "node_modules\.cache"
    Write-Host "[OK] node_modules\.cache 已删除" -ForegroundColor Green
} else {
    Write-Host "[INFO] node_modules\.cache 不存在" -ForegroundColor Gray
}
Write-Host ""

# 4. 清理 npm 缓存
Write-Host "[4/5] 清理 npm 缓存..." -ForegroundColor Yellow
npm cache clean --force
Write-Host "[OK] npm 缓存已清理" -ForegroundColor Green
Write-Host ""

# 5. 清理 Metro 和 React 缓存
Write-Host "[5/5] 清理 Metro Bundler 缓存..." -ForegroundColor Yellow
$tempPath = $env:TEMP
$metroFiles = Get-ChildItem -Path $tempPath -Filter "metro-*" -ErrorAction SilentlyContinue
$reactFiles = Get-ChildItem -Path $tempPath -Filter "react-*" -ErrorAction SilentlyContinue

if ($metroFiles) {
    $metroFiles | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "[OK] Metro 缓存已清理" -ForegroundColor Green
} else {
    Write-Host "[INFO] 没有 Metro 缓存" -ForegroundColor Gray
}

if ($reactFiles) {
    $reactFiles | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "[OK] React 缓存已清理" -ForegroundColor Green
} else {
    Write-Host "[INFO] 没有 React 缓存" -ForegroundColor Gray
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "缓存清理完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "下一步：" -ForegroundColor Yellow
Write-Host "1. 在手机上完全关闭应用（从任务管理器中关闭）"
Write-Host "2. 运行: npx expo start --clear"
Write-Host "3. 重新打开应用"
Write-Host ""
Write-Host "按任意键继续..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
