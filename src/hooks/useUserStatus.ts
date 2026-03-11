import {useEffect, useState, useCallback} from 'react';
import {useAppDispatch, useAppSelector} from './redux';
import {
  setUserSubmission,
  resetDailyStatus,
  setError,
} from '../store/slices/userSlice';
import {resetDailyData} from '../store/slices/dataSlice';
import {supabaseService} from '../services/supabaseService';
import {offlineQueueService} from '../services/offlineQueueService';
import {storageService} from '../services/storage';
import {UserStatusSubmission, UserStatus} from '../types';
import NetInfo from '@react-native-community/netinfo';

/**
 * 获取当前工作日日期字符串（YYYY-MM-DD）
 * 工作日定义：06:00 - 次日 05:59
 * 凌晨 00:00-05:59 算前一天的工作日
 */
const getWorkDate = (): string => {
  const now = new Date();
  const hour = now.getHours();
  if (hour < 6) {
    // 凌晨0-5点，算前一天的工作日
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  }
  return now.toISOString().split('T')[0];
};

/**
 * 用户状态管理Hook
 * 处理用户状态提交、本地存储和工作日周期重置逻辑
 * 工作日周期：当天06:00 - 次日05:59，每个周期只能提交一次
 *
 * 注意：本地存储的状态 key 绑定用户 ID，避免不同用户共享状态
 */
export const useUserStatus = () => {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector(state => state.user.currentUser);
  const userStatus = useAppSelector(state => state.user.userStatus);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * 获取当前用户专属的存储 key 前缀
   */
  const getUserStorageKey = useCallback(
    (suffix: string): string => {
      const userId = currentUser?.id || 'anonymous';
      return `@OvertimeIndexApp:${userId}:${suffix}`;
    },
    [currentUser?.id],
  );

  /**
   * 检查是否需要工作日周期重置
   * 当工作日切换时（每天06:00），重置提交状态
   */
  const checkDailyReset = useCallback(async () => {
    const currentWorkDate = getWorkDate();

    // 使用用户专属 key，避免不同用户共享重置日期
    const resetDateKey = getUserStorageKey('lastResetDate');
    const storedResetDate = await storageService.getItem<string>(resetDateKey);

    if (storedResetDate !== currentWorkDate) {
      console.log('工作日切换，执行重置... 当前工作日:', currentWorkDate);

      // 执行重置
      dispatch(resetDailyStatus());
      dispatch(resetDailyData());

      // 保存新的工作日（用户专属 key）
      await storageService.setItem(resetDateKey, currentWorkDate);

      // 清除本地存储的用户状态（用户专属 key）
      const statusKey = getUserStorageKey('userStatus');
      await storageService.setItem(statusKey, {
        hasSubmittedToday: false,
      });
    }
  }, [dispatch, getUserStorageKey]);

  /**
   * 从本地存储恢复用户状态
   * 使用工作日周期判断：提交记录属于当前工作日才恢复
   * 状态 key 绑定用户 ID，不同用户互不影响
   */
  const restoreUserStatus = useCallback(async () => {
    // 如果没有登录用户，重置状态
    if (!currentUser?.id) {
      dispatch(resetDailyStatus());
      return;
    }

    const statusKey = getUserStorageKey('userStatus');
    const storedStatus = await storageService.getItem<UserStatus>(statusKey);

    // 兼容旧版：如果用户专属 key 没有数据，也检查旧的全局 key
    const statusToCheck =
      storedStatus || (await storageService.getUserStatus());

    if (statusToCheck && statusToCheck.lastSubmission?.timestamp) {
      // 计算提交时间对应的工作日
      const submissionTime = new Date(statusToCheck.lastSubmission.timestamp);
      const submissionHour = submissionTime.getHours();
      let submissionWorkDate: string;
      if (submissionHour < 6) {
        const prev = new Date(submissionTime);
        prev.setDate(prev.getDate() - 1);
        submissionWorkDate = prev.toISOString().split('T')[0];
      } else {
        submissionWorkDate = submissionTime.toISOString().split('T')[0];
      }

      const currentWorkDate = getWorkDate();

      if (submissionWorkDate === currentWorkDate) {
        // 属于当前工作日周期，恢复提交状态
        dispatch(setUserSubmission(statusToCheck.lastSubmission as any));
      } else {
        // 不属于当前工作日，重置状态
        dispatch(resetDailyStatus());
      }
    } else {
      // 没有存储的状态，确保重置
      dispatch(resetDailyStatus());
    }
  }, [dispatch, currentUser?.id, getUserStorageKey]);

  /**
   * 提交用户状态
   * 每个工作日周期（06:00-次日05:59）只能提交一次，不可撤回
   */
  const submitUserStatus = useCallback(
    async (submission: UserStatusSubmission) => {
      // 临时解决方案：如果没有登录用户，使用临时ID
      let userId = currentUser?.id;
      if (!userId) {
        // 生成或获取临时用户ID
        const tempUserId = await storageService.getItem<string>(
          '@OvertimeIndexApp:tempUserId',
        );
        if (tempUserId) {
          userId = tempUserId;
        } else {
          userId = `temp_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
          await storageService.setItem('@OvertimeIndexApp:tempUserId', userId);
          console.log('创建临时用户ID:', userId);
        }
      }

      setIsSubmitting(true);

      // 使用工作日日期作为提交日期
      const workDate = getWorkDate();

      try {
        // 检查网络状态
        const netInfo = await NetInfo.fetch();

        if (netInfo.isConnected) {
          // 在线：主标签提交
          await supabaseService.submitUserStatus({
            user_id: userId,
            date: workDate,
            is_overtime: submission.isOvertime,
            tag_id: submission.tagId,
            overtime_hours: submission.overtimeHours,
          });

          // 多选标签：每个标签单独插入一条记录
          if (submission.extraTagIds && submission.extraTagIds.length > 0) {
            await Promise.all(
              submission.extraTagIds.map(extraTagId =>
                supabaseService.submitUserStatus({
                  user_id: userId,
                  date: workDate,
                  is_overtime: submission.isOvertime,
                  tag_id: extraTagId,
                  overtime_hours: submission.overtimeHours,
                }),
              ),
            );
          }
        } else {
          // 离线：添加到队列
          await offlineQueueService.addToQueue('submitStatus', {
            userId: userId,
            isOvertime: submission.isOvertime,
            tagId: submission.tagId,
            overtimeHours: submission.overtimeHours,
            date: workDate,
          });
          console.log('状态已添加到离线队列');
        }

        // 序列化 submission（将 Date 转为字符串）
        const serializedSubmission = {
          ...submission,
          timestamp: submission.timestamp.toISOString(),
        };

        // 更新Redux状态（使用序列化后的数据）
        dispatch(setUserSubmission(serializedSubmission as any));

        // 保存到本地存储（使用用户专属 key）
        const statusKey = getUserStorageKey('userStatus');
        await storageService.setItem(statusKey, {
          hasSubmittedToday: true,
          lastSubmission: serializedSubmission as any,
        });

        console.log('User status submitted successfully');
        return true;
      } catch (error) {
        console.error('Failed to submit user status:', error);
        dispatch(
          setError(
            error instanceof Error ? error.message : '提交状态失败，请重试',
          ),
        );
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [currentUser, dispatch, getUserStorageKey],
  );

  /**
   * 初始化：检查每日重置和恢复用户状态
   */
  useEffect(() => {
    checkDailyReset();
    restoreUserStatus();
  }, [checkDailyReset, restoreUserStatus]);

  /**
   * 设置定时器，每分钟检查工作日是否切换
   * 到达06:00时自动重置提交状态
   */
  useEffect(() => {
    const checkResetInterval = setInterval(() => {
      checkDailyReset();
    }, 60 * 1000);

    return () => clearInterval(checkResetInterval);
  }, [checkDailyReset]);

  return {
    userStatus,
    isSubmitting,
    submitUserStatus,
    // 当前工作日周期内未提交才显示提交按钮
    shouldShowSelector: !userStatus.hasSubmittedToday,
  };
};
