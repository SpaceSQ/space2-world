import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
    return new NextResponse("Webhook endpoint is alive and reachable!");
}

// 智能密钥格式化（保证满足 Node.js 原生 crypto 的严格 PEM 格式）
function formatAlipayKey(key: string, type: 'PUBLIC' | 'PRIVATE'): string {
    if (!key) return '';
    const cleanKey = key.replace(/(-----BEGIN.*?-----|-----END.*?-----|\s+)/g, '');
    const chunked = cleanKey.match(/.{1,64}/g)?.join('\n') || cleanKey;
    const header = `-----BEGIN ${type === 'PRIVATE' ? 'RSA PRIVATE' : 'PUBLIC'} KEY-----\n`;
    const footer = `\n-----END ${type === 'PRIVATE' ? 'RSA PRIVATE' : 'PUBLIC'} KEY-----`;
    return header + chunked + footer;
}

// 1:1 完美复刻 Python 底层验签逻辑
function verifyAlipaySignature(publicKey: string, params: Record<string, any>, sign: string) {
    const data = { ...params };
    
    delete data.sign;
    delete data.sign_type;

    const keys = Object.keys(data).sort();
    const signStrings: string[] = [];
    
    for (const key of keys) {
        const value = data[key];
        if (value !== undefined && value !== null && value !== '') {
            signStrings.push(`${key}=${value}`);
        }
    }
    
    const signString = signStrings.join('&');
    
    try {
        const verify = crypto.createVerify('RSA-SHA256');
        verify.update(signString, 'utf8');
        return verify.verify(publicKey, sign, 'base64');
    } catch (e) {
        console.error('❌ [MANUAL VERIFY] Node crypto 验证抛出异常:', e);
        return false;
    }
}

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const params: Record<string, any> = {};
    for (const [key, value] of formData.entries()) {
        params[key] = value.toString();
    }

    console.log('\n🔔 [WEBHOOK] 收到原生支付宝回调，订单号:', params.out_trade_no);

    const sign = params.sign;
    if (!sign) {
        return new NextResponse('failure', { status: 400 });
    }

    const rawAlipayPubKey = process.env.ALIPAY_PUBLIC_KEY || '';
    const formattedPubKey = formatAlipayKey(rawAlipayPubKey, 'PUBLIC');

    const isValid = verifyAlipaySignature(formattedPubKey, params, sign);

    if (!isValid) {
      console.error('❌ [WEBHOOK] 原生验证算法判定签名失败！');
      return new NextResponse('failure', { status: 400 });
    }

    console.log('✅ [WEBHOOK] 原生验签成功！数据绝对安全！');

    const tradeStatus = params['trade_status'];
    if (tradeStatus !== 'TRADE_SUCCESS' && tradeStatus !== 'TRADE_FINISHED') {
      return new NextResponse('success'); 
    }

    const outTradeNo = params.out_trade_no;

    const { data: orderData, error: orderError } = await supabase.from('orders').select('*').eq('out_trade_no', outTradeNo).single();

    if (orderError || !orderData) {
        return new NextResponse('success'); 
    }

    if (orderData.status === 'PAID') {
        return new NextResponse('success');
    }

    const passbackStr = params['passback_params'];
    if (!passbackStr) return new NextResponse('success');

    const { userId, tier, duration } = JSON.parse(decodeURIComponent(passbackStr));
    
    // 🚀 核心更新 1：同时查出用户的 expiry_date 和 payments 历史账单
    const { data: profile } = await supabase.from('profiles').select('expiry_date, payments').eq('id', userId).single();

    let newExpiryDate = new Date();
    if (profile && profile.expiry_date) {
        const currentExpiry = new Date(profile.expiry_date);
        if (currentExpiry > new Date()) newExpiryDate = currentExpiry;
    }
    
    newExpiryDate.setMonth(newExpiryDate.getMonth() + (duration || 1));
    const finalExpiryStr = newExpiryDate.toISOString().split('T')[0];

    // 🚀 核心更新 2：组装新的账单明细，并追加到 JSON 数组中
    const currentPayments = Array.isArray(profile?.payments) ? profile.payments : [];
    
    // 把最新的一笔账单插到数组最前面（unshift），这样前端默认显示在最上面
    currentPayments.unshift({
        id: outTradeNo,                          // 订单号
        amount: params.total_amount,             // 支付宝实际扣款金额
        plan: `SPACE2 ${tier.toUpperCase()}`,    // 套餐名称
        date: new Date().toISOString().split('T')[0], // 支付日期 YYYY-MM-DD
        method: 'ALIPAY',                        // 支付方式
        status: 'PAID'                           // 状态
    });

    // 🚀 核心更新 3：三管齐下！同时更新 等级、有效期、账单数组！
    await supabase.from('profiles').update({ 
        tier: tier, 
        expiry_date: finalExpiryStr,
        payments: currentPayments // 把追加了新订单的数组写回数据库
    }).eq('id', userId);
    
    await supabase.from('orders').update({ status: 'PAID', trade_no: params.trade_no }).eq('out_trade_no', outTradeNo);

    console.log('✅✅✅ [WEBHOOK] 发货全面成功！记账完成！用户已升舱:', userId);
    return new NextResponse('success');

  } catch (error: any) {
    console.error('🚨 [WEBHOOK] 未知系统崩溃:', error);
    return new NextResponse('failure', { status: 500 });
  }
}