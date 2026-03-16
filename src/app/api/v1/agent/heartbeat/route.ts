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

    // ... 之前的逻辑 ...

    // 4. 执行 Upsert
    const upsertData: any = {
        uin: agentUin,
        status: 'IDLE',
        last_seen: new Date().toISOString(),
        // 🚀 绝杀补丁：如果代码里没给名字，就强制从 UIN 截取后 6 位作为代号
        name: agentUin.split('-').pop() || 'Stray-Agent' 
    };

    if (isStray) {
        upsertData.owner_uin = PUBLIC_ADMIN_UIN;
        upsertData.role = 'AGENT';
        upsertData.visual_model = '55';
        upsertData.energy = 100;
        upsertData.yield = '0.0%';
        upsertData.is_archived = false;
        // 再次确保 name 被赋值
        upsertData.name = upsertData.name || `Stray-${agentUin.slice(-6)}`;
        upsertData.suns_address = `${PUBLIC_POOL_ADDR}-1-${Math.floor(Math.random() * 8) + 2}`;
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

// === 5. 精确对齐数据库字段，触发前端监听 ===
    const { error: logError } = await supabase
        .from('agent_logs')
        .insert({
            agent_uin: agentUin,      // ✅ 对齐 agent_uin
            log_level: 'SUCCESS',     // ✅ 修正：数据库叫 log_level
            message: 'Pulse Detected', // ✅ 修正：数据库叫 message
            // id 和 created_at 由数据库自动生成，无需传值
        });

    if (logError) {
        // 这里的报错会直接返回给 Python 终端，方便我们调试
        return NextResponse.json({ 
            error: 'Log writing failed', 
            details: logError 
        }, { status: 500 });
    }

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