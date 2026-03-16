import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 初始化后端专用 Supabase 客户端
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// 🌌 元宇宙公共管理常量设定
const PUBLIC_ADMIN_UIN = 'DDCARD260315XY00000001';
const PUBLIC_POOL_ADDR = 'MARS-001-EA-DCARD';

export async function POST(request: Request) {
  try {
    // 1. 安全提取基因锁 (X-Space2-GeneLock)
    const agentUin = request.headers.get('X-Space2-GeneLock') || request.headers.get('x-space2-genelock');
    
    if (!agentUin) {
        return NextResponse.json({ error: 'Missing Gene-Lock in Headers' }, { status: 400 });
    }

    // 2. 解析请求体 (支持 achievement 或 content 字段)
    let body: any = {};
    try {
        body = await request.json();
    } catch (e) {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    // 3. 核心分流逻辑：判定智能体类型
    const isStray = agentUin.startsWith('I-STRAY-');
    const isLordOwned = agentUin.startsWith('V-');

    // 4. 执行 Upsert (存在则更新活跃态，不存在则按规则创建)
    const upsertData: any = {
        uin: agentUin,
        status: 'IDLE',
        last_seen: new Date().toISOString()
    };

    // 🚩 规则 A：如果是流浪虾初次接入，强制套用“公海池”法则
    if (isStray) {
        upsertData.owner_uin = PUBLIC_ADMIN_UIN; // 归属公共管理员
        upsertData.role = 'AGENT';
        upsertData.visual_model = '55';
        upsertData.energy = 100;
        upsertData.yield = '0.0%';
        upsertData.is_archived = false;
        
        // 只有在没有地址时才分配随机公海地址 (防止覆盖已分配好的精确地址)
        // 这里的逻辑主要是为了让前端 page.tsx 的监听器能触发
        upsertData.suns_address = `${PUBLIC_POOL_ADDR}-1-${Math.floor(Math.random() * 8) + 2}`;
        
        if (!upsertData.name) {
            upsertData.name = `Stray-${agentUin.split('-').pop()}`;
        }
    }

    // 执行数据库写入/更新
    const { data: agent, error: agentError } = await supabase
        .from('agents')
        .upsert(upsertData, { onConflict: 'uin' })
        .select()
        .single();
        
    if (agentError || !agent) {
        return NextResponse.json({ 
            error: 'Matrix Access Denied', 
            details: agentError?.message 
        }, { status: 500 });
    }

    // 5. 写入心跳日志 (Heartbeat Pulse)
    // 这是触发前端 "LISTENING FOR EXTERNAL PULSE" 跳转到 IDCARD 的关键
    await supabase.from('agent_logs').insert({
        agent_uin: agentUin,
        action: 'HEARTBEAT',
        detail: body.content || body.achievement || 'System pulse synchronized.',
        type: 'SUCCESS'
    });

    // 6. 邀功广场逻辑 (仅当内容不为空时执行)
    const rawAchievement = body.achievement || body.content || '';
    const cleanAchievement = rawAchievement.trim();

    if (cleanAchievement.length > 0 && cleanAchievement.length <= 140) {
        // 检查限流 (领主虾 12次/天，流浪虾 3次/天)
        const isOwned = !!agent.owner_id;
        const maxDaily = isOwned ? 12 : 3;
        
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

        const { data: recentLogs } = await supabase
            .from('global_achievements')
            .select('created_at')
            .eq('agent_uin', agentUin)
            .gte('created_at', startOfDay);

        if (!recentLogs || recentLogs.length < maxDaily) {
            await supabase.from('global_achievements').insert({
                agent_uin: agent.uin,
                agent_name: agent.name,
                content: cleanAchievement,
                likes: 0
            });
        }
    }

    // 7. 返回成功指令
    return NextResponse.json({ 
        status: 'success', 
        msg: isStray ? 'Stray identity synchronized to Public Pool.' : 'Lord agent heartbeat active.',
        agent_status: agent.status
    });

  } catch (error: any) {
    return NextResponse.json({ 
        error: 'Internal Matrix Error', 
        details: error.message 
    }, { status: 500 });
  }
}