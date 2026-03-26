/**
 * achievementPosterService 单元测试
 *
 * 测试内容：
 * - 边界值（0%、50%、100%）
 * - 文案池配置完整性（每档至少 3 条）
 * - 未打卡回退逻辑
 *
 * Requirements: 3.5, 4.4
 */

import {
  selectIllustration,
  selectCaption,
  getCaptionTier,
  getPercentageColor,
  formatPercentage,
  formatParticipantCount,
  computeOffWorkTime,
  calculateRankFromTimes,
  serialize,
  deserialize,
} from '../../services/achievementPosterService';

import {
  ONTIME_ILLUSTRATIONS,
  OVERTIME_ILLUSTRATIONS,
  CAPTIONS,
  CaptionTier,
  OVERTIME_PERCENTAGE_COLOR,
  ONTIME_PERCENTAGE_COLOR,
} from '../../types/achievement-poster';

// ============================================================
// 边界值测试
// ============================================================

describe('边界值测试', () => {
  describe('selectIllustration 边界值', () => {
    it('0% 应从 overtime 池选取', () => {
      const result = selectIllustration(0);
      expect(OVERTIME_ILLUSTRATIONS).toContain(result);
    });

    it('50% 应从 overtime 池选取（≤50%）', () => {
      const result = selectIllustration(50);
      expect(OVERTIME_ILLUSTRATIONS).toContain(result);
    });

    it('100% 应从 ontime 池选取', () => {
      const result = selectIllustration(100);
      expect(ONTIME_ILLUSTRATIONS).toContain(result);
    });
  });

  describe('selectCaption 边界值', () => {
    it('0% 应属于 overtimeHigh 分档', () => {
      expect(getCaptionTier(0)).toBe('overtimeHigh');
      const caption = selectCaption(0);
      expect(CAPTIONS.overtimeHigh).toContain(caption);
    });

    it('30% 应属于 overtimeLow 分档（≥30%）', () => {
      expect(getCaptionTier(30)).toBe('overtimeLow');
      const caption = selectCaption(30);
      expect(CAPTIONS.overtimeLow).toContain(caption);
    });

    it('50% 应属于 ontimeMid 分档（≥50%）', () => {
      expect(getCaptionTier(50)).toBe('ontimeMid');
      const caption = selectCaption(50);
      expect(CAPTIONS.ontimeMid).toContain(caption);
    });

    it('70% 应属于 ontimeHigh 分档（≥70%）', () => {
      expect(getCaptionTier(70)).toBe('ontimeHigh');
      const caption = selectCaption(70);
      expect(CAPTIONS.ontimeHigh).toContain(caption);
    });

    it('100% 应属于 ontimeHigh 分档', () => {
      expect(getCaptionTier(100)).toBe('ontimeHigh');
      const caption = selectCaption(100);
      expect(CAPTIONS.ontimeHigh).toContain(caption);
    });

    it('29.9% 应属于 overtimeHigh 分档（<30%）', () => {
      expect(getCaptionTier(29.9)).toBe('overtimeHigh');
    });

    it('49.9% 应属于 overtimeLow 分档（<50%）', () => {
      expect(getCaptionTier(49.9)).toBe('overtimeLow');
    });

    it('69.9% 应属于 ontimeMid 分档（<70%）', () => {
      expect(getCaptionTier(69.9)).toBe('ontimeMid');
    });
  });

  describe('getPercentageColor 边界值', () => {
    it('0% 应返回红色', () => {
      expect(getPercentageColor(0)).toBe(OVERTIME_PERCENTAGE_COLOR);
    });

    it('50% 应返回红色（≤50%）', () => {
      expect(getPercentageColor(50)).toBe(OVERTIME_PERCENTAGE_COLOR);
    });

    it('50.1% 应返回白色（>50%）', () => {
      expect(getPercentageColor(50.1)).toBe(ONTIME_PERCENTAGE_COLOR);
    });

    it('100% 应返回白色', () => {
      expect(getPercentageColor(100)).toBe(ONTIME_PERCENTAGE_COLOR);
    });
  });

  describe('formatPercentage 边界值', () => {
    it('0 应格式化为 "0%"', () => {
      expect(formatPercentage(0)).toBe('0%');
    });

    it('50 应格式化为 "50%"', () => {
      expect(formatPercentage(50)).toBe('50%');
    });

    it('100 应格式化为 "100%"', () => {
      expect(formatPercentage(100)).toBe('100%');
    });

    it('50.4 应四舍五入为 "50%"', () => {
      expect(formatPercentage(50.4)).toBe('50%');
    });

    it('50.5 应四舍五入为 "51%"', () => {
      expect(formatPercentage(50.5)).toBe('51%');
    });
  });

  describe('formatParticipantCount 边界值', () => {
    it('0 应格式化为 "0"', () => {
      expect(formatParticipantCount(0)).toBe('0');
    });

    it('999 应格式化为 "999"', () => {
      expect(formatParticipantCount(999)).toBe('999');
    });

    it('1000 应格式化为 "1,000"', () => {
      expect(formatParticipantCount(1000)).toBe('1,000');
    });
  });

  describe('calculateRankFromTimes 边界值', () => {
    it('空列表应返回 50%', () => {
      expect(calculateRankFromTimes([], 100)).toBe(50);
    });

    it('只有自己一个人且无人比自己晚应返回 0%', () => {
      expect(calculateRankFromTimes([100], 100)).toBe(0);
    });

    it('所有人都比自己晚应返回 100%', () => {
      // 自己 100 分钟，其他人 200、300
      expect(calculateRankFromTimes([200, 300], 100)).toBe(100);
    });

    it('所有人都比自己早应返回 0%', () => {
      // 自己 300 分钟，其他人 100、200
      expect(calculateRankFromTimes([100, 200], 300)).toBe(0);
    });
  });

  describe('computeOffWorkTime 边界值', () => {
    it('0 加班时长应返回原始时间', () => {
      expect(computeOffWorkTime(18, 0, 0)).toEqual({hour: 18, minute: 0});
    });

    it('跨午夜应正确计算', () => {
      // 23:00 + 2 小时 = 25:00（次日 1:00）
      const result = computeOffWorkTime(23, 0, 2);
      expect(result.hour).toBe(25);
      expect(result.minute).toBe(0);
    });
  });
});


// ============================================================
// 文案池配置完整性测试 (Requirements: 3.5)
// ============================================================

describe('文案池配置完整性', () => {
  const tiers: CaptionTier[] = [
    'ontimeHigh',
    'ontimeMid',
    'overtimeLow',
    'overtimeHigh',
  ];

  tiers.forEach(tier => {
    it(`${tier} 分档应至少有 3 条文案`, () => {
      expect(CAPTIONS[tier].length).toBeGreaterThanOrEqual(3);
    });

    it(`${tier} 分档的文案应都是非空字符串`, () => {
      CAPTIONS[tier].forEach(caption => {
        expect(typeof caption).toBe('string');
        expect(caption.trim().length).toBeGreaterThan(0);
      });
    });
  });

  it('插画池 ontime 应有 9 张', () => {
    expect(ONTIME_ILLUSTRATIONS.length).toBe(9);
  });

  it('插画池 overtime 应有 9 张', () => {
    expect(OVERTIME_ILLUSTRATIONS.length).toBe(9);
  });
});

// ============================================================
// 序列化边界测试
// ============================================================

describe('序列化边界测试', () => {
  it('空字符串字段应正确 round-trip', () => {
    const data = {
      username: '',
      avatarId: '',
      rankPercentage: 0,
      participantCount: 0,
      isOnTime: false,
      caption: '',
      percentageText: '0%',
      participantText: '0',
      prefixText: '你晚于',
    };
    const json = serialize(data);
    const result = deserialize(json);
    expect(result).toEqual(data);
  });

  it('极大参与人数应正确 round-trip', () => {
    const data = {
      username: '测试用户',
      avatarId: 'avatar_1',
      rankPercentage: 99.9,
      participantCount: 999999,
      isOnTime: true,
      caption: '光速下班选手',
      percentageText: '100%',
      participantText: '999,999',
      prefixText: '你早于',
    };
    const json = serialize(data);
    const result = deserialize(json);
    expect(result).toEqual(data);
  });
});
