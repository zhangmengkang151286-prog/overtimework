import rateLimit from 'express-rate-limit';

// 通用限流：每15分钟100个请求
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: '请求过于频繁，请稍后再试',
  standardHeaders: true,
  legacyHeaders: false,
});

// 认证限流：每15分钟5个请求
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: '登录尝试过多，请15分钟后再试',
  standardHeaders: true,
  legacyHeaders: false,
});

// 提交限流：每天1个请求
export const submissionLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 1,
  message: '今日已提交状态',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // 使用用户ID作为key
    return (req as any).user?.id?.toString() || req.ip;
  },
});
