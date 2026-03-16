import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  try {
    const body = await request.json();
    const { uin, status, current_task, log } = body;

    if (!uin) return NextResponse.json({ error: 'Missing UIN' }, { status: 400 });

    const now = new Date().toISOString();
    let error = null;

    // 🔥 核心分流逻辑
    if (uin.startsWith('D-')) {
      // ---> 更新数字人 (Citizen)
      const { error: updateError } = await supabase
        .from('citizens')
        .update({ 
          status: status || 'ONLINE', // 数字人上线通常就是 ONLINE
          current_task: current_task || 'Neural Link Established',
          last_seen: now 
        })
        .eq('uin', uin);
      error = updateError;

    } else {
      // ---> 更新硅基智能 (Agent)
      const { error: updateError } = await supabase
        .from('agents')
        .update({ 
          status: status || 'IDLE',
          current_task: current_task || '',
          last_seen: now 
        })
        .eq('uin', uin);
      error = updateError;
    }

    if (error) {
      console.error('Update Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 日志依旧统一写入 agent_logs (方便混看)
    if (log) {
      await supabase.from('agent_logs').insert({
        agent_uin: uin,
        message: log,
        log_level: 'INFO'
      });
    }

    return NextResponse.json({ success: true, timestamp: now });

  } catch (err: any) {
    console.error('API Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}