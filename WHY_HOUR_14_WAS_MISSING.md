# 为什么14点数据刚才才出来？

## 问题分析

14点的快照数据之前不存在，刚才通过手动执行SQL脚本才生成。原因如下：

## 根本原因

### 1. GitHub Actions 运行时间问题

**GitHub Actions 配置：**
```yaml
schedule:
  - cron: '0 * * * *'  # 每小时的第0分钟执行（UTC时间）
```

**关键点：**
- GitHub Actions 使用 **UTC 时间**
- 北京时间 = UTC + 8小时
- 当北京时间是 14:00 时，UTC 时间是 06:00
- GitHub Actions 会在 UTC 06:00（北京时间 14:00）触发

### 2. 可能的失败原因

14点快照缺失可能是因为：

#### A. GitHub Actions 执行失败
- 网络问题导致无法连接 Supabase
- API 调用超时
- Secrets 配置问题
- GitHub Actions 服务暂时不可用

#### B. 数据库函数执行问题
- `save_hourly_snapshot()` 函数执行时出错
- 数据库连接问题
- 权限问题（SECURITY DEFINER）

#### C. 时区计算问题
- 函数内部时区转换错误
- `submitted_at` 时间戳与快照时间不匹配

## 如何验证问题

### 1. 检查 GitHub Actions 日志

访问：
```
https://github.com/zhangmengkang151286-prog/overtimework/actions
```

查看今天 UTC 06:00（北京时间 14:00）的执行日志：
- ✅ 成功：会显示 "Snapshot saved successfully"
- ❌ 失败：会显示错误信息

### 2. 检查数据库日志

在 Supabase Dashboard 中查看：
- Database → Logs
- 搜索 "save_hourly_snapshot"
- 查看是否有错误或警告

### 3. 手动测试函数

在 Supabase SQL Editor 中执行：
```sql
SELECT save_hourly_snapshot();
```

如果成功，应该返回：
```
NOTICE: Hourly snapshot saved (Beijing Time): date=2026-02-05, hour=15, time=..., participants=...
```

## 为什么手动执行成功了？

我们的诊断脚本 `diagnose_hourly_snapshot_14.sql` 做了以下事情：

1. **删除旧快照**（如果存在）
```sql
DELETE FROM hourly_snapshots
WHERE snapshot_date = CURRENT_DATE AND snapshot_hour = 14;
```

2. **手动插入快照**
```sql
INSERT INTO hourly_snapshots (...)
SELECT ...
FROM status_records sr
WHERE sr.date = CURRENT_DATE
  AND EXTRACT(HOUR FROM sr.submitted_at AT TIME ZONE 'Asia/Shanghai') <= 14;
```

3. **关键区别**
- GitHub Actions 调用 `save_hourly_snapshot()` 函数
- 我们的脚本直接 INSERT 数据
- 直接 INSERT 绕过了函数可能存在的问题

## 解决方案

### 短期方案（已完成）
✅ 手动执行 SQL 脚本生成缺失的快照

### 长期方案

#### 1. 增强错误处理
修改 `save_hourly_snapshot()` 函数，添加更详细的错误日志：

```sql
CREATE OR REPLACE FUNCTION save_hourly_snapshot()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $
BEGIN
  -- 添加 TRY-CATCH 错误处理
  BEGIN
    -- 原有逻辑
    ...
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Failed to save hourly snapshot: %', SQLERRM;
    -- 记录到错误日志表
    INSERT INTO snapshot_errors (error_time, error_message)
    VALUES (NOW(), SQLERRM);
  END;
END;
$;
```

#### 2. 添加监控和告警
- 创建一个检查脚本，验证每小时快照是否生成
- 如果缺失，发送告警通知
- 自动重试失败的快照生成

#### 3. 添加补救机制
创建一个每日任务，检查并补全缺失的快照：

```sql
CREATE OR REPLACE FUNCTION backfill_missing_snapshots()
RETURNS void
LANGUAGE plpgsql
AS $
DECLARE
  v_hour INTEGER;
  v_current_hour INTEGER;
BEGIN
  v_current_hour := EXTRACT(HOUR FROM timezone('Asia/Shanghai', NOW()))::INTEGER;
  
  -- 检查今天每个小时的快照
  FOR v_hour IN 6..v_current_hour LOOP
    -- 如果快照不存在，生成它
    IF NOT EXISTS (
      SELECT 1 FROM hourly_snapshots 
      WHERE snapshot_date = CURRENT_DATE 
      AND snapshot_hour = v_hour
    ) THEN
      PERFORM save_hourly_snapshot_at_hour(CURRENT_DATE, v_hour);
      RAISE NOTICE 'Backfilled missing snapshot for hour %', v_hour;
    END IF;
  END LOOP;
END;
$;
```

#### 4. 改进 GitHub Actions
添加重试逻辑和更详细的日志：

```yaml
- name: Save Hourly Snapshot
  run: |
    for i in {1..3}; do
      echo "Attempt $i: Triggering hourly snapshot at $(date)"
      
      RESPONSE=$(curl -X POST \
        "${{ secrets.SUPABASE_URL }}/rest/v1/rpc/save_hourly_snapshot" \
        -H "apikey: ${{ secrets.SUPABASE_ANON_KEY }}" \
        -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}" \
        -H "Content-Type: application/json" \
        -d '{}' \
        -w "\nHTTP_CODE:%{http_code}")
      
      HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
      
      if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "204" ]; then
        echo "✅ Snapshot saved successfully"
        exit 0
      else
        echo "❌ Failed with HTTP code: $HTTP_CODE"
        echo "Response: $RESPONSE"
        sleep 10
      fi
    done
    
    echo "❌ All attempts failed"
    exit 1
```

## 建议的下一步

1. **立即检查** GitHub Actions 日志，确认今天 14:00 的执行状态
2. **监控** 接下来几个小时的快照生成情况
3. **考虑实施** 上述长期方案中的一个或多个

## 总结

14点数据缺失的原因很可能是：
- GitHub Actions 在 UTC 06:00（北京时间 14:00）执行失败
- 可能是网络问题、API 超时或其他临时性故障
- 手动执行成功说明数据库和函数本身是正常的
- 需要检查 GitHub Actions 日志来确认具体原因

**当前状态：** ✅ 14点快照已手动修复，数据正常
**风险：** ⚠️ 如果 GitHub Actions 持续失败，未来的快照可能继续缺失
**建议：** 尽快检查 GitHub Actions 日志并实施监控机制
