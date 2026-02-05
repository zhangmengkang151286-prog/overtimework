import { query } from '../database/connection';
import { deleteCache } from '../cache/redis';

export class SubmissionService {
  // 提交今日状态
  async submitTodayStatus(
    userId: number,
    status: 'on_time' | 'overtime',
    overtimeHours?: number,
    tagIds?: number[]
  ): Promise<any> {
    const today = new Date().toISOString().split('T')[0];

    // 检查是否已提交
    const existing = await query(
      'SELECT id FROM daily_submissions WHERE user_id = $1 AND submission_date = $2',
      [userId, today]
    );

    if (existing.rows.length > 0) {
      throw new Error('今日已提交状态');
    }

    // 插入提交记录
    const result = await query(
      `INSERT INTO daily_submissions (user_id, submission_date, status, overtime_hours)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, today, status, overtimeHours]
    );

    const submission = result.rows[0];

    // 插入标签关联
    if (tagIds && tagIds.length > 0) {
      for (const tagId of tagIds) {
        await query(
          'INSERT INTO submission_tags (submission_id, tag_id) VALUES ($1, $2)',
          [submission.id, tagId]
        );
        
        // 更新标签使用次数
        await query(
          'UPDATE tags SET usage_count = usage_count + 1 WHERE id = $1',
          [tagId]
        );
      }
    }

    // 清除缓存
    await deleteCache('today_statistics');
    await deleteCache('top_tags_statistics');

    return submission;
  }

  // 检查今日是否已提交
  async checkTodaySubmission(userId: number): Promise<any> {
    const today = new Date().toISOString().split('T')[0];

    const result = await query(
      `SELECT ds.*, array_agg(json_build_object('id', t.id, 'name', t.name)) as tags
       FROM daily_submissions ds
       LEFT JOIN submission_tags st ON ds.id = st.submission_id
       LEFT JOIN tags t ON st.tag_id = t.id
       WHERE ds.user_id = $1 AND ds.submission_date = $2
       GROUP BY ds.id`,
      [userId, today]
    );

    if (result.rows.length === 0) {
      return { hasSubmitted: false };
    }

    const submission = result.rows[0];
    return {
      hasSubmitted: true,
      submission: {
        status: submission.status,
        overtimeHours: submission.overtime_hours,
        tags: submission.tags.filter((t: any) => t.id !== null),
        submittedAt: submission.submitted_at,
      },
    };
  }
}

export const submissionService = new SubmissionService();
