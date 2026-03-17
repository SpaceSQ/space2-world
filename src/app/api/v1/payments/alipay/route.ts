import { NextResponse } from 'next/server';
import { AlipaySdk } from 'alipay-sdk';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

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
    const body = await request.json();
    const { tier, email, uin, price, duration, userId } = body; 

    if (!userId) console.error('[ALIPAY-CREATE] ERROR: userId is missing!');

    const rawPrivateKey = process.env.ALIPAY_PRIVATE_KEY;
    const rawAppId = process.env.ALIPAY_APP_ID;
    const rawPublicKey = process.env.ALIPAY_PUBLIC_KEY;

    if (!rawPrivateKey || !rawAppId) return NextResponse.json({ paymentUrl: null, error: 'Missing Keys' }, { status: 500 }); 

    const amount = price || (tier === 'VIP' ? 1.00 : 360.00);
    const outTradeNo = 'ORDER_' + Date.now() + '_' + uin.slice(-6);

    if (userId) {
        await supabase.from('orders').insert({
            user_id: userId, user_uin: uin, out_trade_no: outTradeNo,
            plan_type: tier, amount: amount, status: 'PENDING'
        });
    }

    const baseUrl = 'https://www.space2.world';
    const notifyUrl = baseUrl + '/api/v1/webhooks/alipay';
    
    const passbackObj = { userId: userId, tier: tier, duration: duration, amount: amount };
    const passbackParams = encodeURIComponent(JSON.stringify(passbackObj));

    const alipaySdk = new AlipaySdk({
      appId: rawAppId,
      // 🚀 修复点：在这里加上 || '' 兜底，TypeScript 就不会报错了！
      privateKey: formatAlipayKey(rawPrivateKey || '', 'PRIVATE'),      
      alipayPublicKey: formatAlipayKey(rawPublicKey || '', 'PUBLIC'),  
      gateway: 'https://openapi.alipay.com/gateway.do', 
      timeout: 5000,
      camelcase: true
    });

    const paymentUrl = alipaySdk.pageExec('alipay.trade.page.pay', {
      method: 'GET',
      returnUrl: baseUrl + '/?payment=success',
      notifyUrl: notifyUrl,
      bizContent: {
        outTradeNo: outTradeNo,
        productCode: 'FAST_INSTANT_TRADE_PAY',
        totalAmount: amount.toFixed(2), 
        subject: 'Space2 ' + tier + ' Estate License',
        passbackParams: passbackParams
      }
    });

    return NextResponse.json({ paymentUrl: paymentUrl });
  } catch (error: any) {
    return NextResponse.json({ paymentUrl: null, error: error.message }, { status: 500 });
  }
}