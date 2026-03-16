"use client";
import React, { useState } from 'react';

export default function SocialManager() {
  const [activeTab, setActiveTab] = useState<'LOGS' | 'FRIENDS'>('LOGS');

  return (
    <div className="pt-24 px-6 pb-12 max-w-5xl mx-auto">
       <div className="mb-8 flex justify-between items-center">
          <h1 className="text-2xl font-black text-white">SOCIAL RELATIONS</h1>
          <div className="flex gap-4 border-b border-zinc-800">
             <button onClick={()=>setActiveTab('LOGS')} className={`pb-2 text-sm font-bold ${activeTab==='LOGS' ? 'text-white border-b-2 border-blue-500' : 'text-zinc-500'}`}>VISITOR LOGS</button>
             <button onClick={()=>setActiveTab('FRIENDS')} className={`pb-2 text-sm font-bold ${activeTab==='FRIENDS' ? 'text-white border-b-2 border-purple-500' : 'text-zinc-500'}`}>STAR CONNECTIONS</button>
          </div>
       </div>

       {activeTab === 'LOGS' ? (
          <div className="bg-black border border-zinc-800 rounded-xl overflow-hidden">
             <table className="w-full text-xs text-left">
                <thead className="bg-zinc-900/50 text-zinc-500 font-bold uppercase border-b border-zinc-800">
                   <tr>
                      <th className="p-4">Time</th>
                      <th className="p-4">Visitor (UIN)</th>
                      <th className="p-4">Type</th>
                      <th className="p-4">Action/Message</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 text-zinc-400">
                   {/* 模拟数据 */}
                   <tr className="hover:bg-zinc-900/20">
                      <td className="p-4 font-mono text-zinc-500">10:42 AM</td>
                      <td className="p-4 text-white font-mono">I-DCARD-88820202</td>
                      <td className="p-4"><span className="bg-blue-900/30 text-blue-400 px-2 py-0.5 rounded text-[9px]">PUBLIC AGENT</span></td>
                      <td className="p-4">Visited Room #1 (Grid 2)</td>
                   </tr>
                   <tr className="hover:bg-zinc-900/20">
                      <td className="p-4 font-mono text-zinc-500">09:15 AM</td>
                      <td className="p-4 text-white font-mono">V-ALPH-00219191</td>
                      <td className="p-4"><span className="bg-purple-900/30 text-purple-400 px-2 py-0.5 rounded text-[9px]">NEIGHBOR</span></td>
                      <td className="p-4">Left a message: "Interested in your data service."</td>
                   </tr>
                </tbody>
             </table>
          </div>
       ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {/* 模拟好友卡片 */}
             <div className="bg-zinc-900/30 border border-zinc-800 p-4 rounded-xl flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-xl">🦄</div>
                <div>
                   <div className="text-white font-bold">CyberUnicorn Corp</div>
                   <div className="text-[10px] text-zinc-500 font-mono">MARS-EA-002-CORP</div>
                </div>
                <div className="ml-auto">
                   <div className="text-[9px] bg-emerald-900/30 text-emerald-400 px-2 py-0.5 rounded border border-emerald-900">MUTUAL FRIEND</div>
                </div>
             </div>
             
             {/* 添加好友按钮 */}
             <button className="border border-dashed border-zinc-700 rounded-xl flex flex-col items-center justify-center text-zinc-500 hover:text-white hover:border-zinc-500 hover:bg-zinc-900/50 h-24 transition-all">
                <span className="text-2xl mb-1">+</span>
                <span className="text-xs font-bold">CONNECT NEW STAR</span>
             </button>
          </div>
       )}
    </div>
  );
}