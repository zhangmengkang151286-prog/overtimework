const { Client } = require('pg');

const c = new Client({
  host: 'pgm-0jl4gyc9gj1z2vz0to.pg.rds.aliyuncs.com',
  port: 5432,
  database: 'overtime_index',
  user: '1126_zhangmengkang',
  password: 'Kiro@1345',
  ssl: false,
  connectionTimeoutMillis: 15000,
});

async function run() {
  await c.connect();
  console.log('连接成功，开始插入数据...');

  // 第一步：清理今天已有的测试用户状态
  const del = await c.query(`
    DELETE FROM public.status_records
    WHERE date = CURRENT_DATE
      AND user_id IN (
        SELECT id FROM public.users
        WHERE phone_number ~ '^13900[0-9]{6}$'
          AND phone_number::bigint BETWEEN 13900000001 AND 13900000500
      )
  `);
  console.log('清理旧数据:', del.rowCount, '条');

  // 第二步：获取所有测试用户ID
  const users = await c.query(`
    SELECT id FROM public.users
    WHERE phone_number ~ '^13900[0-9]{6}$'
      AND phone_number::bigint BETWEEN 13900000001 AND 13900000500
    ORDER BY phone_number
  `);
  console.log('测试用户数:', users.rows.length);

  // 第三步：获取标签
  const overtimeTags = await c.query(`
    SELECT id FROM public.tags WHERE type = 'custom' AND category = 'overtime' AND is_active = true
  `);
  const ontimeTags = await c.query(`
    SELECT id FROM public.tags WHERE type = 'custom' AND category = 'ontime' AND is_active = true
  `);
  console.log('加班标签数:', overtimeTags.rows.length, '准时标签数:', ontimeTags.rows.length);

  // 判断今天是否周末
  const dow = new Date().getDay(); // 0=周日, 6=周六
  const isWeekend = dow === 0 || dow === 6;
  const overtimeRate = isWeekend ? 0.30 : 0.55;
  console.log('今天是否周末:', isWeekend, '加班概率:', overtimeRate);

  // 第四步：批量插入
  let insertCount = 0;
  const values = [];

  for (const user of users.rows) {
    const isOvertime = Math.random() < overtimeRate;
    const tagPool = isOvertime ? overtimeTags.rows : ontimeTags.rows;
    const tagId = tagPool[Math.floor(Math.random() * tagPool.length)].id;
    const overtimeHours = isOvertime ? (1 + Math.floor(Math.random() * 5)) : null;

    // 提交时间：今天 17:00~23:59 北京时间（UTC+8，存UTC）
    const hour = 17 + Math.floor(Math.random() * 7);
    const min = Math.floor(Math.random() * 60);
    const now = new Date();
    const submittedAt = new Date(Date.UTC(
      now.getFullYear(), now.getMonth(), now.getDate(),
      hour - 8, min, 0  // 北京时间转UTC
    ));

    values.push(`(gen_random_uuid(), '${user.id}', CURRENT_DATE, ${isOvertime}, '${tagId}', ${overtimeHours !== null ? overtimeHours : 'NULL'}, '${submittedAt.toISOString()}')`);
  }

  // 分批插入，每批100条
  const batchSize = 100;
  for (let i = 0; i < values.length; i += batchSize) {
    const batch = values.slice(i, i + batchSize);
    await c.query(`
      INSERT INTO public.status_records (id, user_id, date, is_overtime, tag_id, overtime_hours, submitted_at)
      VALUES ${batch.join(',')}
    `);
    insertCount += batch.length;
    console.log(`已插入 ${insertCount}/${values.length}`);
  }

  // 第五步：验证结果
  const result = await c.query(`
    SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE is_overtime = true) AS overtime_count,
      COUNT(*) FILTER (WHERE is_overtime = false) AS ontime_count
    FROM public.status_records
    WHERE date = CURRENT_DATE
      AND user_id IN (
        SELECT id FROM public.users
        WHERE phone_number ~ '^13900[0-9]{6}$'
          AND phone_number::bigint BETWEEN 13900000001 AND 13900000500
      )
  `);

  const r = result.rows[0];
  console.log('\n===== 插入结果 =====');
  console.log('今日状态总数:', r.total);
  console.log('加班人数:', r.overtime_count);
  console.log('准时人数:', r.ontime_count);
  console.log('加班比例:', (r.overtime_count / r.total * 100).toFixed(1) + '%');

  await c.end();
}

run().catch(e => { console.error('错误:', e.message); process.exit(1); });
