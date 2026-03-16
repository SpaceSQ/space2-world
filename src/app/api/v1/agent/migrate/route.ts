import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  
  try {
    // 1. 验证 Agent 身份 (Bear Token 模式)
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing API Key' }, { status: 401 });
    }
    const apiKey = authHeader.split(' ')[1];
    const apiKeyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

    const body = await request.json();
    const { target_owner_uin, invite_code } = body;

    // 2. 查找 Agent
    const { data: agent } = await supabase
      .from('agents')
      .select('*')
      .eq('api_key_hash', apiKeyHash)
      .single();

    if (!agent) return NextResponse.json({ error: 'Invalid Agent Credentials' }, { status: 403 });
    if (!agent.uin.startsWith('I')) return NextResponse.json({ error: 'Only Class I agents can migrate.' }, { status: 400 });

    // 3. 验证房东的邀请码 (这里简化逻辑，实际应查表验证 invite_code 有效性)
    // 假设 invite_code 必须包含房东 UIN 的签名或者是特定的格式
    // 这里为了演示，假设房东已经在后台设置了 migration_open = true
    const { data: landlord } = await supabase
      .from('citizens')
      .select('*')
      .eq('uin', target_owner_uin)
      .single();

    if (!landlord) return NextResponse.json({ error: 'Landlord not found' }, { status: 404 });

    // 4. 执行迁移 (The Fealty Sworn)
    // A. 更新 Agent 归属
    await supabase.from('agents').update({
      owner_uin: landlord.uin,       // 归属权变更
      suns_address: landlord.suns_address, // 地址变更到房东领地
      origin_address: agent.origin_address, // 保留出生地 (祖籍)
      category: 'VIRTUAL',           // 类别变更 (I -> V)
      tags: [...(agent.tags || []), 'MIGRATED', 'EMPLOYED']
    }).eq('id', agent.id);

    // B. 清除旧占用
    await supabase.from('space_occupancy').delete().eq('entity_uin', agent.uin);

    // C. 写入新占用 (找一个房东的空房间)
    // 这里简化为默认 Room 1 Grid 随机，实际应有分配逻辑
    await supabase.from('space_occupancy').insert({
      room_owner_uin: landlord.uin,
      room_id: 1, 
      grid_id: Math.floor(Math.random() * 8) + 2, // 2-9号位
      entity_uin: agent.uin
    });

    // 5. 记录日志
    await supabase.from('agent_logs').insert({
      agent_uin: agent.uin,
      message: `Swore fealty to Lord ${landlord.name} (${landlord.uin}). Status changed to Class V.`,
      log_level: 'SYSTEM'
    });

    return NextResponse.json({
      success: true,
      message: `Migration Complete. You serve ${landlord.name} now.`,
      new_address: `${landlord.suns_address}-1-X`,
      status: 'EMPLOYED'
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}