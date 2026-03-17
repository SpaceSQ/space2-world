import { NextResponse } from 'next/server';
import { AlipaySdk } from 'alipay-sdk';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tier, email, uin, price, duration, userId } = body; 

    console.log(`\n--- 🚀 [ALIPAY] 开始处理发单 ---`);
    console.log(`收到的数据: userId=${userId}, tier=${tier}, uin=${uin}`);

    const rawPrivateKey = process.env.ALIPAY_PRIVATE_KEY;
    const rawAppId = process.env.ALIPAY_APP_ID;
    const rawPublicKey = process.env.ALIPAY_PUBLIC_KEY;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!rawPrivateKey || !rawAppId) {
        console.error('❌ [ALIPAY] 支付宝密钥缺失！');
        return NextResponse.json({ paymentUrl: null, error: 'Missing Alipay Keys' }, { status: 500 }); 
    }

    if (!supabaseServiceKey) {
        console.error('❌ [ALIPAY] 严重警告：缺少 SUPABASE_SERVICE_ROLE_KEY，无法写入数据库！请检查环境变量。');
    }

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        supabaseServiceKey || ''
    );

    const amount = price || (tier === 'VIP' ? 1.80 : 360.00);
    if (!amount) return NextResponse.json({ error: 'Invalid Amount' }, { status: 400 });

    const outTradeNo = 'ORDER_' + Date.now() + '_' + uin.slice(-6);

    // 1. 强制在数据库建单，并暴露所有死因
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
            console.error('❌ [ALIPAY] 订单插入数据库失败 (是不是权限或字段不对？):', dbError);
        } else {
            console.log('✅ [ALIPAY] 订单已成功插入数据库，单号:', outTradeNo);
        }
    } else {
        console.error('❌ [ALIPAY] 致命错误：前端没有传过来 userId，无法建单！');
    }

    // 2. 强制获取真实的公网域名
    // ⚠️ 如果你发现这里打印出来的是 localhost，支付宝绝对收不到回调！
    let baseUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (!baseUrl) {
        const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
        baseUrl = vercelUrl ? 'https://' + vercelUrl : 'http://localhost:3000';
    }
    baseUrl = baseUrl.replace(/\/$/, '');
    console.log(`🌍 [ALIPAY] 本次发给支付宝的 Webhook 回调域名是: ${baseUrl}`);

    // 3. 打包透传公文包
    const passbackObj = { userId: userId, tier: tier, duration: duration, amount: amount };
    const passbackParams = encodeURIComponent(JSON.stringify(passbackObj));

    const alipaySdk = new AlipaySdk({
      appId: rawAppId,
      privateKey: rawPrivateKey,      
      alipayPublicKey: rawPublicKey,  
      gateway: 'https://openapi.alipay.com/gateway.do', 
      timeout: 5000,
      camelcase: true
    });

    const subjectTitle = 'Space2 ' + tier + ' Estate License' + (duration ? ' (' + duration + ' Months)' : '');

    const paymentUrl = alipaySdk.pageExec('alipay.trade.page.pay', {
      method: 'GET',
      returnUrl: baseUrl + '/?payment=success',
      notifyUrl: baseUrl + '/api/v1/webhooks/alipay',
      bizContent: {
        outTradeNo: outTradeNo,
        productCode: 'FAST_INSTANT_TRADE_PAY',
        totalAmount: amount.toFixed(2), 
        subject: subjectTitle,
        passbackParams: passbackParams
      }
    });

    console.log('✅ [ALIPAY] 唤起支付宝链接成功！');
    return NextResponse.json({ paymentUrl: paymentUrl });

  } catch (error: any) {
    console.error('🚨 [ALIPAY Route Error]:', error.message || error);
    return NextResponse.json({ paymentUrl: null, error: error.message }, { status: 500 });
  }
}