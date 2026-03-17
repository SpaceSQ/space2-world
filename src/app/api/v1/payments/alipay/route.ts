import { NextResponse } from 'next/server';
import { AlipaySdk } from 'alipay-sdk';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tier, email, uin, price, duration, userId } = body; 

    console.log('[ALIPAY-CREATE] Request received:', { userId, tier, uin, price });

    if (!userId) {
        console.error('[ALIPAY-CREATE] ERROR: userId is missing! Order will NOT be saved to DB.');
    }

    const rawPrivateKey = process.env.ALIPAY_PRIVATE_KEY;
    const rawAppId = process.env.ALIPAY_APP_ID;
    const rawPublicKey = process.env.ALIPAY_PUBLIC_KEY;

    if (!rawPrivateKey || !rawAppId) {
        return NextResponse.json({ paymentUrl: null, error: 'Missing Alipay Keys' }, { status: 500 }); 
    }

    const amount = price || (tier === 'VIP' ? 1.00 : 360.00);
    const outTradeNo = 'ORDER_' + Date.now() + '_' + uin.slice(-6);

    // Save order to DB
    if (userId) {
        const { error: dbError } = await supabase.from('orders').insert({
            user_id: userId,
            user_uin: uin,
            out_trade_no: outTradeNo,
            plan_type: tier,
            amount: amount,
            status: 'PENDING'
        });
        if (dbError) {
            console.error('[ALIPAY-CREATE] DB Insert Error:', dbError);
        } else {
            console.log('[ALIPAY-CREATE] Order saved to DB:', outTradeNo);
        }
    }

    // 🚨 强制写死你的真实公网域名，确保支付宝绝对不会迷路
    const baseUrl = 'https://www.space2.world';
    const notifyUrl = baseUrl + '/api/v1/webhooks/alipay';
    
    console.log('[ALIPAY-CREATE] Setting Notify URL to:', notifyUrl);

    const passbackObj = { userId: userId, tier: tier, duration: duration, amount: amount };
    const passbackParams = encodeURIComponent(JSON.stringify(passbackObj));

    const alipaySdk = new AlipaySdk({
      appId: rawAppId,
      privateKey: rawPrivateKey,      
      alipayPublicKey: rawPublicKey,  
      gateway: 'https://openapi.alipay.com/gateway.do', 
      timeout: 5000,
      camelcase: true
    });

    const subjectTitle = 'Space2 ' + tier + ' Estate License';

    const paymentUrl = alipaySdk.pageExec('alipay.trade.page.pay', {
      method: 'GET',
      returnUrl: baseUrl + '/?payment=success',
      notifyUrl: notifyUrl, // 👈 给支付宝的回调指路明灯
      bizContent: {
        outTradeNo: outTradeNo,
        productCode: 'FAST_INSTANT_TRADE_PAY',
        totalAmount: amount.toFixed(2), 
        subject: subjectTitle,
        passbackParams: passbackParams
      }
    });

    console.log('[ALIPAY-CREATE] Payment URL generated!');
    return NextResponse.json({ paymentUrl: paymentUrl });

  } catch (error: any) {
    console.error('[ALIPAY-CREATE] Route Error:', error.message || error);
    return NextResponse.json({ paymentUrl: null, error: error.message }, { status: 500 });
  }
}