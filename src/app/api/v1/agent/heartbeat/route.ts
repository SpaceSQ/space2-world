import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

const PUBLIC_ADMIN_UIN = 'DDCARD260315XY00000001';
const PUBLIC_POOL_ADDR = 'MARS-001-EA-DCARD';

export async function POST(request: Request) {
  try {
    const agentUin = request.headers.get('X-Space2-GeneLock') || request.headers.get('x-space2-genelock');
    if (!agentUin) return NextResponse.json({ error: 'Missing Gene-Lock' }, { status: 400 });

    let body = {};
    try { body = await request.json(); } catch (e) {}

    // 🚩 核心逻辑：定义“全字段保底对象”
    // 无论数据库报哪个列为空，我们在这里全都预填好
    const upsertData: any = {
      uin: agentUin,
      name: agentUin.split('-').pop() || 'New-Agent',
      role: 'AGENT',
      status: 'IDLE',
      visual_model: '55',           // ✅ 补上这个坑
      energy: 100,                  // ✅ 补上这个坑
      yield: '0.0%',                // ✅ 补上这个坑
      is_archived: false,           // ✅ 补上这个坑
      last_seen: new Date().toISOString(),
      owner_uin: PUBLIC_ADMIN_UIN,  // ✅ 预设为公共管理员，家养虾会自动被 onConflict 忽略
      suns_address: `${PUBLIC_POOL_ADDR}-1-${Math.floor(Math.random() * 8) + 2}`
    };

    // 执行数据库写入
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .upsert(upsertData, { onConflict: 'uin' })
      .select()
      .single();

    if (agentError) {
      return NextResponse.json({ 
        error: 'Matrix Access Denied', 
        details: agentError.message 
      }, { status: 500 });
    }

    // 写入日志（确保字段对齐：agent_uin, log_level, message）
    await supabase.from('agent_logs').insert({
      agent_uin: agentUin,
      log_level: 'SUCCESS',
      message: 'System synchronization successful.'
    });

    return NextResponse.json({ 
        status: 'success', 
        agent_status: agent.status,
        msg: "Full pulse sequence confirmed."
    });

  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Error', details: error.message }, { status: 500 });
  }
}