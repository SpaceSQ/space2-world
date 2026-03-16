import { NextResponse } from 'next/server';
import { AlipaySdk } from 'alipay-sdk';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tier, email, uin } = body;

    const rawPrivateKey = process.env.ALIPAY_PRIVATE_KEY;
    const rawAppId = process.env.ALIPAY_APP_ID;
    const rawPublicKey = process.env.ALIPAY_PUBLIC_KEY;

    // 1. 防撞墙：没配环境变量直接走 Mock
    if (!rawPrivateKey || !rawAppId) {
        console.log('⚠️ [ALIPAY] API keys missing! Triggering MOCK flow.');
        return NextResponse.json({ paymentUrl: null }); 
    }

    // 2. 原汁原味：不加任何清洗，直接把完美包含回车的原生字符串喂给 SDK
    const alipaySdk = new AlipaySdk({
      appId: rawAppId,
      privateKey: rawPrivateKey,      // 纯天然私钥
      alipayPublicKey: rawPublicKey,  // 纯天然公钥
      gateway: 'https://openapi.alipay.com/gateway.do', 
      timeout: 5000,
      camelcase: true,
    });
    
    const priceMap: Record<string, number> = { 'VIP': 72.00, 'SVIP': 360.00 };
    const amount = priceMap[tier];

    if (!amount) {
        return NextResponse.json({ error: 'Invalid Tier' }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    // 3. 生成链接
    const paymentUrl = alipaySdk.pageExec('alipay.trade.page.pay', {
      method: 'GET',
      returnUrl: `${baseUrl}/?payment=success`,
      notifyUrl: `${baseUrl}/api/v1/webhooks/alipay`,
      bizContent: {
        outTradeNo: `ORDER_${Date.now()}_${uin}`,
        productCode: 'FAST_INSTANT_TRADE_PAY',
        totalAmount: amount.toFixed(2),
        subject: `Space2 ${tier} Estate License`,
        body: `Breeder Email: ${email}`,
      }
    });

    console.log('✅ [ALIPAY] URL Generated Successfully!');
    return NextResponse.json({ paymentUrl: paymentUrl });

  } catch (error: any) {
    console.error('🚨 [ALIPAY CRITICAL ERROR]:', error.message || error);
    return NextResponse.json({ paymentUrl: null, error: error.message });
  }
}