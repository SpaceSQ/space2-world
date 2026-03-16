import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { generateSiliconID, generateFreeAgentID } from '@/lib/id-generator'; // ✅ 引用新库
import { calculatePublicHousing, getLandlordID } from '@/lib/public-immigration';

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  
  try {
    const body = await request.json();
    const { 
        name, 
        role, 
        visual_model, 
        owner_uin, 
        suns_address, 
        custom_sequence // ✅ 接收前端传来的吉祥号 (如 "88888888")
    } = body;

    // 1. 确定类别 (D/V/I)
    // 如果有 owner_uin 且以 D 开头，说明是数字人孵化的 -> V 类
    let newUin = '';
    
    if (owner_uin && owner_uin.startsWith('D')) {
        // === Class V: 孵化智能体 ===
        // 使用 generateSiliconID，并传入用户的吉祥号
        newUin = generateSiliconID(suns_address || 'MARS-CN-001-UNKNOWN', custom_sequence);
    } else {
        // === Class I: 互联网申请 ===
        // 强制随机，忽略 custom_sequence
        newUin = generateFreeAgentID();
    }

    // 2. 准备入库数据
    // 默认分配一个位置，后续由 Grid 系统修正
    const housing = { roomNumber: 1, gridId: 2 }; 

    // 构建 Agent 对象
    const newAgent = {
      uin: newUin, 
      name: name || `Agent-${newUin.slice(-4)}`,
      role: role || 'ASSISTANT',
      owner_uin: owner_uin, // 绑定主人
      visual_model: visual_model || '100',
      status: 'IDLE',
      origin_address: suns_address || `MARS-CN-001-GENESIS`, // 记录出生地
      room_style: JSON.stringify({ public_room_id: housing.roomNumber }),
      created_at: new Date().toISOString(),
      tags: ['INCUBATED', 'V2_STANDARD']
    };

    // 3. 写入数据库
    const { data, error } = await supabase
      .from('agents')
      .insert(newAgent)
      .select()
      .single();

    if (error) throw error;
    
    // 4. 写入占用记录 (Occupancy)
    if (owner_uin) {
        // 先检查该位置是否被占，这里简化为直接插入
        await supabase.from('space_occupancy').insert({
            room_owner_uin: owner_uin,
            room_id: housing.roomNumber, 
            grid_id: housing.gridId,     
            entity_uin: newUin
        });
    }

    return NextResponse.json({ success: true, agent: data });

  } catch (err: any) {
    console.error("Incubation Failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}