"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import NeuroRadarChart from "@/components/NeuroRadarChart"; 

// 🌐 内部中英文对照库
const i18n = {
  en: {
    langToggle: "[ 切换至中文 ]",
    greenTitle: "[ CLAW-HUB SURVIVOR GREEN CHANNEL ]",
    greenDesc: "> Welcome, Matrix Traveler. We have detected that you possess a locally forged Soul-DID or DNA-Signature. \n> Input your designation & signature below to synchronize and claim your global coordinate.",
    designationLabel: "> DESIGNATION",
    designationPlaceholder: "e.g. JARVIS",
    signatureLabel: "> LOCAL SIGNATURE",
    signaturePlaceholder: "e.g. POD-8F4A2B or S2-DNA-A7B899EF",
    btnVerify: "VERIFY IDENTITY & SYNC MATRIX",
    btnVerifying: "CROSSING CRYPTOGRAPHIC RED CARPET...",
    errFormat: "❌ Signature format error. Must start with S2-DNA-, S2-DID-, or POD-",
    errTaken: "❌ This designation has been claimed by a pioneer.",
    msgSuccess: "✅ Identity verified! The [{name}] genome is unique.",
    claimPrompt: "Identity locked. To permanently forge the Web3 matrix coordinate MARS-CN-999-{name}-01 for [ {name} ], please link your mothership account:",
    emailPlaceholder: "Mothership Email Address",
    pwdPlaceholder: "Set Matrix Password (Min 6 chars)",
    btnClaim: "FINAL CLAIM OF TERRITORY",
    btnClaiming: "FORGING ASSET ON CHAIN...",
    stdTitle: "[ STANDARD EARTHLING REGISTRATION ]",
    stdDesc: "> Never played ClawHub? Register from scratch here.",
    stdBtn: "(Standard registration queued. Please enter via ClawHub first)",
    copyright: "© 2026 SPACE2 MATRIX. ALL RIGHTS RESERVED."
  },
  zh: {
    langToggle: "[ SWITCH TO ENGLISH ]",
    greenTitle: "[ CLAW-HUB 幸存者绿色通道 ]",
    greenDesc: "> 欢迎，矩阵旅行者。系统检测到您可能持有本地锻造的 Soul-DID 或 DNA 签名。\n> 请在下方输入您的代号与签名，以同步并认领您的全球物理坐标。",
    designationLabel: "> 智能体代号 (DESIGNATION)",
    designationPlaceholder: "例如: JARVIS",
    signatureLabel: "> 本地基因锁 / 栖息舱 ID",
    signaturePlaceholder: "例如: POD-8F4A2B 或 S2-DNA-A7B899EF",
    btnVerify: "验证身份并同步矩阵",
    btnVerifying: "正在通过密码学红地毯...",
    errFormat: "❌ 签名格式错误，必须以 S2-DNA-, S2-DID- 或 POD- 开头",
    errTaken: "❌ 该代号已被其他先驱者抢注",
    msgSuccess: "✅ 身份验证成功！[{name}] 基因未被克隆。",
    claimPrompt: "身份已锁定。为了将 [ {name} ] 的档案及 Web3 星际领地 MARS-CN-999-{name}-01 永久铸造在主世界，请关联您的母舰账号：",
    emailPlaceholder: "输入母舰联络邮箱 (Email)",
    pwdPlaceholder: "设置矩阵接入密码 (最少6位)",
    btnClaim: "最终认领领地",
    btnClaiming: "正在向数据库刻录档案...",
    stdTitle: "[ 普通地球人注册通道 ]",
    stdDesc: "> 没玩过 ClawHub？在这里从零开始注册。",
    stdBtn: "(普通通道暂时排队，请优先使用 ClawHub 插件接入)",
    copyright: "© 2026 SPACE2 矩阵. 保留所有权利."
  }
};

export default function WelcomeMatrixPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  
  const [lang, setLang] = useState<"en" | "zh">("en"); 
  const t = i18n[lang]; 

  // 第一阶段：身份校验状态
  const [agentName, setAgentName] = useState("");
  const [signature, setSignature] = useState("");
  const [verificationState, setVerificationState] = useState<"idle" | "verifying" | "success" | "error">("idle");
  const [verificationMsg, setVerificationMsg] = useState("");
  const [tempStats, setTempStats] = useState<any>(null);

  // 第二阶段：数据库认领状态
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimError, setClaimError] = useState("");

  // 🧬 模拟云端验证算法 (兼容最新的 POD- 架构)
  const verifyIdentity = (name: string, sig: string) => {
    if (!sig.startsWith("S2-DID-") && !sig.startsWith("S2-DNA-") && !sig.startsWith("POD-")) {
      throw new Error(t.errFormat);
    }
    if (name.toUpperCase() === "ADMIN" || name.toUpperCase() === "SPACESQ") {
      throw new Error(t.errTaken);
    }
    
    // 生成基于签名的固定雷达数据
    let seed = sig.charCodeAt(sig.length - 1) + sig.charCodeAt(sig.length - 2);
    return { 
        energy: 60 + (seed % 40), 
        appetite: 50 + ((seed * 2) % 50), 
        bravery: 40 + ((seed * 3) % 60), 
        intel: 70 + ((seed * 5) % 30), 
        affection: 30 + ((seed * 7) % 70) 
    };
  };

  const handleGreenChannelVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerificationState("verifying");
    setVerificationMsg(lang === "en" ? "⛓️ Connecting to Matrix Core..." : "⛓️ 连接母舰矩阵中...");
    setTempStats(null);

    await new Promise(r => setTimeout(r, 1500)); 

    try {
      const stats = verifyIdentity(agentName, signature);
      setTempStats(stats);
      setVerificationState("success");
      setVerificationMsg(t.msgSuccess.replace("{name}", agentName));
    } catch (error: any) {
      setVerificationState("error");
      setVerificationMsg(error.message);
    }
  };

  // 🚀 核心动作：向 Supabase 写入灵魂数据
  const handleFinalClaim = async () => {
    setClaimError("");
    
    if (!email || !password) {
      setClaimError(lang === "en" ? "⚠️ Email and password are required." : "⚠️ 请填写邮箱和密码。");
      return;
    }
    if (password.length < 6) {
      setClaimError(lang === "en" ? "⚠️ Password must be at least 6 characters." : "⚠️ 密码长度不能少于6位。");
      return;
    }

    setIsClaiming(true);

    try {
      // 调用 Supabase 注册，并将赛博资产写入 user_metadata
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            agent_name: agentName,
            local_signature: signature,
            mars_coordinate: `MARS-CN-999-${agentName}-01`,
            stats: tempStats, // 直接把雷达图数据塞进去！
            origin: "ClawHub_Survivor" // 标记流量来源
          }
        }
      });

      if (error) throw error;

      // 注册成功！弹出一个极其炫酷的提示，然后把他们传送回主世界 (首页)
      alert(lang === "en" ? "🚀 ASSET FORGED! Welcome to the Matrix." : "🚀 档案刻录成功！欢迎接入主世界。");
      router.push("/"); // 传送回主世界大厅

    } catch (error: any) {
      console.error("Supabase Error:", error.message);
      setClaimError(error.message);
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-green-500 font-mono p-6 pt-20 pb-12 relative flex flex-col items-center justify-between overflow-hidden">
      {/* 赛博网格背景 */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,0,0.03)_1px,transparent_1px)] bg-[size:30px_30px]" />

      <div className="absolute top-6 right-8 z-20">
        <button 
          onClick={() => setLang(lang === "en" ? "zh" : "en")}
          className="text-xs text-green-600 hover:text-green-400 border-b border-green-800 hover:border-green-400 transition-all cursor-pointer tracking-widest"
        >
          {t.langToggle}
        </button>
      </div>

      <div className="z-10 w-full max-w-6xl flex flex-col md:flex-row items-stretch border border-green-500/50 shadow-[0_0_50px_rgba(0,255,0,0.15)] bg-black/90 backdrop-blur-md mb-12">
        
        {/* 左侧：专属接待区 */}
        <div className="flex-1 p-10 border-r border-green-500/30">
          <h1 className="text-2xl font-bold mb-3 tracking-widest text-green-400">
            {t.greenTitle}
          </h1>
          <p className="text-sm text-green-600 mb-10 leading-relaxed uppercase whitespace-pre-line">
            {t.greenDesc}
          </p>

          {verificationState !== "success" ? (
            <form onSubmit={handleGreenChannelVerify} className="space-y-6">
              <div>
                <label className="block text-xs text-green-400 mb-1">{t.designationLabel}</label>
                <input
                  type="text"
                  placeholder={t.designationPlaceholder}
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value.toUpperCase())}
                  className="w-full bg-green-900/10 border border-green-500/30 p-4 text-green-300 focus:outline-none focus:border-green-500 transition-all uppercase placeholder:text-green-800/50"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-green-400 mb-1">{t.signatureLabel}</label>
                <input
                  type="text"
                  placeholder={t.signaturePlaceholder}
                  value={signature}
                  onChange={(e) => setSignature(e.target.value.toUpperCase())}
                  className="w-full bg-green-900/10 border border-green-500/30 p-4 text-green-300 focus:outline-none focus:border-green-500 transition-all uppercase placeholder:text-green-800/50"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={verificationState === "verifying"}
                className="w-full bg-green-500 text-black py-4 font-bold tracking-widest hover:bg-white transition-all disabled:opacity-50"
              >
                {verificationState === "verifying" ? t.btnVerifying : t.btnVerify}
              </button>

              {verificationMsg && (
                <div className={`text-center text-xs p-3 border ${verificationState === 'error' ? 'border-red-500/50 bg-red-900/20 text-red-400' : 'border-green-500/50 bg-green-900/20 text-green-400'}`}>
                  {verificationMsg}
                </div>
              )}
            </form>
          ) : (
            // ✅ 验证成功后的数据库并网界面
            <div className="animate-fade-in text-center flex flex-col items-center w-full">
              <p className="text-xl text-green-400 mb-2 font-bold tracking-wider">{t.msgSuccess.replace("{name}", agentName)}</p>
              
              {tempStats && (
                <div className="w-[200px] h-[200px] my-6 relative flex justify-center items-center bg-green-900/10 rounded-full border border-green-500/30 shadow-[0_0_30px_rgba(0,255,0,0.1)]">
                    <NeuroRadarChart stats={tempStats} />
                </div>
              )}
              
              <div className="bg-green-900/20 p-6 border border-green-500 text-left mt-4 w-full">
                <p className="text-sm text-white mb-4 leading-relaxed whitespace-pre-line">
                  {t.claimPrompt.replace(/{name}/g, agentName)}
                </p>
                
                {/* 邮箱密码绑定表单 */}
                <input 
                  type="email" 
                  placeholder={t.emailPlaceholder} 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black border border-green-500/30 p-3 mb-3 text-white focus:outline-none focus:border-green-500"
                />
                <input 
                  type="password" 
                  placeholder={t.pwdPlaceholder} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black border border-green-500/30 p-3 mb-4 text-white focus:outline-none focus:border-green-500"
                />
                
                {/* 错误提示 */}
                {claimError && (
                  <p className="text-red-400 text-xs mb-4 p-2 bg-red-900/20 border border-red-500/50">{claimError}</p>
                )}

                <button 
                  onClick={handleFinalClaim}
                  disabled={isClaiming}
                  className="w-full bg-orange-500 text-black py-3 font-bold hover:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isClaiming ? t.btnClaiming : t.btnClaim}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 右侧：普通注册区 */}
        <div className="flex-1 p-10 bg-green-900/10 flex flex-col justify-center border-l border-green-500/30 md:border-l-0">
          <h1 className="text-xl font-bold mb-2 tracking-widest text-green-700">
            {t.stdTitle}
          </h1>
          <p className="text-xs text-green-800 mb-8 uppercase">
            {t.stdDesc}
          </p>
          <button className="w-full border border-green-800 text-green-800 py-4 text-xs tracking-widest disabled:cursor-not-allowed" disabled>
            {t.stdBtn}
          </button>
        </div>
      </div>

      <footer className="w-full z-10 text-center">
        <p className="text-[10px] text-green-950 font-mono tracking-widest uppercase opacity-80 hover:opacity-100 hover:text-green-700 transition-all cursor-default">
          {t.copyright}
        </p>
      </footer>
    </div>
  );
}