import { NextResponse } from 'next/server';
import { AlipaySdk } from 'alipay-sdk';
import { createClient } from '@supabase/supabase-js';

// 初始化 Supabase (使用 Service Key 绕过权限，确保订单能成功写入)
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // 💡 1. 完美接收前端传来的所有数据，包括真实价格 (price) 和时长 (duration)
    const { tier, email, uin, userId, price, duration } = body; 

    const rawPrivateKey = process.env.ALIPAY_PRIVATE_KEY;
    const rawAppId = process.env.ALIPAY_APP_ID;
    const rawPublicKey = process.env.ALIPAY_PUBLIC_KEY;

    // 🚨 防撞墙：如果环境变量没配好，必须给前端返回明确的错误，而不是偷偷返回 null
    if (!rawPrivateKey || !rawAppId) {
        console.error('⚠️ [ALIPAY] 环境变量缺失！请检查 Vercel 的 Environment Variables');
        return NextResponse.json({ paymentUrl: null, error: '支付宝密钥配置缺失' }, { status: 500 }); 
    }

    // 💡 2. 直接使用前端计算好的真实价格
    const amount = price;
    if (!amount) {
        return NextResponse.json({ error: '无效的订单金额' }, { status: 400 });
    }

    // 3. 生成你在系统内的唯一订单流水号
    const outTradeNo = `ORDER_${Date.now()}_${uin.slice(-6)}`;

    // 🚀 4. 极度重要：把这笔订单写进数据库！
    // 这样等用户付完钱，支付宝顺着网线找回来的时候，系统才知道这笔钱是谁付的。
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
            console.error('🚨 订单写入数据库失败:', dbError);
            return NextResponse.json({ paymentUrl: null, error: '创建订单失败，请检查数据库配置' }, { status: 500 });
        }
    }

    // 5. 初始化支付宝 SDK 生成支付链接
    const alipaySdk = new AlipaySdk({
      appId: rawAppId,
      privateKey: rawPrivateKey,      
      alipayPublicKey: rawPublicKey,  
      gateway: 'https://openapi.alipay.com/gateway.do', 
      timeout: 5000,
      camelcase: true,
    });

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    const paymentUrl = alipaySdk.pageExec('alipay.trade.page.pay', {
      method: 'GET',
      returnUrl: `${baseUrl}/?payment=success`, // 支付完跳回你的大盘
      notifyUrl: `${baseUrl}/api/v1/webhooks/alipay`, // 支付宝偷偷发通知的接口
      bizContent: {
        outTradeNo: outTradeNo,
        productCode: 'FAST_INSTANT_TRADE_PAY',
        totalAmount: amount.toFixed(2), // 💡 动态的金额在这里生效了！
        subject: `Space2 ${tier} Estate License (${duration} Months)`, // 订单标题显示购买了几个月
        body: `Breeder Email: ${email}`,
      }
    });

    console.log(`✅ [ALIPAY] ${tier} 套餐下单成功，金额: ¥${amount}，即将跳转...`);
    return NextResponse.json({ paymentUrl: paymentUrl });

  } catch (error: any) {
    console.error('🚨 [ALIPAY CRITICAL ERROR]:', error.message || error);
    return NextResponse.json({ paymentUrl: null, error: error.message }, { status: 500 });
  }
}