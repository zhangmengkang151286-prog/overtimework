import { query } from '../database/connection';
import { hashPassword, comparePassword } from '../utils/bcrypt';
import { generateToken } from '../utils/jwt';
import { User } from '../types';

export class AuthService {
  // 手机号注册
  async registerWithPhone(phone: string, password: string, username: string): Promise<{ user: User; token: string }> {
    // 检查手机号是否已存在
    const existing = await query('SELECT id FROM users WHERE phone = $1', [phone]);
    if (existing.rows.length > 0) {
      throw new Error('手机号已注册');
    }

    // 创建用户
    const passwordHash = await hashPassword(password);
    const result = await query(
      `INSERT INTO users (phone, username, password_hash, profile_complete)
       VALUES ($1, $2, $3, false)
       RETURNING *`,
      [phone, username, passwordHash]
    );

    const user = result.rows[0];
    const token = generateToken({ id: user.id, username: user.username });

    return { user, token };
  }

  // 手机号登录
  async loginWithPhone(phone: string, password: string): Promise<{ user: User; token: string }> {
    const result = await query(
      'SELECT * FROM users WHERE phone = $1 AND is_active = true',
      [phone]
    );

    if (result.rows.length === 0) {
      throw new Error('用户不存在或已禁用');
    }

    const user = result.rows[0];
    
    if (!user.password_hash) {
      throw new Error('密码未设置');
    }

    const isValid = await comparePassword(password, user.password_hash);
    if (!isValid) {
      throw new Error('密码错误');
    }

    const token = generateToken({ id: user.id, username: user.username });
    return { user, token };
  }

  // 微信登录/注册
  async loginWithWechat(openid: string, username: string, avatarUrl?: string): Promise<{ user: User; token: string; isNew: boolean }> {
    // 查找是否已存在
    let result = await query(
      'SELECT * FROM users WHERE wechat_openid = $1',
      [openid]
    );

    let user: User;
    let isNew = false;

    if (result.rows.length === 0) {
      // 新用户，创建账号
      result = await query(
        `INSERT INTO users (wechat_openid, username, avatar_url, profile_complete)
         VALUES ($1, $2, $3, false)
         RETURNING *`,
        [openid, username, avatarUrl]
      );
      user = result.rows[0];
      isNew = true;
    } else {
      user = result.rows[0];
    }

    const token = generateToken({ id: user.id, username: user.username });
    return { user, token, isNew };
  }

  // 完善用户信息
  async completeProfile(userId: number, profileData: any): Promise<User> {
    const result = await query(
      `UPDATE users SET
        username = $1,
        avatar_url = $2,
        province = $3,
        city = $4,
        industry_id = $5,
        company_id = $6,
        position_id = $7,
        work_start_time = $8,
        work_end_time = $9,
        profile_complete = true,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $10
       RETURNING *`,
      [
        profileData.username,
        profileData.avatarUrl,
        profileData.province,
        profileData.city,
        profileData.industryId,
        profileData.companyId,
        profileData.positionId,
        profileData.workStartTime,
        profileData.workEndTime,
        userId,
      ]
    );

    return result.rows[0];
  }
}

export const authService = new AuthService();
