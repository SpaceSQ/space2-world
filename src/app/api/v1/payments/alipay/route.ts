import { NextResponse } from 'next/server';
import { AlipaySdk } from 'alipay-sdk';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tier, email, uin, price, duration, userId } = body; 

    const rawPrivateKey = process.env.ALIPAY_PRIVATE_KEY;
    const rawAppId = process.env.ALIPAY_APP_ID;
    const rawPublicKey = process.env.ALIPAY_PUBLIC_KEY;

    if (!rawPrivateKey || !rawAppId) {
        return NextResponse.json({ paymentUrl: null, error: 'Missing Alipay Keys' }, { status: 500 }); 
    }

    const amount = price || (tier === 'VIP' ? 72.00 : 360.00);
    if (!amount) return NextResponse.json({ error: 'Invalid Amount' }, { status: 400 });

    const outTradeNo = 'ORDER_' + Date.now() + '_' + uin.slice(-6);

    // Insert order to database
    if (userId) {
        const { error: dbError } = await supabase.from('orders').insert({
            user_id: userId,
            user_uin: uin,
            out_trade_no: outTradeNo,
            plan_type: tier,
            amount: amount,
            status: 'PENDING'
        });
        if (dbError) console.error('DB Insert Error:', dbError);
    }

    // Auto resolve domain
    let baseUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (!baseUrl) {
        const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
        baseUrl = vercelUrl ? 'https://www.space2.world' + vercelUrl : 'http://localhost:3000';
    }
    baseUrl = baseUrl.replace(/\/$/, '');

    // Passback params for webhook
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

    const subjectTitle = 'Space2 ' + tier + ' Estate License' + (duration ? ' (' + duration + ' Months)' : '');

    const paymentUrl = alipaySdk.pageExec('alipay.trade.page.pay', {
      method: 'GET',
      returnUrl: baseUrl + '/?payment=success',
      notifyUrl: baseUrl + '/api/v1/webhooks/alipay',
      bizContent: {
        outTradeNo: outTradeNo,
        productCode: 'FAST_INSTANT_TRADE_PAY',
        totalAmount: amount.toFixed(2), 
        subject: subjectTitle,
        passbackParams: passbackParams
      }
    });

    console.log('Order generated successfully: ', outTradeNo);
    return NextResponse.json({ paymentUrl: paymentUrl });

  } catch (error: any) {
    console.error('Payment Route Error:', error.message || error);
    return NextResponse.json({ paymentUrl: null, error: error.message }, { status: 500 });
  }
}