import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import routes from './routes';
import { connectDatabase } from './database/connection';
import { connectRedis } from './cache/redis';
import { startDailyResetJob } from './jobs/dailyReset';

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const API_VERSION = process.env.API_VERSION || 'v1';

// 中间件
app.use(helmet()); // 安全头
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true
}));
app.use(compression()); // 响应压缩
app.use(express.json()); // JSON解析
app.use(express.urlencoded({ extended: true })); // URL编码解析
app.use(morgan('combined')); // 日志

// 健康检查
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API路由
app.use(`/${API_VERSION}`, routes);

// 404处理
app.use(notFoundHandler);

// 错误处理
app.use(errorHandler);

// 启动服务器
async function startServer() {
  try {
    const isDemoMode = process.env.DEMO_MODE === 'true';
    
    if (!isDemoMode) {
      // 连接数据库 (生产模式)
      try {
        await connectDatabase();
        console.log('✅ 数据库连接成功');
      } catch (error) {
        console.warn('⚠️  数据库连接失败');
        console.warn('   提示: 设置环境变量 DEMO_MODE=true 可以跳过数据库连接');
        console.warn('   参考文档: SETUP_DATABASE.md');
        throw error;
      }

      // 连接Redis (生产模式)
      try {
        await connectRedis();
        console.log('✅ Redis连接成功');
      } catch (error) {
        console.warn('⚠️  Redis连接失败，将不使用缓存');
      }

      // 启动定时任务
      startDailyResetJob();
      console.log('✅ 定时任务启动成功');
    } else {
      console.log('🎭 演示模式 - 跳过数据库和Redis连接');
      console.log('   注意: API调用将返回模拟数据');
    }

    // 启动HTTP服务器
    app.listen(PORT, () => {
      console.log('');
      console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
      console.log(`📚 API文档: http://localhost:${PORT}/${API_VERSION}`);
      console.log(`🏥 健康检查: http://localhost:${PORT}/health`);
      console.log('');
      if (isDemoMode) {
        console.log('💡 当前为演示模式，如需完整功能请:');
        console.log('   1. 安装PostgreSQL和Redis');
        console.log('   2. 移除环境变量 DEMO_MODE');
        console.log('   3. 参考文档: SETUP_DATABASE.md');
      }
    });
  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
}

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('收到SIGTERM信号，正在关闭服务器...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('收到SIGINT信号，正在关闭服务器...');
  process.exit(0);
});

startServer();

export default app;
