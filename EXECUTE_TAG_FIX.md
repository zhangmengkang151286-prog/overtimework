# 执行标签分布修复

## 问题描述
快照中包含了所有70个活跃标签，包括 count=0 的标签，导致 App 显示很多0的标签。

## 解决方案
使用 `INNER JOIN` 而不是 `LEFT JOIN`，只保存有数据的标签（count > 0）。

---

## 执行步骤

### 步骤1：执行修复脚本

1. 打开 Supabase Dashboard
2. 进入 SQL Editor
3. 复制并执行文件内容：`OvertimeIndexApp/fix_tag_distribution_in_snapshots.sql`
4. 等待执行完成（约5秒）

### 步骤2：验证修复结果

在 SQL Editor 中执行：`OvertimeIndexApp/verify_tag_fix.sql`

**预期结果：**

| 时间 | 参与人数 | 加班次数 | 准时次数 | 标签数量 |
|------|---------|---------|---------|---------|
| 6点  | 0       | 0       | 0       | 0       |
| 7点  | 0       | 0       | 0       | 0       |
| 8点  | 1       | 0       | 1       | 1       |
| 10点 | 1       | 1       | 1       | 2       |
| 14点 | 1       | 2       | 2       | 3       |
| 22点 | 1       | 4       | 5       | 3       |

**标签详情：**
- 8点：开会（1次）
- 10点：开会（1次）、写代码（1次）
- 14点：开会（2次）、写代码（1次）、调试（1次）
- 22点：开会（4次）、写代码（3次）、调试（2次）

### 步骤3：重启 App

1. 完全关闭 App
2. 重新启动 App
3. 清除缓存

### 步骤4：测试时间轴

1. 拖动时间轴到 8点
   - ✅ 应该显示 1个标签：开会
   - ❌ 不应该有 count=0 的标签

2. 拖动时间轴到 10点
   - ✅ 应该显示 2个标签：开会、写代码
   - ❌ 不应该有 count=0 的标签

3. 拖动时间轴到 14点
   - ✅ 应该显示 3个标签：开会、写代码、调试
   - ❌ 不应该有 count=0 的标签

4. 拖动时间轴到 22点
   - ✅ 应该显示 3个标签：开会、写代码、调试
   - ❌ 不应该有 count=0 的标签

---

## 如果还有问题

如果执行后仍然显示很多0的标签，请检查：

1. **App 是否使用了快照数据**
   - 查看 `hourlySnapshotService.ts` 的 `getSnapshot()` 方法
   - 确认从 `hourly_snapshots` 表读取数据

2. **App 是否正确转换数据格式**
   - 查看 `convertTagDistribution()` 方法
   - 确认只显示 count > 0 的标签

3. **App 缓存是否清除**
   - 完全关闭 App
   - 清除 App 数据
   - 重新启动

---

## 相关文件

- `fix_tag_distribution_in_snapshots.sql` - 修复脚本
- `verify_tag_fix.sql` - 验证脚本
- `TIMELINE_FEATURE_STATUS.md` - 完整状态文档
- `src/services/hourlySnapshotService.ts` - 快照服务
