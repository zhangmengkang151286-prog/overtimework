const { Client } = require('pg');

const c = new Client({
  host: 'pgm-0jl4gyc9gj1z2vz0to.pg.rds.aliyuncs.com',
  port: 5432,
  database: 'overtime_index',
  user: '1126_zhangmengkang',
  password: 'Kiro@1345',
  ssl: false,
  connectionTimeoutMillis: 10000,
});

async function run() {
  await c.connect();
  console.log('✅ 数据库连接成功');

  // 检查测试用户数量
  const countRes = await c.query(
    "SELECT COUNT(*) FROM public.users WHERE phone_number ~ '^13900[0-9]{6}$' AND phone_number::bigint BETWEEN 13900000001 AND 13900000500"
  );
  console.log('测试用户数量:', countRes.rows[0].count);

  // 检查 tags 表
  const tagsRes = await c.query(
    "SELECT category, COUNT(*) FROM public.tags WHERE type = 'custom' AND is_active = true GROUP BY category"
  );
  console.log('标签分布:', tagsRes.rows);

  await c.end();
}

run().catch(e => { console.error('错误:', e.message); process.exit(1); });
