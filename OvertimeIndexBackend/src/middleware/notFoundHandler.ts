import { Request, Response } from 'express';
import { notFoundResponse } from '../utils/response';

export function notFoundHandler(req: Request, res: Response): void {
  notFoundResponse(res, `路由 ${req.method} ${req.path} 不存在`);
}
