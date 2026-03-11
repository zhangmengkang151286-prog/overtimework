# Glassmorphism 依赖修复脚本

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Glassmorphism 依赖修复脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/3] 停止所有 Expo 进程..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

Write-Host "[2/3] 清除所有缓存..." -ForegroundColor Yellow
$cachePaths = @(
    "node_modules\.cache",
    ".expo",
    "$env:TEMP\metro-*",
    "$env:TEMP\react-*"
)

foreach ($path in $cachePaths) {
    if (Test-Path $path) {
        Remove-Item -Path $path -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "  已清除: $path" -ForegroundColor Gray
    }
}

Write-Host "[3/3] 启动 Expo（清除缓存模式）..." -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "修复完成！正在启动应用..." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

npx expo start --clear
