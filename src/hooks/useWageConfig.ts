/**
 * 时薪核心模块 - 薪资配置 Hook
 * 从 Redux userSlice 读取月薪 + 上下班时间，合成 WageConfig
 * 这样个人信息编辑保存后 dispatch updateUserInfo 能立即生效
 */

import {useMemo} from 'react';
import {WageConfig} from '../types/hourly-wage';
import {useAppSelector} from './redux';

export interface UseWageConfigReturn {
  /** 合成后的配置，null 表示用户信息不完整 */
  config: WageConfig | null;
  /** 是否正在加载（始终为 false，数据来自已加载的 user 对象） */
  isLoading: boolean;
}

/**
 * 薪资配置 Hook
 * 从 Redux store 中读取月薪、上下班时间
 */
export function useWageConfig(_userId: string): UseWageConfigReturn {
  const currentUser = useAppSelector((state) => state.user.currentUser);

  const config: WageConfig | null = useMemo(() => {
    if (!currentUser) return null;
    const {monthlySalary, workStartTime, workEndTime} = currentUser;
    if (!monthlySalary || monthlySalary <= 0) return null;
    if (!workStartTime || !workEndTime) return null;
    return {monthlySalary, workStartTime, workEndTime};
  }, [currentUser]);

  return {config, isLoading: false};
}
