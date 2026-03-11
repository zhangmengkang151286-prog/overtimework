# 调试参与人数问题

## 问题

提交了准点下班和加班各一次，但今日参与人数没有增加。

## 可能的原因

### 1. 物化视图没有刷新

物化视图 `real_time_stats` 不会自动更新，需要手动刷新或通过触发器刷新。

### 2. 应用使用的是缓存数据

应用可能显示的是旧的缓存数据，没有重新从数据库获取。

### 3. 视图定义没有正确更新

之前的 SQL 脚本可能没有完全执行成功。

## 排查步骤

### 步骤 1：在 Supabase SQL Editor 中执行验证脚本

复制 `verify_participant_count.sql` 的内容到 Supabase SQL Editor 执行。

**重点查看**：
- 第 3 步：`total_submissions` 应该显示你提交的次数（至少 2 次）
- 第 5 步：`participant_count` 应该等于 `total_submissions`
- 第 6 步：`get_real_time_stats()` 返回的 `participant_count` 应该正确

### 步骤 2：检查应用日志

在应用中查看控制台日志，看看 `getRealTimeStats()` 返回的数据是什么。

### 步骤 3：强制刷新应用

1. 在应用中下拉刷新（如果有）
2. 或者完全关闭应用重新打开
3. 等待 3 秒让自动刷新触发

## 临时解决方案

如果物化视图有问题，可以修改应用代码直接查询 `status_records` 表：

### 修改 `supabaseService.ts`

在 `getRealTimeStats()` 方法中，不使用物化视图，直接查询：

```typescript
async getRealTimeStats(): Promise<RealTimeStats> {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // 直接查询 status_records 表
    const {data, error} = await supabase
      .from('status_records')
      .select('*')
      .eq('date', today);

    if (error) throw handleSupabaseError(error);

    if (!data || data.length === 0) {
      return {
        participantCount: 0,
        overtimeCount: 0,
        onTimeCount: 0,
        lastUpdated: new Date(),
      };
    }

    // 手动计算统计数据
    const participantCount = data.length;  // 总记录数
    const overtimeCount = data.filter(r => r.is_overtime).length;
    const onTimeCount = data.filter(r => !r.is_overtime).length;
    const lastUpdated = new Date(
      Math.max(...data.map(r => new Date(r.submitted_at).getTime()))
    );

    return {
      participantCount,
      overtimeCount,
      onTimeCount,
      lastUpdated,
    };
  } catch (error) {
    console.error('Get real time stats error:', error);
    throw error;
  }
}
```

## 快速测试命令

在 Supabase SQL Editor 中快速测试：

```sql
-- 查看今日提交数
SELECT COUNT(*) FROM status_records WHERE date = CURRENT_DATE;

-- 刷新视图
REFRESH MATERIALIZED VIEW real_time_stats;

-- 查看视图数据
SELECT * FROM real_time_stats WHERE date = CURRENT_DATE;
```

## 下一步

1. 先在 Supabase 中执行 `verify_participant_count.sql`
2. 把结果告诉我，特别是：
   - `total_submissions` 的值
   - `participant_count` 的值
   - 它们是否相等

这样我就能知道问题出在数据库还是应用层。
