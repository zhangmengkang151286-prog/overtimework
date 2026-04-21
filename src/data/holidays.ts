/**
 * 中国法定节假日和调休数据（2025-2026）
 * 需求: 4.1, 4.2, 4.3
 */

import {HolidayInfo} from '../types/my-page';

// 2025 年中国法定节假日和调休安排
const holidays2025: HolidayInfo[] = [
  // 元旦 (1月1日放假)
  {date: '2025-01-01', name: '元旦', type: 'holiday'},

  // 春节 (1月28日-2月4日放假，1月26日、2月8日调休上班)
  {date: '2025-01-26', name: '春节调休', type: 'workday'},
  {date: '2025-01-28', name: '春节', type: 'holiday'},
  {date: '2025-01-29', name: '春节', type: 'holiday'},
  {date: '2025-01-30', name: '春节', type: 'holiday'},
  {date: '2025-01-31', name: '春节', type: 'holiday'},
  {date: '2025-02-01', name: '春节', type: 'holiday'},
  {date: '2025-02-02', name: '春节', type: 'holiday'},
  {date: '2025-02-03', name: '春节', type: 'holiday'},
  {date: '2025-02-04', name: '春节', type: 'holiday'},
  {date: '2025-02-08', name: '春节调休', type: 'workday'},

  // 清明节 (4月4日-6日放假)
  {date: '2025-04-04', name: '清明节', type: 'holiday'},
  {date: '2025-04-05', name: '清明节', type: 'holiday'},
  {date: '2025-04-06', name: '清明节', type: 'holiday'},

  // 劳动节 (5月1日-5日放假，4月27日调休上班)
  {date: '2025-04-27', name: '劳动节调休', type: 'workday'},
  {date: '2025-05-01', name: '劳动节', type: 'holiday'},
  {date: '2025-05-02', name: '劳动节', type: 'holiday'},
  {date: '2025-05-03', name: '劳动节', type: 'holiday'},
  {date: '2025-05-04', name: '劳动节', type: 'holiday'},
  {date: '2025-05-05', name: '劳动节', type: 'holiday'},

  // 端午节 (5月31日-6月2日放假)
  {date: '2025-05-31', name: '端午节', type: 'holiday'},
  {date: '2025-06-01', name: '端午节', type: 'holiday'},
  {date: '2025-06-02', name: '端午节', type: 'holiday'},

  // 中秋节+国庆节 (10月1日-8日放假，9月28日、10月11日调休上班)
  {date: '2025-09-28', name: '国庆调休', type: 'workday'},
  {date: '2025-10-01', name: '国庆节', type: 'holiday'},
  {date: '2025-10-02', name: '国庆节', type: 'holiday'},
  {date: '2025-10-03', name: '国庆节', type: 'holiday'},
  {date: '2025-10-04', name: '中秋节', type: 'holiday'},
  {date: '2025-10-05', name: '国庆节', type: 'holiday'},
  {date: '2025-10-06', name: '国庆节', type: 'holiday'},
  {date: '2025-10-07', name: '国庆节', type: 'holiday'},
  {date: '2025-10-08', name: '国庆节', type: 'holiday'},
  {date: '2025-10-11', name: '国庆调休', type: 'workday'},
];

// 2026 年中国法定节假日和调休安排（国务院办公厅 国办发明电〔2025〕7号）
const holidays2026: HolidayInfo[] = [
  // 元旦：1月1日（周四）至3日（周六）放假，1月4日（周日）上班
  {date: '2026-01-01', name: '元旦', type: 'holiday'},
  {date: '2026-01-02', name: '元旦', type: 'holiday'},
  {date: '2026-01-03', name: '元旦', type: 'holiday'},
  {date: '2026-01-04', name: '元旦调休', type: 'workday'},

  // 春节：2月15日（周日）至23日（周一）放假，2月14日（周六）、2月28日（周六）上班
  {date: '2026-02-14', name: '春节调休', type: 'workday'},
  {date: '2026-02-15', name: '春节', type: 'holiday'},
  {date: '2026-02-16', name: '春节', type: 'holiday'},
  {date: '2026-02-17', name: '春节', type: 'holiday'},
  {date: '2026-02-18', name: '春节', type: 'holiday'},
  {date: '2026-02-19', name: '春节', type: 'holiday'},
  {date: '2026-02-20', name: '春节', type: 'holiday'},
  {date: '2026-02-21', name: '春节', type: 'holiday'},
  {date: '2026-02-22', name: '春节', type: 'holiday'},
  {date: '2026-02-23', name: '春节', type: 'holiday'},
  {date: '2026-02-28', name: '春节调休', type: 'workday'},

  // 清明节：4月4日（周六）至6日（周一）放假
  {date: '2026-04-04', name: '清明节', type: 'holiday'},
  {date: '2026-04-05', name: '清明节', type: 'holiday'},
  {date: '2026-04-06', name: '清明节', type: 'holiday'},

  // 劳动节：5月1日（周五）至5日（周二）放假，5月9日（周六）上班
  {date: '2026-05-01', name: '劳动节', type: 'holiday'},
  {date: '2026-05-02', name: '劳动节', type: 'holiday'},
  {date: '2026-05-03', name: '劳动节', type: 'holiday'},
  {date: '2026-05-04', name: '劳动节', type: 'holiday'},
  {date: '2026-05-05', name: '劳动节', type: 'holiday'},
  {date: '2026-05-09', name: '劳动节调休', type: 'workday'},

  // 端午节：6月19日（周五）至21日（周日）放假
  {date: '2026-06-19', name: '端午节', type: 'holiday'},
  {date: '2026-06-20', name: '端午节', type: 'holiday'},
  {date: '2026-06-21', name: '端午节', type: 'holiday'},

  // 中秋节：9月25日（周五）至27日（周日）放假
  {date: '2026-09-25', name: '中秋节', type: 'holiday'},
  {date: '2026-09-26', name: '中秋节', type: 'holiday'},
  {date: '2026-09-27', name: '中秋节', type: 'holiday'},

  // 国庆节：10月1日（周四）至7日（周三）放假，9月20日（周日）、10月10日（周六）上班
  {date: '2026-09-20', name: '国庆调休', type: 'workday'},
  {date: '2026-10-01', name: '国庆节', type: 'holiday'},
  {date: '2026-10-02', name: '国庆节', type: 'holiday'},
  {date: '2026-10-03', name: '国庆节', type: 'holiday'},
  {date: '2026-10-04', name: '国庆节', type: 'holiday'},
  {date: '2026-10-05', name: '国庆节', type: 'holiday'},
  {date: '2026-10-06', name: '国庆节', type: 'holiday'},
  {date: '2026-10-07', name: '国庆节', type: 'holiday'},
  {date: '2026-10-10', name: '国庆调休', type: 'workday'},
];

// 合并所有节假日数据
const allHolidays: HolidayInfo[] = [...holidays2025, ...holidays2026];

/**
 * 获取指定月份的节假日信息
 * 需求: 4.1, 4.2, 4.3
 */
export function getHolidaysForMonth(
  year: number,
  month: number,
): HolidayInfo[] {
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  return allHolidays.filter((h) => h.date.startsWith(prefix));
}

export {allHolidays, holidays2025, holidays2026};
