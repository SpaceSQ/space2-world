import { NextResponse } from 'next/server';
import { AlipaySdk } from 'alipay-sdk';
import { createClient } from '@supabase/supabase-js';

// 强制动态路由，防止 Vercel 把它当成静态文件缓存
export const dynamic = 'force-dynamic';

// 🚀 探测雷达：允许通过浏览器直接访问来测试它死没死
export async function GET() {
    return new NextResponse("Webhook endpoint is alive and reachable!");
}

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(request: Request) {
  try {
    console.log('[WEBHOOK] POST Request received!');
    
    const formData = await request.formData();
    const params = Object.fromEntries(formData.entries());

    console.log('[WEBHOOK] Trade No:', params.out_trade_no);

    const alipaySdk = new AlipaySdk({
      appId: process.env.ALIPAY_APP_ID || '',
      privateKey: process.env.ALIPAY_PRIVATE_KEY || '',
      alipayPublicKey: process.env.ALIPAY_PUBLIC_KEY || '',
      camelcase: true
    });

    // 1. Verify Signature
    const isValid = alipaySdk.checkNotifySign(params);
    if (!isValid) {
      console.error('[WEBHOOK] Signature verification failed');
      return new NextResponse('failure', { status: 400 });
    }

    // 2. Check trade status
    const tradeStatus = params['trade_status'];
    if (tradeStatus !== 'TRADE_SUCCESS' && tradeStatus !== 'TRADE_FINISHED') {
      return new NextResponse('success'); 
    }

    const outTradeNo = params.out_trade_no as string;

    // 3. Check order in DB
    const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('out_trade_no', outTradeNo)
        .single();

    if (orderError || !orderData) {
        console.error('[WEBHOOK] Order not found in DB:', outTradeNo);
        return new NextResponse('success'); 
    }

    if (orderData.status === 'PAID') {
        console.log('[WEBHOOK] Order already PAID:', outTradeNo);
        return new NextResponse('success');
    }

    // 4. Parse passback params
    const passbackStr = params['passback_params'] as string;
    if (!passbackStr) {
        console.error('[WEBHOOK] Missing passback parameters');
        return new NextResponse('success');
    }

    const { userId, tier, duration } = JSON.parse(decodeURIComponent(passbackStr));
    
    // 5. Update user expiry date
    const { data: profile } = await supabase.from('profiles').select('expiry_date').eq('id', userId).single();

    let newExpiryDate = new Date();
    if (profile && profile.expiry_date) {
        const currentExpiry = new Date(profile.expiry_date);
        if (currentExpiry > new Date()) {
            newExpiryDate = currentExpiry;
        }
    }
    
    newExpiryDate.setMonth(newExpiryDate.getMonth() + (duration || 1));
    const finalExpiryStr = newExpiryDate.toISOString().split('T')[0];

    // 6. Update Database
    await supabase.from('profiles').update({ tier: tier, expiry_date: finalExpiryStr }).eq('id', userId);
    await supabase.from('orders').update({ status: 'PAID', trade_no: params.trade_no }).eq('out_trade_no', outTradeNo);

    console.log('[WEBHOOK] Success! User upgraded:', userId);
    return new NextResponse('success');

  } catch (error: any) {
    console.error('[WEBHOOK] Error:', error);
    return new NextResponse('failure', { status: 500 });
  }
}