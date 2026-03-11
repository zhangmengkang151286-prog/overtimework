# 移除数据管理功能

## 修改内容

已从应用中移除"数据管理"功能：

### 1. TrendPage.tsx
- ✅ 删除 `handleNavigateToDataManagement` 函数
- ✅ 从菜单中移除"📊 数据管理"选项
- ✅ 菜单现在只包含：
  - ⚙️ 设置
  - 取消

### 2. App.tsx
- ✅ 移除 `DataManagementScreen` 导入
- ✅ 移除 `DataManagement` 路由

## 测试

重新加载应用后：
1. 点击右上角菜单按钮（☰）
2. 确认菜单中只显示"设置"和"取消"
3. "数据管理"选项已不存在

## 文件状态

- `OvertimeIndexApp/src/screens/TrendPage.tsx` - ✅ 已修改
- `OvertimeIndexApp/App.tsx` - ✅ 已修改
- `OvertimeIndexApp/src/screens/DataManagementScreen.tsx` - 保留（未删除文件，只是移除了引用）

**注意**: DataManagementScreen.tsx 文件本身仍然存在，只是不再被使用。如果需要，可以手动删除该文件。
