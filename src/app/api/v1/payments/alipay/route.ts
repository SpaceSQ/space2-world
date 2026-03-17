import { NextResponse } from 'next/server';
import { AlipaySdk } from 'alipay-sdk';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // 💡 关键点：这里接收了前端传过来的 price（真实金额，72 / 180 / 600）
    const { tier, email, uin, price } = body; 

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
    
    // 💡 关键点：不再写死 priceMap，而是使用前端传递进来的真实价格，如果没传则给个保底值
    const amount = price || (tier === 'SVIP' ? 360.00 : 72.00);

    if (!amount) {
        return NextResponse.json({ error: 'Invalid Amount' }, { status: 400 });
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
        totalAmount: amount.toFixed(2), // 这里的金额现在会根据用户选的时长变化了！
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