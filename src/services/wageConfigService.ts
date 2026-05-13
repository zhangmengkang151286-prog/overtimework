/**
 * 时薪核心模块 - 月薪配置本地存储服务
 * 仅存储月薪到 AsyncStorage，上下班时间从 user 对象读取
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {MonthlySalaryRecord} from '../types/hourly-wage';

/**
 * 生成 AsyncStorage key
 * 格式：hourly_wage:monthly_salary:{userId}
 */
function buildKey(userId: string): string {
  return `hourly_wage:monthly_salary:${userId}`;
}

/**
 * 读取用户月薪配置
 * 读取失败时返回 null（视为未配置）
 */
export async function getMonthlySalary(
  userId: string,
): Promise<MonthlySalaryRecord | null> {
  try {
    const raw = await AsyncStorage.getItem(buildKey(userId));
    if (raw == null) return null;
    return JSON.parse(raw) as MonthlySalaryRecord;
  } catch {
    // 读取失败视为未配置
    return null;
  }
}

/**
 * 写入用户月薪配置
 * 写入失败时抛出异常，由上层 UI 捕获并提示用户
 */
export async function setMonthlySalary(
  userId: string,
  salary: number,
): Promise<void> {
  const record: MonthlySalaryRecord = {
    monthlySalary: salary,
    updatedAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(buildKey(userId), JSON.stringify(record));
}
