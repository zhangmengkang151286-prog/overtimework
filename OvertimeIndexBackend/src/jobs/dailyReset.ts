import { query } from '../database/connection';
import { clearCache } from '../cache/redis';

export function startDailyResetJob(): void {
  // 每分钟检查一次是否到了00:00
  setInterval(async () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();

    // 每天00:00执行重置
    if (hours === 0 && minutes === 0) {
      await performDailyReset();
    }
  }, 60000); // 每分钟检查一次

  console.log('每日重置任务已启动');
}

async function performDailyReset(): Promise<void> {
  try {
    console.log('开始执行每日重置...');

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // 1. 保存昨日统计到历史表
    const statsResult = await query(`
      SELECT 
        COUNT(DISTINCT user_id) as total_participants,
        COUNT(CASE WHEN status = 'on_time' THEN 1 END) as on_time_count,
        COUNT(CASE WHEN status = 'overtime' THEN 1 END) as overtime_count
      FROM daily_submissions
      WHERE submission_date = $1
    `, [yesterdayStr]);

    const stats = statsResult.rows[0];
    const total = parseInt(stats.total_participants) || 0;
    const onTime = parseInt(stats.on_time_count) || 0;
    const overtime = parseInt(stats.overtime_count) || 0;

    if (total > 0) {
      // 获取Top标签
      const tagsResult = await query(`
        SELECT 
          ds.status,
          t.id as tag_id,
          t.name as tag_name,
          COUNT(*) as count
        FROM submission_tags st
        JOIN tags t ON st.tag_id = t.id
        JOIN daily_submissions ds ON st.submission_id = ds.id
        WHERE ds.submission_date = $1
        GROUP BY ds.status, t.id, t.name
        ORDER BY count DESC
      `, [yesterdayStr]);

      const topTags = {
        onTime: tagsResult.rows.filter(r => r.status === 'on_time').slice(0, 10),
        overtime: tagsResult.rows.filter(r => r.status === 'overtime').slice(0, 10),
      };

      // 插入历史统计
      await query(`
        INSERT INTO daily_statistics (
          stat_date,
          total_participants,
          on_time_count,
          overtime_count,
          on_time_percentage,
          overtime_percentage,
          top_tags
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (stat_date) DO UPDATE SET
          total_participants = EXCLUDED.total_participants,
          on_time_count = EXCLUDED.on_time_count,
          overtime_count = EXCLUDED.overtime_count,
          on_time_percentage = EXCLUDED.on_time_percentage,
          overtime_percentage = EXCLUDED.overtime_percentage,
          top_tags = EXCLUDED.top_tags
      `, [
        yesterdayStr,
        total,
        onTime,
        overtime,
        (onTime / total) * 100,
        (overtime / total) * 100,
        JSON.stringify(topTags),
      ]);

      console.log(`昨日统计已保存: ${total}人参与, 准时${onTime}人, 加班${overtime}人`);
    }

    // 2. 清除所有缓存
    await clearCache('*');
    console.log('缓存已清除');

    // 3. 重置实时缓存
    await query(`
      INSERT INTO realtime_cache (cache_key, cache_value)
      VALUES 
        ('today_statistics', '{"totalParticipants": 0, "onTimeCount": 0, "overtimeCount": 0}'),
        ('top_tags', '{"onTimeTags": [], "overtimeTags": []}')
      ON CONFLICT (cache_key) DO UPDATE SET
        cache_value = EXCLUDED.cache_value,
        updated_at = CURRENT_TIMESTAMP
    `);

    console.log('每日重置完成！');
  } catch (error) {
    console.error('每日重置失败:', error);
  }
}

// 手动触发重置（用于测试）
export async function triggerDailyReset(): Promise<void> {
  await performDailyReset();
}
