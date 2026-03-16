import nodemailer from 'nodemailer';

// 1. 创建阿里云 SMTP 传输通道
const transporter = nodemailer.createTransport({
  host: process.env.ALIYUN_SMTP_HOST,
  port: Number(process.env.ALIYUN_SMTP_PORT),
  secure: true, // 465 端口必须开启 SSL
  auth: {
    user: process.env.ALIYUN_SMTP_USER,
    pass: process.env.ALIYUN_SMTP_PASS,
  },
});

// 2. 编写发送 VIP 欢迎邮件的核心函数
export async function sendVIPWelcomeEmail(userEmail: string, uin: string, tier: string) {
  // 设计一封极具极客感和赛博朋克风格的 HTML 邮件
  const htmlTemplate = `
    <div style="font-family: 'Courier New', Courier, monospace; background-color: #0a0a0a; color: #00ffcc; padding: 40px; border-radius: 8px; max-width: 600px; margin: 0 auto; border: 1px solid #333;">
      <h2 style="color: #fff; border-bottom: 2px solid #00ffcc; padding-bottom: 10px;">🌌 权限变更通知 / Permission Granted</h2>
      <p>Breeder <strong>${userEmail}</strong>:</p>
      <p>您的交易已通过星际加密网络确认。欢迎正式接入 Space² 领主系统。</p>
      
      <div style="background-color: #111; padding: 20px; border-left: 4px solid #00ffcc; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>[ 用户识别码 S2-DID ]</strong> : ${uin}</p>
        <p style="margin: 5px 0;"><strong>[ 当前授权级别 ]</strong> : <span style="color: #ffaa00; font-weight: bold;">${tier} ESTATE LICENSE</span></p>
        <p style="margin: 5px 0;"><strong>[ 节点状态 ]</strong> : ONLINE</p>
      </div>

      <p>即刻返回控制台，部署您的星际小龙虾矩阵。</p>
      <a href="https://space2.world/console" style="display: inline-block; background-color: #00ffcc; color: #000; padding: 12px 24px; text-decoration: none; font-weight: bold; margin-top: 20px; border-radius: 2px;">INITIATE CONSOLE &gt;&gt;</a>
      
      <p style="color: #666; font-size: 12px; margin-top: 40px;">* 这是一封由 Space² 中央主脑自动发出的加密邮件，请勿回复。</p>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"Space² Central" <${process.env.ALIYUN_SMTP_USER}>`, // ⚠️ 这里的邮箱必须和环境变量里的一模一样，否则阿里云会拒发！
      to: userEmail,
      subject: `[Space²] 交易确认 - 您的 ${tier} 权限已激活`,
      html: htmlTemplate,
    });
    console.log(`✅ [EMAIL] 欢迎邮件已成功发送至 ${userEmail}, 邮件ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('🚨 [EMAIL CRITICAL ERROR] 发送失败:', error);
    return false;
  }
}