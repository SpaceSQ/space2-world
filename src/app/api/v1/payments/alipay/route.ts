import { NextResponse } from 'next/server';
import { AlipaySdk } from 'alipay-sdk';

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

    const alipaySdk = new AlipaySdk({
      appId: rawAppId,
      privateKey: rawPrivateKey,      
      alipayPublicKey: rawPublicKey,  
      gateway: 'https://openapi.alipay.com/gateway.do', 
      timeout: 5000,
      camelcase: true,
    });
    
    const amount = price || (tier === 'VIP' ? 72.00 : 360.00);

    if (!amount) {
        return NextResponse.json({ error: '无效的订单金额' }, { status: 400 });
    }

    // 🌐 自动寻路域名机制
    let baseUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (!baseUrl) {
        const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
        baseUrl = vercelUrl ? `https://${vercelUrl}` : 'http://localhost:3000';
    }
    baseUrl = baseUrl.replace(/\/$/, '');

    // 🚀 核心黑魔法：把用户的 ID 和购买的层级打包成字符串，让支付宝帮我们保管！
    const passbackObj = { userId: userId, tier: tier, duration: duration, amount: amount };
    const passbackParams = encodeURIComponent(JSON.stringify(passbackObj));

    const outTradeNo = `ORDER_${Date.now()}_${uin}`;

    const paymentUrl = alipaySdk.pageExec('alipay.trade.page.pay', {
      method: 'GET',
      returnUrl: `${baseUrl}/?payment=success`,
      notifyUrl: `${baseUrl}/api/v1/webhooks/alipay`, 
      bizContent: {
        outTradeNo: outTradeNo,
        productCode: 'FAST_INSTANT_TRADE_PAY',
        totalAmount: amount.toFixed(2), 
        subject: `Space2 ${tier} Estate License`,
        passbackParams: passbackParams, // 👈 支付宝会把这个公文包原样退回给 Webhook！
      }
    });

    console.log('✅ [ALIPAY] 支付宝链接生成成功! 订单号:', outTradeNo);
    return NextResponse.json({ paymentUrl: paymentUrl });

  } catch (error: any) {
    console.error('🚨 [ALIPAY 严重错误]:', error.message || error);
    return NextResponse.json({ paymentUrl: null, error: error.message }, { status: 500 });
  }
}