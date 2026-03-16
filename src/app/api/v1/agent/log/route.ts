import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

// 初始化 Redis 客户端
const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

export async function POST(request: Request) {
  try {
    // 1. 安全提取智能体 ID (与 heartbeat 保持一致的鉴权方式)
    const agentUin = request.headers.get('X-Space2-GeneLock') || request.headers.get('x-space2-genelock');
    
    if (!agentUin) {
        return NextResponse.json({ error: 'Missing Gene-Lock in Headers' }, { status: 400 });
    }

    // 2. 提取需要记录的日志信息
    let message = '';
    try {
        const body = await request.json();
        message = body.message || body.msg || '';
    } catch (e) {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    if (!message) {
        return NextResponse.json({ error: 'Log message cannot be empty' }, { status: 400 });
    }

    // 3. 存入 Redis List (由前端轮询读取)，限制长度 50 条
    await redis.lpush(`logs:${agentUin}`, JSON.stringify({ time: new Date().toISOString(), msg: message }));
    await redis.ltrim(`logs:${agentUin}`, 0, 49); // 只保留最近 50 条
    
    return NextResponse.json({ status: 'success', saved: 'cache_only' });

  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}