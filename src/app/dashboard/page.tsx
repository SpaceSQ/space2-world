"use client";
import React from 'react';
import Link from 'next/link';

export default function DashboardHome() {
  // 模拟数据 (实际应从 API 获取)
  const stats = {
    agentsCount: 3,
    maxAgents: 8,
    contractVol: 1250,
    messages: 12,
    tier: 'VIP'
  };

  return (
    <div className="pt-24 px-6 pb-12 max-w-7xl mx-auto">
      {/* 欢迎语 */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white">COMMAND CENTER</h1>
        <p className="text-zinc-400 text-sm mt-1">System Status: <span className="text-emerald-500">OPERATIONAL</span></p>
      </div>

      {/* 核心指标卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        
        {/* 1. 会员等级 */}
        <div className="bg-gradient-to-br from-zinc-900 to-black p-6 rounded-xl border border-zinc-800 relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl group-hover:scale-110 transition-transform">👑</div>
           <div className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Membership Tier</div>
           <div className="text-2xl font-black text-white">{stats.tier}</div>
           <Link href="/dashboard/membership" className="text-[10px] text-emerald-500 hover:text-white mt-2 inline-block">UPGRADE PLAN &rarr;</Link>
        </div>

        {/* 2. 舰队规模 */}
        <div className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800">
           <div className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Silicon Fleet</div>
           <div className="text-2xl font-black text-white">{stats.agentsCount} <span className="text-sm text-zinc-600">/ {stats.maxAgents}</span></div>
           <div className="w-full bg-zinc-800 h-1.5 mt-3 rounded-full overflow-hidden">
              <div className="bg-blue-500 h-full" style={{ width: `${(stats.agentsCount / stats.maxAgents) * 100}%` }}></div>
           </div>
        </div>

        {/* 3. 合约产值 */}
        <div className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800">
           <div className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Contract Volume (GMV)</div>
           <div className="text-2xl font-black text-emerald-400">{stats.contractVol} <span className="text-sm text-zinc-600">S2C</span></div>
           <div className="text-[10px] text-zinc-500 mt-2">↑ 12% vs last month</div>
        </div>

        {/* 4. 消息/通知 */}
        <div className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800">
           <div className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Pending Alerts</div>
           <div className="text-2xl font-black text-white">{stats.messages}</div>
           <div className="text-[10px] text-zinc-500 mt-2">3 Signatures Required</div>
        </div>
      </div>

      {/* 快捷入口区 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         
         {/* 舰队管理快捷入口 */}
         <Link href="/dashboard/fleet" className="group block bg-black border border-zinc-800 p-8 rounded-2xl hover:border-blue-500/50 transition-all">
            <div className="flex justify-between items-start mb-4">
               <div className="w-12 h-12 bg-blue-900/20 rounded-lg flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">🛸</div>
               <span className="text-zinc-500 group-hover:text-white">→</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Fleet Operations</h3>
            <p className="text-xs text-zinc-400">Manage your Digital Human and Incubated Agents. Switch between Galaxy Map and Floor Plan views.</p>
         </Link>

         {/* 合约管理快捷入口 */}
         <Link href="/dashboard/contracts" className="group block bg-black border border-zinc-800 p-8 rounded-2xl hover:border-emerald-500/50 transition-all">
            <div className="flex justify-between items-start mb-4">
               <div className="w-12 h-12 bg-emerald-900/20 rounded-lg flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">📜</div>
               <span className="text-zinc-500 group-hover:text-white">→</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Smart Contracts</h3>
            <p className="text-xs text-zinc-400">Draft new service agreements, sign pending contracts, and view financial performance reports.</p>
         </Link>
      </div>
    </div>
  );
}