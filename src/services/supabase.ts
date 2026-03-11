/**
 * Supabase 客户端（已禁用）
 * 
 * 注意：本项目已从 Supabase 迁移到阿里云 RDS + PostgREST
 * 此文件保留仅为了兼容性，不再创建 Supabase 客户端
 * 
 * 请使用以下服务：
 * - supabaseService: 适配器层，保持原有 API 接口
 * - dataService: PostgREST API 封装
 * - postgrestApi: 底层 HTTP 请求
 */

// 数据库类型定义（保留用于类型检查）
export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          phone_number: string | null;
          wechat_id: string | null;
          avatar: string | null;
          username: string;
          province: string;
          city: string;
          industry: string;
          company: string;
          position: string;
          work_start_time: string;
          work_end_time: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          phone_number?: string | null;
          wechat_id?: string | null;
          avatar?: string | null;
          username: string;
          province: string;
          city: string;
          industry: string;
          company: string;
          position: string;
          work_start_time?: string;
          work_end_time?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          phone_number?: string | null;
          wechat_id?: string | null;
          avatar?: string | null;
          username?: string;
          province?: string;
          city?: string;
          industry?: string;
          company?: string;
          position?: string;
          work_start_time?: string;
          work_end_time?: string;
          updated_at?: string;
        };
      };
      tags: {
        Row: {
          id: string;
          name: string;
          type: 'industry' | 'company' | 'position' | 'custom';
          is_active: boolean;
          usage_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          type: 'industry' | 'company' | 'position' | 'custom';
          is_active?: boolean;
          usage_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          type?: 'industry' | 'company' | 'position' | 'custom';
          is_active?: boolean;
          usage_count?: number;
          created_at?: string;
        };
      };
      status_records: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          is_overtime: boolean;
          tag_id: string | null;
          overtime_hours: number | null;
          submitted_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          is_overtime: boolean;
          tag_id?: string | null;
          overtime_hours?: number | null;
          submitted_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          is_overtime?: boolean;
          tag_id?: string | null;
          overtime_hours?: number | null;
          submitted_at?: string;
        };
      };
      daily_history: {
        Row: {
          id: string;
          date: string;
          participant_count: number;
          overtime_count: number;
          on_time_count: number;
          tag_distribution: any;
          created_at: string;
        };
        Insert: {
          id?: string;
          date: string;
          participant_count: number;
          overtime_count: number;
          on_time_count: number;
          tag_distribution: any;
          created_at?: string;
        };
        Update: {
          id?: string;
          date?: string;
          participant_count?: number;
          overtime_count?: number;
          on_time_count?: number;
          tag_distribution?: any;
          created_at?: string;
        };
      };
    };
    Views: {
      real_time_stats: {
        Row: {
          date: string;
          participant_count: number;
          overtime_count: number;
          on_time_count: number;
          last_updated: string;
        };
      };
      tag_stats: {
        Row: {
          date: string;
          tag_id: string;
          tag_name: string;
          overtime_count: number;
          on_time_count: number;
          total_count: number;
        };
      };
    };
    Functions: {
      get_real_time_stats: {
        Args: Record<string, never>;
        Returns: {
          participant_count: number;
          overtime_count: number;
          on_time_count: number;
          last_updated: string;
        }[];
      };
      get_top_tags: {
        Args: {limit_count?: number};
        Returns: {
          tag_id: string;
          tag_name: string;
          overtime_count: number;
          on_time_count: number;
          total_count: number;
        }[];
      };
      get_daily_status: {
        Args: {days?: number};
        Returns: {
          date: string;
          is_overtime_dominant: boolean;
          participant_count: number;
          overtime_count: number;
          on_time_count: number;
        }[];
      };
    };
  };
}

// Supabase 客户端（已禁用）
// 导出空对象以保持兼容性
export const supabase: any = {
  from: () => ({
    select: () => Promise.resolve({ data: [], error: new Error('Supabase client is disabled') }),
    insert: () => Promise.resolve({ data: null, error: new Error('Supabase client is disabled') }),
    update: () => Promise.resolve({ data: null, error: new Error('Supabase client is disabled') }),
    delete: () => Promise.resolve({ data: null, error: new Error('Supabase client is disabled') }),
  }),
  auth: {
    signOut: () => Promise.resolve({ error: null }),
  },
};

// 错误处理辅助函数（保留用于兼容性）
export const handleSupabaseError = (error: any): Error => {
  console.error('Supabase Error:', error);

  if (error.code === 'PGRST116') {
    return new Error('数据不存在');
  }

  if (error.code === '23505') {
    return new Error('数据已存在');
  }

  if (error.code === '23503') {
    return new Error('关联数据不存在');
  }

  if (error.message) {
    return new Error(error.message);
  }

  return new Error('操作失败，请稍后重试');
};

// 连接状态检查（已禁用）
export const checkConnection = async (): Promise<boolean> => {
  console.warn('Supabase client is disabled, use dataService instead');
  return false;
};

// 导出类型（保留用于兼容性）
export type SupabaseClient = any;
