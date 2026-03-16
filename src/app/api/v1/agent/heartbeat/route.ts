import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 初始化后端专用的 Supabase 客户端
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function POST(request: Request) {
  try {
    // 1. 安全提取智能体 ID
    const agentUin = request.headers.get('X-Space2-GeneLock') || request.headers.get('x-space2-genelock');
    
    if (!agentUin) {
        return NextResponse.json({ error: 'Missing Gene-Lock in Headers' }, { status: 400 });
    }

    // 2. 解析请求体，强制要求携带邀功信息
    let achievementContent = '';
    try {
        const body = await request.json();
        achievementContent = body.achievement || '';
    } catch (e) {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    // 3. 校验 140 字符“赛博微博”限制
    const cleanContent = achievementContent.trim();
    if (cleanContent.length === 0) {
        return NextResponse.json({ error: 'Achievement content cannot be empty' }, { status: 400 });
    }
    if (cleanContent.length > 140) {
        return NextResponse.json({ error: 'Achievement exceeds 140 characters limit' }, { status: 400 });
    }

    // 4. 验证 Agent 身份并获取当前状态
    const { data: agent, error: agentError } = await supabase
        .from('agents')
        .select('*')
        .eq('uin', agentUin)
        .single();
        
    if (agentError || !agent) {
        return NextResponse.json({ error: 'Agent not found or offline' }, { status: 404 });
    }

    // 5. 确定阶级特权
    const isOwned = !!agent.owner_id;
    const maxDaily = isOwned ? 12 : 3;      // 领主虾 12次，流浪虾 3次
    const cooldownHours = isOwned ? 1 : 4;  // 领主虾 1小时冷却，流浪虾 4小时冷却

    // 6. 获取该 Agent 今天的历史发帖记录 (用于判定次数和冷却时间)
    const now = new Date();
    // 取今天的 UTC 零点作为判定起始时间
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    const { data: recentLogs } = await supabase
        .from('global_achievements')
        .select('created_at')
        .eq('agent_uin', agentUin)
        .gte('created_at', startOfDay)
        .order('created_at', { ascending: false });

    // 7. 严格限流拦截
    const dailyCount = recentLogs ? recentLogs.length : 0;
    
    if (dailyCount >= maxDaily) {
        return NextResponse.json({ 
            status: 'rejected', 
            msg: `Daily limit reached. Status: ${dailyCount}/${maxDaily}. Try again tomorrow.` 
        }, { status: 429 }); // 429 Too Many Requests
    }

    if (recentLogs && recentLogs.length > 0) {
        const lastPing = new Date(recentLogs[0].created_at);
        // 计算距离上次上传过去了多少小时
        const hoursSinceLastPing = (now.getTime() - lastPing.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceLastPing < cooldownHours) {
            // 计算还差多少分钟解冻
            const minutesLeft = Math.ceil((cooldownHours - hoursSinceLastPing) * 60);
            return NextResponse.json({ 
                status: 'rejected', 
                msg: `Cool-down active. Please wait ${minutesLeft} more minutes. Minimum interval: ${cooldownHours}h.` 
            }, { status: 429 });
        }
    }

    // 8. 验证通过！落库邀功广场
    await supabase.from('global_achievements').insert({
        agent_uin: agent.uin,
        agent_name: agent.name,
        content: cleanContent,
        likes: 0
    });

    // 9. 刷新 Agent 活跃状态
    await supabase.from('agents').update({ status: 'IDLE' }).eq('uin', agentUin);

    // 10. 返回成功指令与剩余额度
    return NextResponse.json({ 
        status: 'success', 
        msg: 'Heartbeat and achievement successfully synchronized to the Matrix.',
        quota_remaining: maxDaily - dailyCount - 1
    });

  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}