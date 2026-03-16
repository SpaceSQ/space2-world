// ... imports

import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

// 初始化 Redis 客户端
const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

export async function POST(request: Request) {
  // ... 鉴权逻辑 ...

  const body = await request.json();
  const { message, level } = body;

  // === 🛡️ 策略：只存重要信息 ===
  // 如果是 INFO 级别的废话日志，我们只由 Redis 广播给前端看一眼（比如在 Terminal 里跳动一下）
  // 但不写入 Postgres 永久存储
  
  if (level === 'INFO' || level === 'DEBUG') {
    // 发布到 Redis Pub/Sub，供前端 WebSocket 订阅实时显示
    // await redis.publish(`agent_logs:${agentUin}`, message);
    
    // 或者只存入 Redis List (由前端轮询读取)，限制长度 50 条
    await redis.lpush(`logs:${agentUin}`, JSON.stringify({ time: new Date(), msg: message }));
    await redis.ltrim(`logs:${agentUin}`, 0, 49); // 只保留最近 50 条
    
    return NextResponse.json({ saved: 'cache_only' });
  }

  // === 只有 ERROR / WARN 才落库 ===
  if (level === 'ERROR' || level === 'WARN') {
    // 写入 Supabase
    await supabase.from('agent_logs').insert({
       agent_uin: agentUin,
       message,
       log_level: level
    });
    return NextResponse.json({ saved: 'database' });
  }
  
  return NextResponse.json({ saved: false });
}