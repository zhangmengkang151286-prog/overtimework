import * as Notifications from 'expo-notifications';
import {storageService} from '../services/storage';

// 提醒设置的存储键（与 SettingsScreen 保持一致）
const REMINDER_KEY = '@OvertimeIndexApp:dailyReminder';

/**
 * 用户提交状态后调用：取消今天的通知
 * 下次工作日重置时会自动重新调度
 */
export const cancelTodayReminder = async (): Promise<void> => {
  try {
    const reminderEnabled = await storageService.getItem<boolean>(REMINDER_KEY);
    if (!reminderEnabled) return;

    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('[通知] 用户已提交状态，取消今天的提醒');
  } catch (error) {
    console.warn('[通知] 取消通知失败:', error);
  }
};

/**
 * 重新调度每日提醒通知
 * 在工作日重置时调用（每天 06:00），确保新的一天有通知
 */
export const rescheduleDailyReminder = async (workEndTime?: string): Promise<void> => {
  try {
    const reminderEnabled = await storageService.getItem<boolean>(REMINDER_KEY);
    if (!reminderEnabled) return;

    const endTime = workEndTime || '18:00';
    const [hours, minutes] = endTime.split(':').map(Number);

    // 先取消旧的，再重新调度
    await Notifications.cancelAllScheduledNotificationsAsync();

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '下班状态更新提醒',
        body: '今天的工作结束了，记得更新你的下班状态哦',
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: hours,
        minute: minutes,
      },
    });

    console.log('[通知] 工作日重置，已调度今天的提醒:', endTime);
  } catch (error) {
    console.warn('[通知] 调度通知失败:', error);
  }
};
