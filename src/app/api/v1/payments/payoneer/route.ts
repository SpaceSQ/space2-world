import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { tier, email, uin } = await request.json();

    // 🔥 终极防御：如果没有配置海外收款 Token，直接降级走本地沙盒测试流
    const authToken = process.env.PAYONEER_ACCESS_TOKEN;
    if (!authToken) {
        console.log('⚠️ [PAYONEER] No access token found. Triggering frontend MOCK PAYMENT flow.');
        return NextResponse.json({ paymentUrl: null });
    }

    const priceMap = { 'VIP': 10.00, 'SVIP': 50.00 };
    const amount = priceMap[tier as keyof typeof priceMap];

    if (!amount) return NextResponse.json({ error: 'Invalid Tier' }, { status: 400 });

    const PAYONEER_API_URL = process.env.PAYONEER_ENV === 'live' 
        ? 'https://api.payoneer.com/v1/checkout/sessions' 
        : 'https://api.sandbox.payoneer.com/v1/checkout/sessions';

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    const payload = {
      transactionId: `ORDER_${Date.now()}_${uin}`,
      integration: "HOSTED", 
      style: { theme: "DARK" },
      payment: {
          amount: amount,
          currency: "USD",
          reference: `Space2 ${tier} Estate License`
      },
      customer: { email: email, id: uin },
      redirect: {
          returnUrl: `${baseUrl}/?payment=success`,
          cancelUrl: `${baseUrl}/?payment=cancel`
      }
    };

    const response = await fetch(PAYONEER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.interaction.reason);

    return NextResponse.json({ paymentUrl: data.links.checkout });

  } catch (error: any) {
    console.error('Payoneer API Error:', error);
    return NextResponse.json({ paymentUrl: null, error: error.message });
  }
}