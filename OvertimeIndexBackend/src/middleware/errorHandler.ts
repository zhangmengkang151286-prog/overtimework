import { Request, Response, NextFunction } from 'express';
import { serverErrorResponse } from '../utils/response';

export function errorHandler(
  error: Error,
  _req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('错误:', error);
  
  // 如果响应已经发送，交给默认错误处理器
  if (res.headersSent) {
    return next(error);
  }
  
  serverErrorResponse(res, error.message || '服务器内部错误');
}
