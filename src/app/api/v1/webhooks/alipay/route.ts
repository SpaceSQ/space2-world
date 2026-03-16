import { NextResponse } from 'next/server';
import { AlipaySdk } from 'alipay-sdk';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    // 1. 支付宝的 Webhook 传过来的是 Form 数据，我们需要解析它
    const formData = await request.formData();
    const params = Object.fromEntries(formData.entries());

    console.log('\n🔔 [WEBHOOK] 收到支付宝异步通知：', params.out_trade_no);

    // 2. 初始化支付宝 SDK（仅用于验证签名）
    const alipaySdk = new AlipaySdk({
      appId: process.env.ALIPAY_APP_ID || '',
      privateKey: process.env.ALIPAY_PRIVATE_KEY || '',
      alipayPublicKey: process.env.ALIPAY_PUBLIC_KEY || '',
      camelcase: true,
    });

    // 3. 🚨 极度重要：验证签名！防止黑客伪造支付成功请求给你刷钻！
    const isValid = alipaySdk.checkNotifySign(params);
    if (!isValid) {
      console.error('❌ [WEBHOOK] 签名验证失败！这可能是伪造的请求！');
      return new NextResponse('failure', { status: 400 });
    }

    // 4. 检查支付状态，只有 TRADE_SUCCESS（支付成功）才发货
    const tradeStatus = params['trade_status'];
    if (tradeStatus !== 'TRADE_SUCCESS' && tradeStatus !== 'TRADE_FINISHED') {
      return new NextResponse('success'); // 其他状态（如交易创建）直接回复成功，不作处理
    }

    // 5. 提取订单信息（我们在上一版写的单号格式是：ORDER_时间戳_UIN）
    const outTradeNo = params['out_trade_no'] as string;
    const totalAmount = params['total_amount'];
    
    // 拆解订单号拿到用户的 ID (UIN)
    const parts = outTradeNo.split('_');
    const uin = parts[2]; 

    // 利用价格反推他买的是什么版本（防止恶意篡改）
    const tier = totalAmount === '72.00' ? 'VIP' : (totalAmount === '360.00' ? 'SVIP' : null);

    if (!uin || !tier) {
        console.error('❌ [WEBHOOK] 无法从订单解析出 UIN 或 Tier:', outTradeNo, totalAmount);
        return new NextResponse('success'); 
    }

    // 6. 🚀 连上数据库，执行上帝视角的“发货”操作！
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 假设你的 Supabase 里存用户的表名叫 users (如果叫 profiles，请把 'users' 改成 'profiles')
    const { error } = await supabase
      .from('users') 
      .update({ tier: tier }) // 把他的等级改成 VIP / SVIP
      .eq('id', uin);         // 匹配他的 UIN

    if (error) {
       console.error('❌ [WEBHOOK] 数据库更新失败:', error);
       return new NextResponse('failure', { status: 500 });
    }

    console.log(`✅ [WEBHOOK] 发货成功！已将用户 ${uin} 升级为 ${tier}！`);

    // 7. 🚨 必须且只能给支付宝回复纯文本的 "success"！
    // 否则支付宝会以为你没收到，在接下来的 24 小时内疯狂给你重发！
    return new NextResponse('success');

  } catch (error: any) {
    console.error('🚨 [WEBHOOK CRITICAL ERROR]:', error);
    return new NextResponse('failure', { status: 500 });
  }
}