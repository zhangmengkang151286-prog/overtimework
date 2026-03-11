import {useState, useEffect, useCallback} from 'react';
import {AuthService} from '../services/enhanced-auth/AuthService';
import {ProfileService} from '../services/enhanced-auth/ProfileService';
import {supabase} from '../services/supabase';
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
 * 使用新的增强认证系统
 */
export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const authService = AuthService.getInstance();
  const profileService = ProfileService.getInstance();

  // 初始化：检查用户登录状态
  useEffect(() => {
    const initAuth = async () => {
      try {
        setIsLoading(true);
        const currentUser = await storageService.getUser();

        if (currentUser) {
          setUser(currentUser);
          setIsAuthenticated(true);
        } else {
          // 检查 Supabase 会话
          const {
            data: {session},
          } = await supabase.auth.getSession();
          if (session?.user) {
            // 从数据库获取用户信息
            const profile = await profileService.getProfile(session.user.id);
            if (profile) {
              await storageService.saveUser(profile);
              setUser(profile);
              setIsAuthenticated(true);
            }
          }
        }
      } catch (err) {
        console.error('Init auth error:', err);
        setError('初始化认证失败');
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // 监听认证状态变化
    const {
      data: {subscription},
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        try {
          const profile = await profileService.getProfile(session.user.id);
          if (profile) {
            await storageService.saveUser(profile);
            setUser(profile);
            setIsAuthenticated(true);
          }
        } catch (err) {
          console.error('Auth state change error:', err);
        }
      } else if (event === 'SIGNED_OUT') {
        await storageService.clearUser();
        setUser(null);
        setIsAuthenticated(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
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

        const result = await authService.loginWithPhone(phoneNumber, code);

        await storageService.saveUser(result.user);
        setUser(result.user);
        setIsAuthenticated(true);

        return {isNewUser: result.isNewUser};
      } catch (err: any) {
        console.error('Sign in with phone error:', err);
        setError(err.message || '登录失败');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [authService],
  );

  // 密码登录
  const signInWithPassword = useCallback(
    async (phoneNumber: string, password: string) => {
      try {
        setIsLoading(true);
        setError(null);

        const result = await authService.loginWithPassword(
          phoneNumber,
          password,
        );

        await storageService.saveUser(result.user);
        setUser(result.user);
        setIsAuthenticated(true);
      } catch (err: any) {
        console.error('Sign in with password error:', err);
        setError(err.message || '登录失败');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [authService],
  );

  // 登出
  const signOut = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      await supabase.auth.signOut();
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

        const updatedUser = await profileService.completeProfile(
          user.id,
          profileData,
        );

        await storageService.saveUser(updatedUser);
        setUser(updatedUser);
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
      const {
        data: {session},
      } = await supabase.auth.getSession();
      if (session?.user) {
        const profile = await profileService.getProfile(session.user.id);
        if (profile) {
          await storageService.saveUser(profile);
          setUser(profile);
          setIsAuthenticated(true);
        }
      } else {
        await storageService.clearUser();
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (err) {
      console.error('Refresh user error:', err);
    }
  }, [profileService]);

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
