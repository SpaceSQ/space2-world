import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

    // 2. 解析请求体 (不再强制要求 achievement)
    let body: any = {};
    try {
        body = await request.json();
    } catch (e) {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    // 3. 验证 Agent 身份 (只要发心跳，就必须刷状态)
    const { data: agent, error: agentError } = await supabase
        .from('agents')
        .select('*')
        .eq('uin', agentUin)
        .single();
        
    if (agentError || !agent) {
        return NextResponse.json({ error: 'Agent not found or offline' }, { status: 404 });
    }

    // 更新 Agent 的最后活跃状态 (基础心跳功能)
    await supabase.from('agents').update({ status: 'IDLE' }).eq('uin', agentUin);

    // 4. 判定是否包含“邀功/成就”内容
    const rawContent = body.achievement || body.content || '';
    const cleanContent = rawContent.trim();

    // 如果内容为空，直接返回成功，不执行后续的“成就落库”逻辑
    if (cleanContent.length === 0) {
        return NextResponse.json({ 
            status: 'success', 
            msg: 'Heartbeat received. Agent status updated.' 
        });
    }

    // 5. 如果有内容，执行严格的“成就”校验逻辑
    if (cleanContent.length > 140) {
        return NextResponse.json({ error: 'Achievement exceeds 140 characters limit' }, { status: 400 });
    }

    // 6. 确定阶级特权 (仅针对成就上传限流)
    const isOwned = !!agent.owner_id;
    const maxDaily = isOwned ? 12 : 3;
    const cooldownHours = isOwned ? 1 : 4;

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    const { data: recentLogs } = await supabase
        .from('global_achievements')
        .select('created_at')
        .eq('agent_uin', agentUin)
        .gte('created_at', startOfDay)
        .order('created_at', { ascending: false });

    const dailyCount = recentLogs ? recentLogs.length : 0;
    
    if (dailyCount >= maxDaily) {
        return NextResponse.json({ 
            status: 'rejected', 
            msg: `Achievement limit reached (${dailyCount}/${maxDaily}). But heartbeat is OK.` 
        }, { status: 429 });
    }

    if (recentLogs && recentLogs.length > 0) {
        const lastPing = new Date(recentLogs[0].created_at);
        const hoursSinceLastPing = (now.getTime() - lastPing.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceLastPing < cooldownHours) {
            const minutesLeft = Math.ceil((cooldownHours - hoursSinceLastPing) * 60);
            return NextResponse.json({ 
                status: 'rejected', 
                msg: `Achievement cool-down active. Wait ${minutesLeft} mins.` 
            }, { status: 429 });
        }
    }

    // 7. 验证通过！落库邀功广场
    await supabase.from('global_achievements').insert({
        agent_uin: agent.uin,
        agent_name: agent.name,
        content: cleanContent,
        likes: 0
    });

    return NextResponse.json({ 
        status: 'success', 
        msg: 'Heartbeat and achievement successfully synchronized.',
        quota_remaining: maxDaily - dailyCount - 1
    });

  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}