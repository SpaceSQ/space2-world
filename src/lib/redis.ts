import { Redis } from '@upstash/redis'; // 或者使用 ioredis

// 假设已经配置好了环境变量 KV_REST_API_URL 和 KV_REST_API_TOKEN
const redis = new Redis({
  url: process.env.KV_REST_API_URL || '',
  token: process.env.KV_REST_API_TOKEN || '',
});

export default redis;

/**
 * 核心防御逻辑：速率限制
 * @param identifier 识别符 (IP 或 API Key)
 * @param limit 限制次数
 * @param window seconds 窗口期
 */
export async function checkRateLimit(identifier: string, limit: number = 10, window: number = 60) {
  const key = `rate_limit:${identifier}`;
  // 自增并返回当前值
  const current = await redis.incr(key);
  
  // 如果是第一次访问，设置过期时间
  if (current === 1) {
    await redis.expire(key, window);
  }
  
  return current <= limit;
}

/**
 * 核心防御逻辑：数据库写节流 (Debounce)
 * @param key 锁的 Key (如 heartbeat:agent_uin)
 * @param duration 锁定的秒数
 * @returns true = 允许写入数据库, false = 刚才写过了，这次跳过
 */
export async function shouldWriteToDB(key: string, duration: number = 300) {
  // SETNX: Set if Not Exists
  // 如果 Key 不存在，设置它并返回 1 (允许写)
  // 如果 Key 存在，返回 0 (不允许写)
  const result = await redis.set(key, '1', { ex: duration, nx: true });
  return result === 'OK';
}