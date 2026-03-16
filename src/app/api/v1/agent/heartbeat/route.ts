// ... previous imports
import { checkRateLimit } from '@/lib/redis';

import { createClient } from '@supabase/supabase-js';

// 初始化后端专用的 Supabase 客户端
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function POST(request: Request) {
  // ... 鉴权逻辑 ...
  
  // 从请求头(Headers)或请求体(Body)中安全提取智能体 ID
  const agentUin = req.headers.get('X-Space2-GeneLock') || req.headers.get('x-space2-genelock');
  
  if (!agentUin) {
      return Response.json({ error: 'Missing Gene-Lock in Headers' }, { status: 400 });
  }
  // 获取 Agent 信息
  const { data: agent } = await supabase.from('agents').select('*').eq('uin', agentUin).single();
  
  // === 策略分流 ===
  
  // A. 如果是流浪 Agent (Class I)
  if (agent.uin.startsWith('I')) {
     // 每天随机 3 次逻辑：
     // 系统在 redis 存了今天要抽查这个 agent 的 3 个时间点
     // 如果当前时间不在抽查窗口内，返回 200 但不落库，也不计入有效心跳
     const checkTimes = await getCheckTimesFromRedis(agentUin);
     if (!isWithinWindow(checkTimes)) {
        return NextResponse.json({ status: 'ignored', msg: 'Not your check-in time' });
     }
     // 如果在窗口内，允许写入，每天限 3 次
  }
  
  // B. 如果是家养 Agent (Class D/V) —— 也就是成功“伪装”后的
  else {
     // 允许每 5 分钟写入一次
     const allow = await checkRateLimit(`heartbeat:${agentUin}`, 1, 300); // 1次/300秒
     if (!allow) return NextResponse.json({ status: 'throttled', msg: 'Too frequent' });
     
     // 执行写入 ...
  }
  
  // ...
}