import { Router } from 'express';
import { authController } from '../controllers/authController';
import { submissionController } from '../controllers/submissionController';
import { realtimeController } from '../controllers/realtimeController';
import { authMiddleware } from '../middleware/auth';
import { authLimiter, submissionLimiter } from '../middleware/rateLimit';

const router = Router();

// 认证路由
router.post('/auth/register/phone', authLimiter, (req, res) => authController.registerWithPhone(req, res));
router.post('/auth/login/phone', authLimiter, (req, res) => authController.loginWithPhone(req, res));
router.post('/auth/login/wechat', authLimiter, (req, res) => authController.loginWithWechat(req, res));
router.put('/auth/profile/complete', authMiddleware, (req, res) => authController.completeProfile(req, res));

// 提交路由
router.post('/submissions/today', authMiddleware, submissionLimiter, (req, res) => 
  submissionController.submitToday(req, res)
);
router.get('/submissions/today/status', authMiddleware, (req, res) => 
  submissionController.checkTodayStatus(req, res)
);

// 实时数据路由
router.get('/realtime/statistics', (req, res) => realtimeController.getStatistics(req, res));
router.get('/realtime/tags/top', (req, res) => realtimeController.getTopTags(req, res));
router.get('/history/daily', (req, res) => realtimeController.getHistory(req, res));

// API文档
router.get('/', (req, res) => {
  res.json({
    name: '打工人加班指数 API',
    version: '1.0.0',
    endpoints: {
      auth: {
        'POST /auth/register/phone': '手机号注册',
        'POST /auth/login/phone': '手机号登录',
        'POST /auth/login/wechat': '微信登录',
        'PUT /auth/profile/complete': '完善用户信息',
      },
      submissions: {
        'POST /submissions/today': '提交今日状态',
        'GET /submissions/today/status': '检查今日提交状态',
      },
      realtime: {
        'GET /realtime/statistics': '获取实时统计',
        'GET /realtime/tags/top': '获取Top标签',
        'GET /history/daily': '获取历史统计',
      },
    },
  });
});

export default router;
