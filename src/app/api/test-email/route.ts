import { NextResponse } from 'next/server';
import { sendVIPWelcomeEmail } from '@/lib/email'; // 确保这里的路径和你放 email.ts 的路径一致

export async function GET(request: Request) {
  try {
    // 1. 从 URL 里抓取你要测试的收件人邮箱
    // 例如：http://localhost:3000/api/test-email?to=你的QQ或网易邮箱@qq.com
    const { searchParams } = new URL(request.url);
    const targetEmail = searchParams.get('to');

    if (!targetEmail) {
      return NextResponse.json({ error: '⚠️ 缺少收件人！请在网址后加上 ?to=你的真实邮箱' }, { status: 400 });
    }

    console.log(`🚀 [TEST] 主引擎点火，准备向 ${targetEmail} 发射测试邮件...`);

    // 2. 伪造一个极其真实的赛博朋克 UIN 和等级
    const mockUin = `S2_DUMMY_${Date.now().toString().slice(-5)}`;
    const mockTier = 'SVIP';

    // 3. 调用你的阿里云核心发信函数！
    const isSuccess = await sendVIPWelcomeEmail(targetEmail, mockUin, mockTier);

    if (isSuccess) {
      return NextResponse.json({ 
          status: 'success', 
          message: `✅ 导弹已准确命中目标！请立刻去 ${targetEmail} 查收（注意看下垃圾箱）！` 
      });
    } else {
      return NextResponse.json({ 
          status: 'failed', 
          error: '❌ 发射失败！请切回 VSCode 终端查看红色报错信息。' 
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('🚨 [TEST EMAIL ERROR]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}