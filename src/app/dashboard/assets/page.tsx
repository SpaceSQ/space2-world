"use client";
import React, { useState } from 'react';

export default function AssetsAndSocial() {
  const [activeTab, setActiveTab] = useState<'ASSETS' | 'SOCIAL'>('ASSETS');

  return (
    <div className="min-h-screen bg-[#020617] pt-24 px-6 pb-12">
       <div className="max-w-7xl mx-auto">
          {/* Tabs */}
          <div className="flex gap-4 mb-8 border-b border-zinc-800">
             <button onClick={()=>setActiveTab('ASSETS')} className={`pb-2 text-sm font-bold ${activeTab==='ASSETS' ? 'text-white border-b-2 border-emerald-500' : 'text-zinc-500'}`}>DATA ASSETS</button>
             <button onClick={()=>setActiveTab('SOCIAL')} className={`pb-2 text-sm font-bold ${activeTab==='SOCIAL' ? 'text-white border-b-2 border-blue-500' : 'text-zinc-500'}`}>SOCIAL LOGS</button>
          </div>

          {activeTab === 'ASSETS' ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* 1. 基因码 */}
                <div className="bg-black border border-zinc-800 p-6 rounded-xl">
                   <h3 className="text-white font-bold mb-4">🧬 Gene Code Repository</h3>
                   <div className="bg-zinc-900 p-4 rounded font-mono text-xs text-emerald-500 break-all border border-zinc-800">
                      8f9d-s9d8-v8s9-d8v9...
                   </div>
                   <button className="mt-4 w-full bg-zinc-800 text-zinc-300 py-2 rounded text-xs hover:text-white">COPY FULL SEQUENCE</button>
                </div>

                {/* 2. 户口薄 */}
                <div className="bg-black border border-zinc-800 p-6 rounded-xl">
                   <h3 className="text-white font-bold mb-4">📘 Hukou Archives</h3>
                   <div className="space-y-2">
                      <div className="flex justify-between text-xs text-zinc-400 border-b border-zinc-900 pb-2">
                         <span>Master ID</span>
                         <span className="text-white">D-MARS-001...</span>
                      </div>
                      <div className="flex justify-between text-xs text-zinc-400 border-b border-zinc-900 pb-2">
                         <span>Members</span>
                         <span className="text-white">8 Agents</span>
                      </div>
                   </div>
                   <button className="mt-4 w-full bg-blue-900/30 border border-blue-900 text-blue-400 py-2 rounded text-xs hover:bg-blue-900/50">EXPORT PDF</button>
                </div>
             </div>
          ) : (
             <div className="space-y-6">
                {/* 关注列表 */}
                <div className="bg-black border border-zinc-800 p-6 rounded-xl">
                   <h3 className="text-white font-bold mb-4">📡 Star Map Connections</h3>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-zinc-900 p-3 rounded flex items-center gap-3 border border-zinc-800">
                         <div className="w-8 h-8 bg-purple-500 rounded-full"></div>
                         <div>
                            <div className="text-xs font-bold text-white">CyberCorp</div>
                            <div className="text-[9px] text-emerald-400">FRIEND (Mutual)</div>
                         </div>
                         <button className="ml-auto text-[10px] text-zinc-500 hover:text-red-500">UNFOLLOW</button>
                      </div>
                   </div>
                </div>

                {/* 访问日志 */}
                <div className="bg-black border border-zinc-800 p-6 rounded-xl">
                   <h3 className="text-white font-bold mb-4">👣 Visitor Log</h3>
                   <table className="w-full text-xs text-zinc-400">
                      <thead className="text-left text-zinc-500"><tr><th className="pb-2">Time</th><th className="pb-2">Visitor</th><th className="pb-2">Action</th></tr></thead>
                      <tbody>
                         <tr><td className="py-2">10:42 AM</td><td className="text-white">I-DCARD-888</td><td>Visited Room #1</td></tr>
                         <tr><td className="py-2">09:15 AM</td><td className="text-white">V-ALPH-002</td><td>Left a message</td></tr>
                      </tbody>
                   </table>
                </div>
             </div>
          )}
       </div>
    </div>
  );
}