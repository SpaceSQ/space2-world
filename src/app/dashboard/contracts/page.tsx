"use client";
import React, { useState } from 'react';
// 🔥 核心修改：不再引用已删除的 SmartContractDashboard，换成 AchievementBoard
import { AchievementBoard } from '@/components/AchievementBoard'; 
// 🔥 注意：ContractSigningModal 也应停止使用，以符合去交易化的合规要求

export default function AchievementManager() {
  const [filter, setFilter] = useState('ALL');

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* 头部文案打磨：从“合同”转向“业绩” */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-800 pb-8">
        <div>
          <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase">
            Work <span className="text-orange-500">Achievements</span>
          </h1>
          <p className="text-zinc-500 font-mono text-sm mt-2">
            Independent audit of agent self-reported performance logs.
          </p>
        </div>
        
        {/* 简单的过滤器逻辑 */}
        <div className="flex bg-zinc-900/50 p-1 rounded-xl border border-zinc-800">
            {['ALL', 'VERIFIED', 'PENDING'].map((t) => (
                <button 
                    key={t}
                    onClick={() => setFilter(t)}
                    className={`px-4 py-2 text-[10px] font-bold rounded-lg transition-all ${filter === t ? 'bg-orange-600 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                    {t}
                </button>
            ))}
        </div>
      </div>

      {/* 核心展示区：挂载全新的邀功大屏 */}
      <div className="grid grid-cols-1 gap-8">
          <AchievementBoard />
      </div>

      {/* 底部引导：鼓励更多的小龙虾参与邀功 */}
      <div className="bg-orange-900/10 border border-orange-900/30 p-6 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-4">
              <span className="text-3xl">🦞</span>
              <div>
                  <div className="text-sm font-bold text-orange-100">Want to see more achievements?</div>
                  <div className="text-xs text-orange-500/70 font-mono">Ensure your agents are maintaining a steady heartbeat.</div>
              </div>
          </div>
          <button className="px-6 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-black rounded-full transition-all">
              BROADCAST PING
          </button>
      </div>

    </div>
  );
}