/**
 * 判断今天是否为休息日（周末或法定节假日）
 * 复用 src/data/holidays.ts 的数据
 */

import {useMemo} from 'react';
import {allHolidays} from '../data/holidays';

export function useIsTodayHoliday(): boolean {
  return useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=周日, 6=周六

    // 格式化为 YYYY-MM-DD
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    // 检查是否为调休工作日（周末但需要上班）
    const holidayEntry = allHolidays.find(h => h.date === dateStr);
    if (holidayEntry) {
      if (holidayEntry.type === 'workday') {
        // 调休上班日，不是休息日
        return false;
      }
      // 法定节假日
      return true;
    }

    // 普通周末
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return true;
    }

    return false;
  }, []);
}
