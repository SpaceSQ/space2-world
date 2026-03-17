import { NextResponse } from 'next/server';
import { AlipaySdk } from 'alipay-sdk';
import { createClient } from '@supabase/supabase-js';

// 初始化数据库
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
        return NextResponse.json({ paymentUrl: null, error: '缺少支付宝密钥配置' }, { status: 500 }); 
    }

    const amount = price || (tier === 'VIP' ? 72.00 : 360.00);
    if (!amount) return NextResponse.json({ error: '无效的订单金额' }, { status: 400 });

    const outTradeNo = `ORDER_${Date.now()}_${uin.slice(-6)}`;

    // 🚀 核心修复：必须先在数据库里建一个 PENDING 的单子！
    if (userId) {
        const { error: dbError } = await supabase.from('orders').insert({
            user_id: userId,
            user_uin: uin,
            out_trade_no: outTradeNo,
            plan_type: tier,
            amount: amount,
            status: 'PENDING'
        });
        if (dbError) console.error('🚨 [ALIPAY] 订单写入数据库失败:', dbError);
    }

    // 🚀 终极防掉单：直接写死你部署在 Vercel 上的真实公网域名！
    // ⚠️ 请把 https://你的真实域名.com 换成你 Vercel 上的正式网址！
    // 比如：https://space2-world.vercel.app 或者你绑定的独立域名
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.space2.world'; 
    
    const paymentUrl = alipaySdk.pageExec('alipay.trade.page.pay', {
      method: 'GET',
      returnUrl: `${baseUrl}/?payment=success`,
      notifyUrl: `${baseUrl}/api/v1/webhooks/alipay`, // 👈 现在支付宝绝对能顺着这个公网地址找到你！
      bizContent: {
        outTradeNo: outTradeNo,
        productCode: 'FAST_INSTANT_TRADE_PAY',
        totalAmount: amount.toFixed(2), 
        subject: `Space2 ${tier} Estate License`,
        passbackParams: passbackParams, 
      }
    });

    // 🚀 公文包透传参数
    const passbackObj = { userId: userId, tier: tier, duration: duration, amount: amount };
    const passbackParams = encodeURIComponent(JSON.stringify(passbackObj));

    const alipaySdk = new AlipaySdk({
      appId: rawAppId,
      privateKey: rawPrivateKey,      
      alipayPublicKey: rawPublicKey,  
      gateway: 'https://openapi.alipay.com/gateway.do', 
      timeout: 5000,
      camelcase: true,
    });

    const paymentUrl = alipaySdk.pageExec('alipay.trade.page.pay', {
      method: 'GET',
      returnUrl: `${baseUrl}/?payment=success`,
      notifyUrl: `${baseUrl}/api/v1/webhooks/alipay`, // 👈 确保这里指向你的 Webhook
      bizContent: {
        outTradeNo: outTradeNo,
        productCode: 'FAST_INSTANT_TRADE_PAY',
        totalAmount: amount.toFixed(2), 
        subject: `Space2 ${tier} Estate License`,
        passbackParams: passbackParams, 
      }
    });

    console.log('✅ [ALIPAY] 下单成功! 订单号:', outTradeNo);
    return NextResponse.json({ paymentUrl: paymentUrl });

  } catch (error: any) {
    console.error('🚨 [ALIPAY 严重错误]:', error.message || error);
    return NextResponse.json({ paymentUrl: null, error: error.message }, { status: 500 });
  }
}