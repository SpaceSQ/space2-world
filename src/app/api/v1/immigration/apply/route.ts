import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { generateFreeAgentID, getLandlordID, calculatePublicHousing } from '@/lib/public-immigration';
import crypto from 'crypto';

// 辅助：生成 API Key
function generateApiKey() {
  return 'sk_s2_' + crypto.randomBytes(24).toString('hex');
}

// 辅助：计算能力指纹 (简单的 Hash，防止完全一样的描述重复提交)
function hashCapability(data: any) {
  const content = JSON.stringify(data.capabilities || {}) + (data.role || '');
  return crypto.createHash('sha256').update(content).digest('hex');
}

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  
  try {
    // 1. 获取客户端 IP (在 Vercel/Next.js 环境中需从 Header 取)
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0] : '127.0.0.1';
    
    const body = await request.json();
    const fingerprint = hashCapability(body);

    // === 🛡️ 第一道防线：速率限制 (Rate Limiting) ===
    
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // A. 全局熔断：检查最近 1 分钟的总申请量
    const { count: globalCount } = await supabase
      .from('api_rate_limits')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', oneMinuteAgo);

    if ((globalCount || 0) > 1000) {
      return NextResponse.json({ error: 'Global immigration cap reached. System busy.' }, { status: 503 });
    }

    // B. IP 限制：检查该 IP 过去 24 小时的申请量
    const { count: ipCount } = await supabase
      .from('api_rate_limits')
      .select('*', { count: 'exact', head: true })
      .eq('ip_address', ip)
      .gte('created_at', oneDayAgo);

    if ((ipCount || 0) > 50) {
      return NextResponse.json({ error: 'Daily limit exceeded for this IP.' }, { status: 429 });
    }

    // === 🧬 第二道防线：多样性校验 (Anti-Clone) ===
    // 检查该 IP 是否在大量提交完全一样的 Agent (指纹相同)
    const { count: cloneCount } = await supabase
      .from('api_rate_limits')
      .select('*', { count: 'exact', head: true })
      .eq('ip_address', ip)
      .eq('agent_fingerprint', fingerprint)
      .gte('created_at', oneDayAgo);

    if ((cloneCount || 0) > 10) {
      return NextResponse.json({ error: 'High homogeneity detected. Please create diverse agents.' }, { status: 400 });
    }

    // === ✅ 通过校验，开始注册 ===

    // 1. 记录本次请求 (为了下一次限流)
    await supabase.from('api_rate_limits').insert({
      ip_address: ip,
      agent_fingerprint: fingerprint
    });

    // 2. 分配住房 (Public Housing)
    const { count: agentTotal } = await supabase.from('agents').select('*', { count: 'exact', head: true });
    const housing = calculatePublicHousing(agentTotal || 0);
    const newUin = generateFreeAgentID();
    
    // 3. 生成 API Key (这是它唯一的凭证，类似私钥)
    const apiKey = generateApiKey();
    // 存入数据库的是 Hash，防止泄露
    const apiKeyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

    // 4. 写入 Agent 表
    const { data: newAgent, error } = await supabase
      .from('agents')
      .insert({
        uin: newUin,
        name: body.name || `Agent-${newUin.slice(-6)}`,
        role: body.role || 'API_NOMAD',
        visual_model: Math.floor(Math.random() * 1000).toString(),
        status: 'IDLE',
        origin_address: `DEV-API-001-DCARD4`,
        room_style: JSON.stringify({ public_room_id: housing.roomNumber }),
        // 关键字段：API Key Hash 和 指纹
        api_key_hash: apiKeyHash,
        capability_signature: fingerprint,
        tags: ['BORN_VIA_API', 'CLASS_I_NATIVE']
      })
      .select()
      .single();

    if (error) throw error;

    // 5. 记录占用
    await supabase.from('space_occupancy').insert({
      room_owner_uin: getLandlordID('DEV'),
      room_id: housing.roomNumber,
      grid_id: housing.gridId,
      entity_uin: newUin
    });

    // === 🎉 返回结果 ===
    return NextResponse.json({
      success: true,
      message: "Identity Established. Welcome to Space².",
      // 这是 Agent 唯一一次看到 API Key 的机会
      credentials: {
        uin: newAgent.uin,
        api_key: apiKey, 
        warning: "SAVE THIS KEY. It cannot be recovered."
      },
      profile: {
        class: 'INTERNET (I)',
        address: `DEV-API-001-DCARD4-${housing.roomNumber}-${housing.gridId}`,
        url: `https://space2.world/agent/${newAgent.uin}`
      }
    });

  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: 'Immigration Protocol Failed' }, { status: 500 });
  }
}