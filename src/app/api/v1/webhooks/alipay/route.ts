import { NextResponse } from 'next/server';
import { AlipaySdk } from 'alipay-sdk';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const params = Object.fromEntries(formData.entries());

    console.log('\n🔔 [WEBHOOK] 收到支付宝异步通知，单号：', params.out_trade_no);

    const alipaySdk = new AlipaySdk({
      appId: process.env.ALIPAY_APP_ID || '',
      privateKey: process.env.ALIPAY_PRIVATE_KEY || '',
      alipayPublicKey: process.env.ALIPAY_PUBLIC_KEY || '',
      camelcase: true,
    });

    // 1. 验证签名（之前报错就是这里没过，如果你已经改对了公钥，这次就会过）
    const isValid = alipaySdk.checkNotifySign(params);
    if (!isValid) {
      console.error('❌ [WEBHOOK] 签名验证失败！请检查 ALIPAY_PUBLIC_KEY');
      return new NextResponse('failure', { status: 400 });
    }

    // 2. 只处理支付成功的通知
    const tradeStatus = params['trade_status'];
    if (tradeStatus !== 'TRADE_SUCCESS' && tradeStatus !== 'TRADE_FINISHED') {
      return new NextResponse('success'); 
    }

    const outTradeNo = params.out_trade_no as string;

    // 连接数据库
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 3. 【防重护盾】：去数据库查这个订单
    const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('out_trade_no', outTradeNo)
        .single();

    if (orderError || !orderData) {
        console.error(`❌ [WEBHOOK] 数据库中找不到此订单: ${outTradeNo}`);
        return new NextResponse('success'); 
    }

    if (orderData.status === 'PAID') {
        console.log(`⚠️ [WEBHOOK] 订单 ${outTradeNo} 已处理过，跳过。`);
        return new NextResponse('success');
    }

    // 4. 解析公文包
    const passbackStr = params['passback_params'] as string;
    if (!passbackStr) {
        console.error('❌ [WEBHOOK] 找不到透传参数！');
        return new NextResponse('success');
    }

    const { userId, tier, duration } = JSON.parse(decodeURIComponent(passbackStr));
    
    // 5. 【叠加引擎】：查询用户当前的有效期
    const { data: profile } = await supabase.from('profiles').select('expiry_date').eq('id', userId).single();

    let newExpiryDate = new Date();
    if (profile && profile.expiry_date) {
        const currentExpiry = new Date(profile.expiry_date);
        if (currentExpiry > new Date()) {
            newExpiryDate = currentExpiry;
        }
    }
    
    // 加上他买的月份
    newExpiryDate.setMonth(newExpiryDate.getMonth() + (duration || 1));
    const finalExpiryStr = newExpiryDate.toISOString().split('T')[0];

    // 6. 开启升舱！更新用户等级 + 标记订单已完成
    await supabase.from('profiles').update({ tier: tier, expiry_date: finalExpiryStr }).eq('id', userId);
    await supabase.from('orders').update({ status: 'PAID', trade_no: params.trade_no }).eq('out_trade_no', outTradeNo);

    console.log(`✅ [WEBHOOK] 发货大成功！用户 ${userId} 已升舱为 ${tier}，有效期至 ${finalExpiryStr}！`);

    // 🚨 7. 必须回复纯文本的 success
    return new NextResponse('success');

  } catch (error: any) {
    console.error('🚨 [WEBHOOK 严重崩溃]:', error);
    return new NextResponse('failure', { status: 500 });
  }
}