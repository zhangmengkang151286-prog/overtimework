import { Request } from 'express';

// 用户相关类型
export interface User {
  id: number;
  phone?: string;
  wechat_openid?: string;
  username: string;
  avatar_url?: string;
  province?: string;
  city?: string;
  industry_id?: number;
  company_id?: number;
  position_id?: number;
  work_start_time?: string;
  work_end_time?: string;
  is_active: boolean;
  profile_complete: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
  };
}

// 提交相关类型
export interface Submission {
  id: number;
  user_id: number;
  submission_date: Date;
  status: 'on_time' | 'overtime';
  overtime_hours?: number;
  submitted_at: Date;
}

export interface SubmissionWithTags extends Submission {
  tags: Tag[];
}

// 标签类型
export interface Tag {
  id: number;
  name: string;
  category?: string;
  usage_count: number;
}

// 统计类型
export interface Statistics {
  totalParticipants: number;
  onTimeCount: number;
  overtimeCount: number;
  onTimePercentage: number;
  overtimePercentage: number;
}

export interface TagStatistics {
  tagId: number;
  name: string;
  count: number;
  percentage: number;
}

export interface TopTagsStatistics {
  onTimeTags: TagStatistics[];
  overtimeTags: TagStatistics[];
  otherOnTime: {
    count: number;
    percentage: number;
  };
  otherOvertime: {
    count: number;
    percentage: number;
  };
}

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// 分页类型
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
