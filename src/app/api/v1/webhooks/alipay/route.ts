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

// 🚀 1:1 完美复刻你提供的 Python 底层验签逻辑
function verifyAlipaySignature(publicKey: string, params: Record<string, any>, sign: string) {
    const data = { ...params };
    
    // 1. 移除 sign 和 sign_type (跟你 Python 里 params.pop 一模一样)
    delete data.sign;
    delete data.sign_type;

    // 2. 对 params 字典按 key 排序 (跟你 Python 里 sorted(params.items()) 一模一样)
    const keys = Object.keys(data).sort();
    const signStrings: string[] = [];
    
    for (const key of keys) {
        const value = data[key];
        // 过滤空值并拼接
        if (value !== undefined && value !== null && value !== '') {
            signStrings.push(`${key}=${value}`);
        }
    }
    
    // 3. 拼接成 query_string (跟你 Python 里 '&'.join 一模一样)
    const signString = signStrings.join('&');
    
    console.log('\n🔍 [MANUAL VERIFY] 提取出的待验签长字符串 (Query String):\n', signString);
    console.log('\n🔍 [MANUAL VERIFY] 提取出的签名值 (Sign):\n', sign);

    // 4. 使用公钥进行 RSA2 (RSA-SHA256) 验签 (跟你 Python 里 pkcs1_15.new().verify 一模一样)
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
    // 使用 formData 抓取原生数据，转化为纯对象，完美避开 Next.js 原型链污染
    const formData = await request.formData();
    const params: Record<string, any> = {};
    for (const [key, value] of formData.entries()) {
        params[key] = value.toString();
    }

    console.log('\n🔔 [WEBHOOK] 收到原生支付宝回调，订单号:', params.out_trade_no);

    const sign = params.sign;
    if (!sign) {
        console.error('❌ [WEBHOOK] 回调中没有找到 sign 参数！');
        return new NextResponse('failure', { status: 400 });
    }

    // 加载支付宝公钥
    const rawAlipayPubKey = process.env.ALIPAY_PUBLIC_KEY || '';
    const formattedPubKey = formatAlipayKey(rawAlipayPubKey, 'PUBLIC');

    // 🚀 调用我们自己手写的原生验证器
    const isValid = verifyAlipaySignature(formattedPubKey, params, sign);

    if (!isValid) {
      console.error('❌ [WEBHOOK] 原生验证算法判定签名失败！');
      console.error('🚨 请务必检查：Vercel里的 ALIPAY_PUBLIC_KEY 是否真的是【支付宝公钥】！(千万不能是应用公钥)');
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
        console.error('❌ [WEBHOOK] 数据库中未找到订单:', outTradeNo);
        return new NextResponse('success'); 
    }

    if (orderData.status === 'PAID') {
        console.log('⚠️ [WEBHOOK] 订单早已处理，拦截重复发货:', outTradeNo);
        return new NextResponse('success');
    }

    const passbackStr = params['passback_params'];
    if (!passbackStr) return new NextResponse('success');

    const { userId, tier, duration } = JSON.parse(decodeURIComponent(passbackStr));
    
    const { data: profile } = await supabase.from('profiles').select('expiry_date').eq('id', userId).single();

    let newExpiryDate = new Date();
    if (profile && profile.expiry_date) {
        const currentExpiry = new Date(profile.expiry_date);
        if (currentExpiry > new Date()) newExpiryDate = currentExpiry;
    }
    
    newExpiryDate.setMonth(newExpiryDate.getMonth() + (duration || 1));
    const finalExpiryStr = newExpiryDate.toISOString().split('T')[0];

    // 数据库双写操作：更新 VIP 与 订单状态
    await supabase.from('profiles').update({ tier: tier, expiry_date: finalExpiryStr }).eq('id', userId);
    await supabase.from('orders').update({ status: 'PAID', trade_no: params.trade_no }).eq('out_trade_no', outTradeNo);

    console.log('✅✅✅ [WEBHOOK] 发货全面成功！用户已升舱:', userId);
    return new NextResponse('success');

  } catch (error: any) {
    console.error('🚨 [WEBHOOK] 未知系统崩溃:', error);
    return new NextResponse('failure', { status: 500 });
  }
}