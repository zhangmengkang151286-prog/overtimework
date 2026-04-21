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
import {cancelTodayReminder, rescheduleDailyReminder} from '../utils/notificationHelper';

/**
 * 获取指定 Date 在北京时间下的 { year, month, day, hour }
 * 使用 Intl.DateTimeFormat 确保无论手机时区如何，都能正确转换
 */
const getBeijingDateParts = (date: Date) => {
  const fmt = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
  });
  const parts = fmt.formatToParts(date);
  const get = (type: string) => parseInt(parts.find(p => p.type === type)?.value ?? '0', 10);
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour'),
  };
};

/**
 * 将 Date 格式化为北京时间的 YYYY-MM-DD 字符串
 */
const toBeijingDateString = (date: Date): string => {
  const {year, month, day} = getBeijingDateParts(date);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

/**
 * 获取当前工作日日期字符串（YYYY-MM-DD，北京时间）
 * 工作日定义：06:00 - 次日 05:59
 * 凌晨 00:00-05:59 算前一天的工作日
 */
const getWorkDate = (): string => {
  const now = new Date();
  const {hour} = getBeijingDateParts(now);
  if (hour < 6) {
    // 北京时间凌晨0-5点，算前一天的工作日
    // 往前推24小时再取北京日期，避免跨天边界问题
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    return toBeijingDateString(yesterday);
  }
  return toBeijingDateString(now);
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

      // 新的一天，重新调度每日提醒通知
      const endTime = currentUser?.workEndTime || '18:00';
      rescheduleDailyReminder(endTime);
    }
  }, [dispatch, getUserStorageKey, currentUser?.workEndTime]);

  /**
   * 从本地存储恢复用户状态
   * 使用工作日周期判断：提交记录属于当前工作日才恢复
   * 状态 key 绑定用户 ID，不同用户互不影响
   *
   * 增加服务端校验：本地缓存显示已提交时，向服务端确认记录是否存在
   * 防止数据库记录被删除后前端仍显示"已提交"
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
      const {hour: submissionHour} = getBeijingDateParts(submissionTime);
      let submissionWorkDate: string;
      if (submissionHour < 6) {
        const prev = new Date(submissionTime.getTime() - 24 * 60 * 60 * 1000);
        submissionWorkDate = toBeijingDateString(prev);
      } else {
        submissionWorkDate = toBeijingDateString(submissionTime);
      }

      const currentWorkDate = getWorkDate();

      if (submissionWorkDate === currentWorkDate) {
        // 本地缓存属于当前工作日，先恢复状态（乐观显示）
        dispatch(setUserSubmission(statusToCheck.lastSubmission as any));

        // 异步向服务端校验记录是否真的存在
        try {
          const serverRecord = await supabaseService.getUserWorkDateStatus(
            currentUser.id,
            currentWorkDate,
          );
          if (!serverRecord) {
            // 服务端无记录，说明数据已被删除，重置本地状态
            console.log('服务端无当日记录，重置本地提交状态');
            dispatch(resetDailyStatus());
            await storageService.setItem(statusKey, {
              hasSubmittedToday: false,
            });
          }
        } catch (error) {
          // 网络异常时保持本地状态不变，避免误重置
          console.warn('服务端校验失败，保持本地状态:', error);
        }
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

      // 使用工作日日期作为提交日期
      const workDate = getWorkDate();

      // 乐观更新：在任何异步操作之前立即更新 UI，零延迟响应
      const optimisticSubmission = {
        ...submission,
        timestamp: submission.timestamp.toISOString(),
      };
      dispatch(setUserSubmission(optimisticSubmission as any));
      setIsSubmitting(true);

      try {
        // 使用 NetInfo 缓存值（不 await，避免阻塞）
        const netState = NetInfo.fetch();

        // 先保存到本地存储（不 await，后台执行）
        const statusKey = getUserStorageKey('userStatus');
        storageService.setItem(statusKey, {
          hasSubmittedToday: true,
          lastSubmission: optimisticSubmission as any,
        });

        // 等待网络状态（此时 UI 已更新，用户感知不到这个等待）
        const resolvedNetState = await netState;

        if (resolvedNetState.isConnected) {
          // 提交到服务器
          const submitPromises: Promise<any>[] = [];

          if (submission.tagId) {
            // 有标签：提交主标签记录
            submitPromises.push(
              supabaseService.submitUserStatus({
                user_id: userId,
                date: workDate,
                is_overtime: submission.isOvertime,
                tag_id: submission.tagId,
                overtime_hours: submission.overtimeHours,
              }),
            );

            // 提交额外标签
            if (submission.extraTagIds && submission.extraTagIds.length > 0) {
              submission.extraTagIds.forEach(extraTagId => {
                submitPromises.push(
                  supabaseService.submitUserStatus({
                    user_id: userId,
                    date: workDate,
                    is_overtime: submission.isOvertime,
                    tag_id: extraTagId,
                    overtime_hours: submission.overtimeHours,
                  }),
                );
              });
            }
          } else {
            // 无标签：提交一条无标签记录
            submitPromises.push(
              supabaseService.submitUserStatus({
                user_id: userId,
                date: workDate,
                is_overtime: submission.isOvertime,
                tag_id: undefined,
                overtime_hours: submission.overtimeHours,
              }),
            );
          }

          await Promise.all(submitPromises);
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

        // 提交成功，取消今天的提醒通知（用户已提交，不需要再提醒）
        cancelTodayReminder();

        console.log('User status submitted successfully');
        return true;
      } catch (error) {
        // 提交失败：回滚乐观更新
        dispatch(resetDailyStatus());
        console.error('Failed to submit user status:', error);

        // 区分错误类型，传递给调用方
        const errorMsg =
          error instanceof Error ? error.message : '提交状态失败，请重试';
        dispatch(setError(errorMsg));
        return errorMsg;
      } finally {
        setIsSubmitting(false);
      }
    },
    [currentUser, dispatch, getUserStorageKey],
  );

  /**
   * 初始化：检查每日重置和恢复用户状态
   * 只在 currentUser.id 变化时重新执行，避免函数引用变化导致重复触发
   */
  useEffect(() => {
    checkDailyReset();
    restoreUserStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

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
