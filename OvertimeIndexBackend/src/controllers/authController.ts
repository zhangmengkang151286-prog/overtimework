import { Request, Response } from 'express';
import { authService } from '../services/authService';
import { successResponse, errorResponse } from '../utils/response';

export class AuthController {
  // 手机号注册
  async registerWithPhone(req: Request, res: Response): Promise<void> {
    try {
      const { phone, password, username } = req.body;

      if (!phone || !password || !username) {
        errorResponse(res, 'VALIDATION_ERROR', '缺少必需参数');
        return;
      }

      const result = await authService.registerWithPhone(phone, password, username);
      
      successResponse(res, {
        userId: result.user.id,
        token: result.token,
        needsProfile: !result.user.profile_complete,
      }, 201);
    } catch (error: any) {
      errorResponse(res, 'REGISTER_ERROR', error.message);
    }
  }

  // 手机号登录
  async loginWithPhone(req: Request, res: Response): Promise<void> {
    try {
      const { phone, password } = req.body;

      if (!phone || !password) {
        errorResponse(res, 'VALIDATION_ERROR', '缺少必需参数');
        return;
      }

      const result = await authService.loginWithPhone(phone, password);
      
      successResponse(res, {
        userId: result.user.id,
        token: result.token,
        needsProfile: !result.user.profile_complete,
      });
    } catch (error: any) {
      errorResponse(res, 'LOGIN_ERROR', error.message, 401);
    }
  }

  // 微信登录
  async loginWithWechat(req: Request, res: Response): Promise<void> {
    try {
      const { code, userInfo } = req.body;

      // 这里应该调用微信API验证code，获取openid
      // 简化处理，直接使用code作为openid
      const openid = code;
      const username = userInfo?.nickname || '微信用户';
      const avatarUrl = userInfo?.avatarUrl;

      const result = await authService.loginWithWechat(openid, username, avatarUrl);
      
      successResponse(res, {
        userId: result.user.id,
        token: result.token,
        needsProfile: !result.user.profile_complete,
        isNew: result.isNew,
      });
    } catch (error: any) {
      errorResponse(res, 'WECHAT_LOGIN_ERROR', error.message);
    }
  }

  // 完善用户信息
  async completeProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const profileData = req.body;

      const user = await authService.completeProfile(userId, profileData);
      
      successResponse(res, {
        userId: user.id,
        profileComplete: true,
      });
    } catch (error: any) {
      errorResponse(res, 'PROFILE_ERROR', error.message);
    }
  }
}

export const authController = new AuthController();
