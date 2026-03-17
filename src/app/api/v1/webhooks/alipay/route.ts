import { NextResponse } from 'next/server';
import { AlipaySdk } from 'alipay-sdk';
import { createClient } from '@supabase/supabase-js';

// 初始化上帝权限的 Supabase
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    // 1. 获取支付宝发来的异步通知数据
    const formData = await request.formData();
    const params = Object.fromEntries(formData.entries());

    console.log('\n🔔 [WEBHOOK] 收到支付宝异步通知，单号：', params.out_trade_no);

    const alipaySdk = new AlipaySdk({
      appId: process.env.ALIPAY_APP_ID || '',
      privateKey: process.env.ALIPAY_PRIVATE_KEY || '',
      alipayPublicKey: process.env.ALIPAY_PUBLIC_KEY || '',
      camelcase: true,
    });

    // 2. 验签：确认真的是支付宝发来的，不是黑客伪造的
    const isValid = alipaySdk.checkNotifySign(params);
    if (!isValid) {
      console.error('❌ [WEBHOOK] 签名验证失败！');
      return new NextResponse('failure', { status: 400 });
    }

    // 3. 只处理支付成功的状态
    const tradeStatus = params['trade_status'];
    if (tradeStatus !== 'TRADE_SUCCESS' && tradeStatus !== 'TRADE_FINISHED') {
      return new NextResponse('success'); 
    }

    // 🚀 4. 打开支付宝退回来的“公文包” (passback_params)
    const passbackStr = params['passback_params'] as string;
    if (!passbackStr) {
        console.error('❌ [WEBHOOK] 找不到公文包透传参数！');
        return new NextResponse('success');
    }

    const { userId, tier, duration } = JSON.parse(decodeURIComponent(passbackStr));
    console.log(`📦 [WEBHOOK] 解析公文包成功！准备为用户 ${userId} 升舱为 ${tier}！`);

    // 5. 计算过期时间
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + (duration || 1));

    // 🚀 6. 直接暴力升舱！更新 profiles 表
    const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
            tier: tier,
            expiry_date: expiresAt.toISOString().split('T')[0] // 更新有效期
        })
        .eq('id', userId);

    if (updateError) {
        console.error('❌ [WEBHOOK] 数据库升舱失败:', updateError);
        return new NextResponse('failure', { status: 500 });
    }

    console.log(`✅ [WEBHOOK] 发货大成功！用户 ${userId} 已成为尊贵的 ${tier}！`);

    // 🚨 7. 必须给支付宝回复文本 success，否则它会一直疯狂重发
    return new NextResponse('success');

  } catch (error: any) {
    console.error('🚨 [WEBHOOK 严重崩溃]:', error);
    return new NextResponse('failure', { status: 500 });
  }
}