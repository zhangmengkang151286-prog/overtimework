import {supabase} from './supabase';
import {RealTimeData} from '../types';

/**
 * 每小时数据快照服务
 * 负责存储和获取每个整点的数据快照
 */

export interface HourlySnapshot {
  hour: number; // 0-23
  timestamp: Date;
  participantCount: number;
  overtimeCount: number;
  onTimeCount: number;
  tagDistribution: any[];
  dailyStatus: any[];
}

class HourlySnapshotService {
  private snapshots: Map<number, HourlySnapshot> = new Map(); // hour -> snapshot
  private snapshotInterval: NodeJS.Timeout | null = null;

  /**
   * 启动每小时快照
   * 每小时的第0分钟自动保存当前数据
   */
  startHourlySnapshot(getRealTimeData: () => RealTimeData | null) {
    // 清除之前的定时器
    if (this.snapshotInterval) {
      clearInterval(this.snapshotInterval);
    }

    // 立即保存一次当前小时的快照
    this.saveCurrentSnapshot(getRealTimeData());

    // 每分钟检查一次，如果是整点就保存快照
    this.snapshotInterval = setInterval(() => {
      const now = new Date();
      if (now.getMinutes() === 0) {
        console.log(
          '[HourlySnapshot] Saving hourly snapshot at',
          now.getHours(),
        );
        this.saveCurrentSnapshot(getRealTimeData());
      }
    }, 60 * 1000); // 每分钟检查一次
  }

  /**
   * 停止每小时快照
   */
  stopHourlySnapshot() {
    if (this.snapshotInterval) {
      clearInterval(this.snapshotInterval);
      this.snapshotInterval = null;
    }
  }

  /**
   * 保存当前数据为快照
   */
  private saveCurrentSnapshot(data: RealTimeData | null) {
    if (!data) return;

    const now = new Date();
    const hour = now.getHours();

    const snapshot: HourlySnapshot = {
      hour,
      timestamp: now,
      participantCount: data.participantCount,
      overtimeCount: data.overtimeCount,
      onTimeCount: data.onTimeCount,
      tagDistribution: data.tagDistribution,
      dailyStatus: data.dailyStatus,
    };

    this.snapshots.set(hour, snapshot);

    // 保存到本地存储
    this.saveToLocalStorage(hour, snapshot);

    console.log(`[HourlySnapshot] Saved snapshot for hour ${hour}:`, {
      participantCount: snapshot.participantCount,
      overtimeCount: snapshot.overtimeCount,
      onTimeCount: snapshot.onTimeCount,
    });
  }

  /**
   * 获取指定小时的快照
   * 如果是当前小时，返回实时数据
   * 否则从 Supabase 数据库读取
   * 如果数据库没有快照，返回空数据（0值）而不是null
   *
   * @param selectedTime - 选择的时间（Date 对象，本地时间）
   * @param currentData - 当前实时数据
   */
  async getSnapshot(
    selectedTime: Date,
    currentData: RealTimeData | null,
  ): Promise<HourlySnapshot | null> {
    const now = new Date();
    const hour = selectedTime.getHours();

    // 如果选择的时间在当前小时内（1小时范围），返回实时数据
    const timeDiff = Math.abs(now.getTime() - selectedTime.getTime());
    if (timeDiff < 60 * 60 * 1000 && currentData) {
      console.log(
        `[HourlySnapshot] Selected time is within current hour, using real-time data`,
      );
      return {
        hour,
        timestamp: now,
        participantCount: currentData.participantCount,
        overtimeCount: currentData.overtimeCount,
        onTimeCount: currentData.onTimeCount,
        tagDistribution: currentData.tagDistribution,
        dailyStatus: currentData.dailyStatus,
      };
    }

    // 从 Supabase 数据库读取
    try {
      // 使用本地时间的日期部分（YYYY-MM-DD）
      // 注意：不能使用 toISOString()，因为它会转换成 UTC 时间
      const year = selectedTime.getFullYear();
      const month = String(selectedTime.getMonth() + 1).padStart(2, '0');
      const day = String(selectedTime.getDate()).padStart(2, '0');
      const snapshotDate = `${year}-${month}-${day}`;

      console.log(
        `[HourlySnapshot] Fetching snapshot from database: date=${snapshotDate}, hour=${hour}, selectedTime=${selectedTime.toLocaleString('zh-CN', {timeZone: 'Asia/Shanghai'})}`,
      );

      const {data, error} = await supabase
        .from('hourly_snapshots')
        .select('*')
        .eq('snapshot_date', snapshotDate)
        .eq('snapshot_hour', hour)
        .maybeSingle(); // 使用 maybeSingle() 而不是 single()，避免没有数据时报错

      if (error) {
        console.error(`[HourlySnapshot] Database error:`, error);
        throw error;
      }

      if (!data) {
        console.log(
          `[HourlySnapshot] No snapshot available for ${snapshotDate} hour ${hour}, returning empty data`,
        );
        // 返回空数据而不是null，确保UI显示0值
        return {
          hour,
          timestamp: selectedTime,
          participantCount: 0,
          overtimeCount: 0,
          onTimeCount: 0,
          tagDistribution: [],
          dailyStatus: [],
        };
      }

      // 转换数据格式
      const snapshot: HourlySnapshot = {
        hour: (data as any).snapshot_hour as number,
        timestamp: new Date((data as any).snapshot_time as string),
        participantCount: (data as any).participant_count as number,
        overtimeCount: (data as any).overtime_count as number,
        onTimeCount: (data as any).on_time_count as number,
        tagDistribution: this.convertTagDistribution(
          (data as any).tag_distribution,
        ),
        dailyStatus: [], // 快照中不包含 dailyStatus
      };

      console.log(
        `[HourlySnapshot] Loaded snapshot from database for ${snapshotDate} hour ${hour}:`,
        {
          participantCount: snapshot.participantCount,
          overtimeCount: snapshot.overtimeCount,
          onTimeCount: snapshot.onTimeCount,
          tagCount: snapshot.tagDistribution.length,
        },
      );

      return snapshot;
    } catch (error) {
      console.error(
        `[HourlySnapshot] Failed to fetch snapshot for hour ${hour}:`,
        error,
      );
      // 出错时也返回空数据
      return {
        hour,
        timestamp: selectedTime,
        participantCount: 0,
        overtimeCount: 0,
        onTimeCount: 0,
        tagDistribution: [],
        dailyStatus: [],
      };
    }
  }

  /**
   * 转换标签分布数据格式
   */
  private convertTagDistribution(tagDistribution: any): any[] {
    if (!tagDistribution || !Array.isArray(tagDistribution)) {
      return [];
    }

    return tagDistribution.map((tag: any) => ({
      tagId: tag.tag_id,
      tagName: tag.tag_name,
      count: tag.total_count,
      isOvertime: tag.overtime_count > tag.on_time_count,
      color: '', // 不在这里生成颜色，由TrendPage统一分配
    }));
  }

  /**
   * 清除所有快照（新的工作日开始时调用）
   */
  clearAllSnapshots() {
    this.snapshots.clear();
    console.log('[HourlySnapshot] All snapshots cleared');
  }

  /**
   * 保存到本地存储（已废弃，现在使用 Supabase）
   */
  private async saveToLocalStorage(_hour: number, _snapshot: HourlySnapshot) {
    // 不再使用本地存储，数据存储在 Supabase
    console.log(
      `[HourlySnapshot] Local storage deprecated, using Supabase instead`,
    );
  }
}

// 导出单例
export const hourlySnapshotService = new HourlySnapshotService();
