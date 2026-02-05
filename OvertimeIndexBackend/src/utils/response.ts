import { Response } from 'express';
import { ApiResponse } from '../types';

export function successResponse<T>(res: Response, data: T, statusCode: number = 200): Response {
  const response: ApiResponse<T> = {
    success: true,
    data,
  };
  return res.status(statusCode).json(response);
}

export function errorResponse(
  res: Response,
  code: string,
  message: string,
  statusCode: number = 400
): Response {
  const response: ApiResponse = {
    success: false,
    error: {
      code,
      message,
    },
  };
  return res.status(statusCode).json(response);
}

export function notFoundResponse(res: Response, message: string = '资源未找到'): Response {
  return errorResponse(res, 'NOT_FOUND', message, 404);
}

export function unauthorizedResponse(res: Response, message: string = '未授权'): Response {
  return errorResponse(res, 'UNAUTHORIZED', message, 401);
}

export function forbiddenResponse(res: Response, message: string = '禁止访问'): Response {
  return errorResponse(res, 'FORBIDDEN', message, 403);
}

export function validationErrorResponse(res: Response, message: string): Response {
  return errorResponse(res, 'VALIDATION_ERROR', message, 400);
}

export function serverErrorResponse(res: Response, message: string = '服务器错误'): Response {
  return errorResponse(res, 'SERVER_ERROR', message, 500);
}
