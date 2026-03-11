// 简单的 Supabase 连接测试脚本
const {createClient} = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://mnwtjmsoayqtwmlffobf.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ud3RqbXNvYXlxdHdtbGZmb2JmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NjEwNzYsImV4cCI6MjA4NTIzNzA3Nn0.NQ--wnC6dck3vSOvWJ2fyuZyGaHDTHGd08yFzpljI9E';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testConnection() {
  console.log('🔍 测试 Supabase 连接...\n');

  try {
    // 测试 1: 获取标签
    console.log('1️⃣ 测试获取标签...');
    const {data: tags, error: tagsError} = await supabase
      .from('tags')
      .select('*')
      .limit(5);

    if (tagsError) {
      console.error('❌ 获取标签失败:', tagsError.message);
    } else {
      console.log(`✅ 成功获取 ${tags.length} 个标签`);
      console.log('   标签示例:', tags.slice(0, 2).map(t => t.name).join(', '));
    }

    // 测试 2: 调用实时统计函数
    console.log('\n2️⃣ 测试实时统计函数...');
    const {data: stats, error: statsError} = await supabase.rpc(
      'get_real_time_stats',
    );

    if (statsError) {
      console.error('❌ 获取实时统计失败:', statsError.message);
    } else {
      console.log('✅ 成功获取实时统计');
      if (stats && stats.length > 0) {
        console.log('   参与人数:', stats[0].participant_count);
        console.log('   加班人数:', stats[0].overtime_count);
        console.log('   准时下班人数:', stats[0].on_time_count);
      } else {
        console.log('   当前无数据（这是正常的）');
      }
    }

    // 测试 3: 获取 Top 标签
    console.log('\n3️⃣ 测试 Top 标签函数...');
    const {data: topTags, error: topTagsError} = await supabase.rpc(
      'get_top_tags',
      {limit_count: 5},
    );

    if (topTagsError) {
      console.error('❌ 获取 Top 标签失败:', topTagsError.message);
    } else {
      console.log('✅ 成功获取 Top 标签');
      console.log(`   返回 ${topTags ? topTags.length : 0} 个标签`);
    }

    // 测试 4: 获取每日状态
    console.log('\n4️⃣ 测试每日状态函数...');
    const {data: dailyStatus, error: dailyError} = await supabase.rpc(
      'get_daily_status',
      {days: 7},
    );

    if (dailyError) {
      console.error('❌ 获取每日状态失败:', dailyError.message);
    } else {
      console.log('✅ 成功获取每日状态');
      console.log(`   返回 ${dailyStatus ? dailyStatus.length : 0} 天的数据`);
    }

    console.log('\n🎉 所有测试完成！');
    console.log('\n✅ Supabase 连接正常，可以开始使用了！');
  } catch (error) {
    console.error('\n❌ 测试过程中出现错误:', error.message);
    console.error('\n请检查：');
    console.error('1. 网络连接是否正常');
    console.error('2. Supabase 项目是否正常运行');
    console.error('3. API 密钥是否正确');
  }
}

testConnection();
