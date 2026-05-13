import {useState, useEffect, useCallback} from 'react';
import {AuthService} from '../services/enhanced-auth/AuthService';
import {ProfileService} from '../services/enhanced-auth/ProfileService';
import {storageService} from '../services/storage';
import {User} from '../types';

interface UseAuthReturn {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signInWithPhone: (
    phoneNumber: string,
    code: string,
  ) => Promise<{isNewUser: boolean}>;
  signInWithPassword: (phoneNumber: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  completeProfile: (profileData: any) => Promise<void>;
  refreshUser: () => Promise<void>;
  error: string | null;
}

/**
 * 认证 Hook (增强版)
 * 使用自定义认证系统，不依赖 Supabase Auth
 */
export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const profileService = ProfileService.getInstance();

  // 初始化：从本地存储恢复登录状态
  useEffect(() => {
    const initAuth = async () => {
      try {
        setIsLoading(true);
        const currentUser = await storageService.getUser();

        if (currentUser) {
          setUser(currentUser);
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.error('Init auth error:', err);
        setError('初始化认证失败');
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // 手机号验证码登录
  const signInWithPhone = useCallback(
    async (
      phoneNumber: string,
      code: string,
    ): Promise<{isNewUser: boolean}> => {
      try {
        setIsLoading(true);
        setError(null);

        const result = await AuthService.loginWithPhone(phoneNumber, code);

        if (!result.success || !result.user) {
          throw new Error(result.error || '登录失败');
        }

        await storageService.saveUser(result.user as User);
        setUser(result.user as User);
        setIsAuthenticated(true);

        return {isNewUser: result.isNewUser ?? false};
      } catch (err: any) {
        console.error('Sign in with phone error:', err);
        setError(err.message || '登录失败');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  // 密码登录
  const signInWithPassword = useCallback(
    async (phoneNumber: string, password: string) => {
      try {
        setIsLoading(true);
        setError(null);

        const result = await AuthService.loginWithPassword(
          phoneNumber,
          password,
        );

        if (!result.success || !result.user) {
          throw new Error(result.error || '登录失败');
        }

        await storageService.saveUser(result.user as User);
        setUser(result.user as User);
        setIsAuthenticated(true);
      } catch (err: any) {
        console.error('Sign in with password error:', err);
        setError(err.message || '登录失败');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  // 登出
  const signOut = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // 清除所有用户相关数据（包括状态缓存）
      await storageService.logout();

      setUser(null);
      setIsAuthenticated(false);
    } catch (err: any) {
      console.error('Sign out error:', err);
      setError(err.message || '登出失败');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 完善用户信息
  const completeProfile = useCallback(
    async (profileData: any) => {
      try {
        setIsLoading(true);
        setError(null);

        if (!user) {
          throw new Error('用户未登录');
        }

        await profileService.completeProfile(user.id, profileData);

        // 重新获取用户信息
        const updatedUser = await AuthService.getCurrentUser(user.id);
        if (updatedUser) {
          await storageService.saveUser(updatedUser as User);
          setUser(updatedUser as User);
        }
      } catch (err: any) {
        console.error('Complete profile error:', err);
        setError(err.message || '完善信息失败');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [user, profileService],
  );

  // 刷新用户信息
  const refreshUser = useCallback(async () => {
    try {
      if (!user) return;

      const updatedUser = await AuthService.getCurrentUser(user.id);
      if (updatedUser) {
        await storageService.saveUser(updatedUser as User);
        setUser(updatedUser as User);
        setIsAuthenticated(true);
      } else {
        // 用户不存在了，清除本地状态
        await storageService.clearUser();
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (err) {
      console.error('Refresh user error:', err);
    }
  }, [user]);

  return {
    user,
    isLoading,
    isAuthenticated,
    signInWithPhone,
    signInWithPassword,
    signOut,
    completeProfile,
    refreshUser,
    error,
  };
};
