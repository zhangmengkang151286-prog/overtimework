import { Response } from 'express';
import { AuthRequest } from '../types';
import { submissionService } from '../services/submissionService';
import { successResponse, errorResponse } from '../utils/response';

export class SubmissionController {
  // 提交今日状态
  async submitToday(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { status, overtimeHours, tagIds } = req.body;

      if (!status || !['on_time', 'overtime'].includes(status)) {
        errorResponse(res, 'VALIDATION_ERROR', '无效的状态值');
        return;
      }

      if (status === 'overtime' && !overtimeHours) {
        errorResponse(res, 'VALIDATION_ERROR', '加班需要提供加班时长');
        return;
      }

      const submission = await submissionService.submitTodayStatus(
        userId,
        status,
        overtimeHours,
        tagIds
      );

      successResponse(res, {
        submissionId: submission.id,
        submittedAt: submission.submitted_at,
      }, 201);
    } catch (error: any) {
      if (error.message === '今日已提交状态') {
        errorResponse(res, 'ALREADY_SUBMITTED', error.message, 400);
      } else {
        errorResponse(res, 'SUBMISSION_ERROR', error.message);
      }
    }
  }

  // 检查今日提交状态
  async checkTodayStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const result = await submissionService.checkTodaySubmission(userId);
      
      successResponse(res, result);
    } catch (error: any) {
      errorResponse(res, 'CHECK_ERROR', error.message);
    }
  }
}

export const submissionController = new SubmissionController();
