import { NextResponse } from 'next/server';
import { AlipaySdk } from 'alipay-sdk';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
    return new NextResponse("Webhook endpoint is alive and reachable!");
}

// 🚀 终极杀器：自动将你填的任何乱七八糟的公钥/私钥，矫正为 Node.js 强制要求的 64 位标准 PEM 格式
function formatAlipayKey(key: string, type: 'PUBLIC' | 'PRIVATE'): string {
    if (!key) return '';
    const cleanKey = key.replace(/(-----BEGIN.*?-----|-----END.*?-----|\s+)/g, '');
    const chunked = cleanKey.match(/.{1,64}/g)?.join('\n') || cleanKey;
    const header = `-----BEGIN ${type === 'PRIVATE' ? 'RSA PRIVATE' : 'PUBLIC'} KEY-----\n`;
    const footer = `\n-----END ${type === 'PRIVATE' ? 'RSA PRIVATE' : 'PUBLIC'} KEY-----`;
    return header + chunked + footer;
}

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(request: Request) {
  try {
    // 🚀 终极杀器 2：放弃容易变形的 formData，直接读取最底层的原生文本进行无损解析！
    const bodyText = await request.text();
    const urlParams = new URLSearchParams(bodyText);
    const params = Object.fromEntries(urlParams.entries());

    console.log('[WEBHOOK] Trade No:', params.out_trade_no);

    const alipaySdk = new AlipaySdk({
      appId: process.env.ALIPAY_APP_ID || '',
      privateKey: formatAlipayKey(process.env.ALIPAY_PRIVATE_KEY || '', 'PRIVATE'),
      alipayPublicKey: formatAlipayKey(process.env.ALIPAY_PUBLIC_KEY || '', 'PUBLIC'),
      camelcase: true
    });

    // 1. 开始验签
    const isValid = alipaySdk.checkNotifySign(params);
    if (!isValid) {
      console.error('❌ [WEBHOOK] 签名验证失败！(请核对支付宝控制台的【支付宝公钥】是否与Vercel中一致)');
      return new NextResponse('failure', { status: 400 });
    }

    console.log('✅ [WEBHOOK] 签名验证成功！是支付宝官方发来的消息！');

    const tradeStatus = params['trade_status'];
    if (tradeStatus !== 'TRADE_SUCCESS' && tradeStatus !== 'TRADE_FINISHED') {
      return new NextResponse('success'); 
    }

    const outTradeNo = params.out_trade_no as string;

    const { data: orderData, error: orderError } = await supabase.from('orders').select('*').eq('out_trade_no', outTradeNo).single();

    if (orderError || !orderData) {
        console.error('[WEBHOOK] Order not found:', outTradeNo);
        return new NextResponse('success'); 
    }

    if (orderData.status === 'PAID') {
        return new NextResponse('success');
    }

    const passbackStr = params['passback_params'] as string;
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

    await supabase.from('profiles').update({ tier: tier, expiry_date: finalExpiryStr }).eq('id', userId);
    await supabase.from('orders').update({ status: 'PAID', trade_no: params.trade_no }).eq('out_trade_no', outTradeNo);

    console.log('✅ [WEBHOOK] 发货大成功! User upgraded:', userId);
    return new NextResponse('success');

  } catch (error: any) {
    console.error('[WEBHOOK] Error:', error);
    return new NextResponse('failure', { status: 500 });
  }
}