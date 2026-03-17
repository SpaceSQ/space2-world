import { NextResponse } from 'next/server';
import { AlipaySdk } from 'alipay-sdk';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tier, email, uin, price, duration } = body; 

    const rawPrivateKey = process.env.ALIPAY_PRIVATE_KEY;
    const rawAppId = process.env.ALIPAY_APP_ID;
    const rawPublicKey = process.env.ALIPAY_PUBLIC_KEY;

    if (!rawPrivateKey || !rawAppId) {
        console.error('⚠️ [ALIPAY] 支付宝密钥缺失！');
        return NextResponse.json({ 
            paymentUrl: null, 
            error: '服务器缺少支付宝密钥配置。' 
        }, { status: 500 }); 
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

    // 🚀 核心修复：终极域名自动寻路机制！
    // 优先级 1：你配置的 NEXT_PUBLIC_SITE_URL
    // 优先级 2：Vercel 自动注入的 VERCEL_PROJECT_PRODUCTION_URL 或 VERCEL_URL
    // 优先级 3：本地开发 localhost
    let baseUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (!baseUrl) {
        const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
        baseUrl = vercelUrl ? `https://${vercelUrl}` : 'http://localhost:3000';
    }
    
    // 去除末尾可能带有的斜杠，防止双斜杠报错
    baseUrl = baseUrl.replace(/\/$/, '');

    console.log(`[ALIPAY] 当前环境的回调域名将被设置为: ${baseUrl}`);

    const paymentUrl = alipaySdk.pageExec('alipay.trade.page.pay', {
      method: 'GET',
      returnUrl: `${baseUrl}/?payment=success`,
      notifyUrl: `${baseUrl}/api/v1/webhooks/alipay`, 
      bizContent: {
        outTradeNo: `ORDER_${Date.now()}_${uin}`,
        productCode: 'FAST_INSTANT_TRADE_PAY',
        totalAmount: amount.toFixed(2), 
        subject: `Space2 ${tier} Estate License ${duration ? `(${duration} Months)` : ''}`,
        body: `Breeder Email: ${email}`,
      }
    });

    return NextResponse.json({ paymentUrl: paymentUrl });

  } catch (error: any) {
    console.error('🚨 [ALIPAY 严重错误]:', error.message || error);
    return NextResponse.json({ paymentUrl: null, error: error.message }, { status: 500 });
  }
}