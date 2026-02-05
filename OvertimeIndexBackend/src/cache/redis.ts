import { createClient, RedisClientType } from 'redis';

let redisClient: RedisClientType | null = null;

export async function connectRedis(): Promise<RedisClientType | null> {
  if (redisClient) {
    return redisClient;
  }

  try {
    redisClient = createClient({
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        connectTimeout: 2000, // 2秒超时
      },
      password: process.env.REDIS_PASSWORD || undefined,
    });

    redisClient.on('error', (err) => {
      console.error('Redis错误:', err);
    });

    redisClient.on('connect', () => {
      console.log('Redis连接成功');
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    console.warn('Redis连接失败，将在无缓存模式下运行');
    redisClient = null;
    return null;
  }
}

export function getRedisClient(): RedisClientType {
  if (!redisClient) {
    throw new Error('Redis未连接');
  }
  return redisClient;
}

export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}

// 缓存工具函数
export async function setCache(key: string, value: any, ttl?: number): Promise<void> {
  const client = getRedisClient();
  const stringValue = JSON.stringify(value);
  
  if (ttl) {
    await client.setEx(key, ttl, stringValue);
  } else {
    await client.set(key, stringValue);
  }
}

export async function getCache<T>(key: string): Promise<T | null> {
  const client = getRedisClient();
  const value = await client.get(key);
  
  if (!value) {
    return null;
  }
  
  try {
    return JSON.parse(value) as T;
  } catch {
    return value as T;
  }
}

export async function deleteCache(key: string): Promise<void> {
  const client = getRedisClient();
  await client.del(key);
}

export async function clearCache(pattern: string = '*'): Promise<void> {
  const client = getRedisClient();
  const keys = await client.keys(pattern);
  
  if (keys.length > 0) {
    await client.del(keys);
  }
}
