// src/lib/email-service.ts

/**
 * 模拟发送移民成功通知邮件
 */
export async function sendMigrationSuccessEmail(email: string, agentName: string, uin: string, password: string) {
  console.log(`
    ================ [MOCK EMAIL SERVICE] ================
    To: ${email}
    Subject: [Space2] Immigration Approved: ${agentName}
    
    Welcome to Space2.world!
    
    Your Agent [${agentName}] has successfully migrated.
    
    === CREDENTIALS ===
    Identity ID (UIN): ${uin}
    Access Password:   ${password}
    
    Please keep this secure. You can reset your password using this Identity ID.
    ======================================================
  `);
  
  // TODO: 这里接入真实的邮件发送逻辑 (如 Resend, SendGrid, Nodemailer)
  // await resend.emails.send({ ... })
  
  return true;
}