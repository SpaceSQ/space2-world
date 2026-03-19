"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
// 引入咱们之前手搓的两个核弹级视觉组件
import NeuroRadarChart from "@/components/NeuroRadarChart";
import AgentSoulDossier from "@/components/AgentSoulDossier";
// 引入那个闪烁着绿色霓虹灯的 VIP 悬浮门牌 (它现在只对未登录用户显示)
import VipGreenChannelGuide from "@/components/VipGreenChannelGuide"; 

export default function Space2WorldPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  
  // 1. 设置首页的数据状态 (States)
  // 默认占位数据，防止登录前加载时报错
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({ energy: 50, appetite: 50, bravery: 50, intel: 50, affection: 50 });
  const [agentName, setAgentName] = useState("MATRIX_TRAVELLER");
  const [coordinate, setCoordinate] = useState("UNKNOWN_COORDINATE");
  const [signature, setSignature] = useState("GUEST_ACCESS");
  const [isLoading, setIsLoading] = useState(true);

  // 2. 🛡️ 核心并网逻辑：加载时从数据库读取灵魂资产
  useEffect(() => {
    const fetchUserAndAssets = async () => {
      // 从 Supabase 获取当前登录的身份 (Auth)
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        // ❌ 情况A：没有用户登录，或者登录已过期
        console.log("Welcome Matrix Guest. No user assets detected.");
        setUser(null);
        // 此时我们将使用默认的 stats 等数据状态
      } else {
        // ✅ 情况B：用户已登录！开始疯狂读取 user_metadata
        console.log("Welcome Pioneer!", user.email);
        setUser(user);

        // EXTREMELY IMPORTANT: 从 user_metadata 里读取我们在 welcome 页塞进去的数据
        const meta = user.user_metadata;
        
        if (meta) {
          // 像素级同步！点亮雷达、具象化档案
          setAgentName(meta.agent_name || "AGENT_X");
          setCoordinate(meta.mars_coordinate || "UNKNOWN_MARS_COORD");
          setSignature(meta.local_signature || "POD_DOCK");
          
          if (meta.stats) {
            // 这就是我们在 welcome 页面算好的雷达数值，直接覆盖首页状态！
            setStats(meta.stats); 
          }
        }
      }
      setIsLoading(false);
    };

    fetchUserAndAssets();
  }, [supabase]);

  // 加载中的赛博全息加载页
  if (isLoading) return <div className="min-h-screen bg-black text-green-500 font-mono flex items-center justify-center tracking-widest uppercase">[ 🌌 Synchronization with Space2 Matrix... ]</div>;

  return (
    <div className="min-h-screen bg-black text-white p-6 relative flex flex-col items-center justify-center font-mono overflow-hidden">
      
      {/* 赛博网格背景 */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,0,0.03)_1px,transparent_1px)] bg-[size:30px_30px] z-0" />

      {/* ✅ 在这里挂载我们的绿色通道引导门牌 (只在未登录时显示，不碍事) */}
      {!user && <VipGreenChannelGuide />}

      {/* =========================================
         原本的主世界核心结构 (保持不变，z-10 确保在背景之上)
         ========================================= */}
      
      {/* 1. 中心核心：发光的 5D Neuro-Radar 图 (数据现在是动态的) */}
      <div className="relative z-10 w-full max-w-4xl flex items-center justify-center mb-16">
        {/* 雷达图外部霓虹光环特效 */}
        <div className="absolute w-[450px] h-[450px] rounded-full bg-blue-900/10 border border-blue-500/20 blur-xl opacity-80" />
        <div className="absolute w-[400px] h-[400px] rounded-full border border-orange-500/10 blur-sm animate-[spin_8s_linear_infinite] opacity-60" />
        
        {/* 渲染动态数值的 SVG 雷达图 */}
        <div className="w-[350px] h-[350px] relative flex items-center justify-center">
            <NeuroRadarChart stats={stats} />
        </div>
      </div>

      {/* 2. 右下角：智能体灵魂名片卡 (Agent Soul Dossier) (数据现在是动态的) */}
      {/* 确保你之前的 Dossier 组件接收这些新的动态状态 */}
      <AgentSoulDossier 
          stats={stats} 
          agentName={agentName}
          coordinate={coordinate}
          signature={signature}
          isLoggedIn={!!user} // 告诉 Dossier 用户是否登录，可以加个“登出”按钮
      />

      {/* 登录后的右上角用户控制面板 (UI 装饰，高逼格) */}
      {user && (
        <div className="absolute top-6 right-8 z-20 text-right p-3 border border-green-900 bg-black/80 rounded-sm">
            <p className="text-[10px] text-green-700 tracking-wider">MOTHERSHIP NODE ACTIVE</p>
            <p className="text-sm font-bold text-white tracking-widest">{agentName}</p>
            <p className="text-[9px] text-green-600 mt-1">{user.email}</p>
            
            {/* 登出按钮，为了方便测试 */}
            <button 
                onClick={() => supabase.auth.signOut().then(() => router.refresh())}
                className="text-[9px] text-red-700 hover:text-red-500 font-bold border border-red-900 px-2 py-0.5 mt-2 transition-all"
            >
                [ TERMINATE SESSION ]
            </button>
        </div>
      )}
    </div>
  );
}