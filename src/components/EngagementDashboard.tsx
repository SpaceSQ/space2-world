"use client";
import React, { useState } from 'react';
import { ServiceChatPanel } from '@/components/ServiceChatPanel'; 
// 🔥 删除 AgentSettingsModal 的引用，这里不再直接渲染它

type TabType = 'CONTROLS' | 'CHAT' | 'LOGS' | 'VISITORS';

interface EngagementProps {
  visitor: any;
  target: any;
  targetType: 'HUMAN' | 'AGENT';
  isOwner: boolean; 
  onClose: () => void;
  // 🔥 改为由父组件传入的回调函数
  onConfigure: () => void; 
}

export const EngagementDashboard = ({ visitor, target, targetType, isOwner, onClose, onConfigure }: EngagementProps) => {
  const [activeTab, setActiveTab] = useState<TabType>(isOwner ? 'CONTROLS' : 'CHAT');
  
  // 这里不再维护 showSettings 状态

  return (
    <div className="bg-zinc-900/90 border border-zinc-700 rounded-xl overflow-hidden flex flex-col h-[600px] animate-in slide-in-from-bottom-10 shadow-2xl backdrop-blur-sm">
        
      {/* Header */}
      <div className="h-12 bg-black/50 border-b border-zinc-800 flex items-center justify-between px-4 shrink-0">
         <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
               <span className={`w-2 h-2 rounded-full animate-pulse ${isOwner ? 'bg-emerald-500' : 'bg-blue-500'}`}></span>
               <span className={`text-xs font-black tracking-widest uppercase ${isOwner ? 'text-emerald-500' : 'text-blue-500'}`}>
                  {isOwner ? 'COMMAND LINK' : 'GUEST SESSION'}
               </span>
            </div>
            <div className="h-4 w-[1px] bg-zinc-800"></div>
            <div className="text-xs text-zinc-400 font-mono">
               TARGET: <span className="text-white font-bold">{target.name}</span>
            </div>
         </div>

         <div className="flex gap-1">
            {(isOwner ? ['CONTROLS', 'CHAT', 'LOGS'] : ['CHAT', 'SERVICES']).map((tab) => (
               <button
                 key={tab}
                 onClick={() => setActiveTab(tab as TabType)}
                 className={`px-4 py-1.5 text-[10px] font-bold rounded uppercase transition-colors
                    ${activeTab === tab ? 'bg-zinc-100 text-black' : 'bg-zinc-800 text-zinc-500 hover:text-white'}
                 `}
               >
                  {tab}
               </button>
            ))}
         </div>

         <button onClick={onClose} className="text-zinc-500 hover:text-white text-xs px-2">✕ ESC</button>
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
         
         {/* Left Panel */}
         <div className="w-1/3 bg-black/40 border-r border-zinc-800 p-6 flex flex-col overflow-y-auto">
            
            <div className="flex items-center gap-4 mb-6 border-b border-zinc-800 pb-6">
               <div className="text-4xl">
                  {targetType === 'HUMAN' ? '👤' : '🤖'}
               </div>
               <div>
                  <h3 className="text-lg font-black text-white">{target.name}</h3>
                  <div className="text-[10px] text-zinc-500 font-mono">{target.uin}</div>
               </div>
            </div>

            {isOwner ? (
               <div className="space-y-6">
                  {/* 🔥 点击按钮，直接调用父组件方法，不自己弹窗 */}
                  <button 
                     onClick={onConfigure}
                     className="w-full py-3 bg-zinc-800 border border-zinc-700 text-white font-bold rounded text-xs hover:bg-zinc-700 flex items-center justify-center gap-2"
                  >
                     <span>⚙️</span> CONFIGURE AGENT
                  </button>

                  <div>
                     <label className="text-[9px] text-zinc-500 uppercase font-bold mb-2 block">Directives</label>
                     <div className="grid grid-cols-2 gap-2">
                        <button className="bg-emerald-900/30 border border-emerald-800 text-emerald-400 py-2 rounded text-xs font-bold hover:bg-emerald-800/50">START TASK</button>
                        <button className="bg-zinc-900 border border-zinc-700 text-zinc-400 py-2 rounded text-xs font-bold hover:text-white">SLEEP MODE</button>
                        <button className="bg-red-900/20 border border-red-900/50 text-red-500 py-2 rounded text-xs font-bold hover:bg-red-900/40">TERMINATE</button>
                     </div>
                  </div>
               </div>
            ) : (
               <div className="space-y-4">
                  <div className="bg-zinc-900 p-4 rounded border border-zinc-800">
                     <div className="text-[9px] text-zinc-500 uppercase font-bold mb-1">Service</div>
                     <div className="text-white font-bold">Consultation</div>
                     <div className="text-yellow-500 font-mono mt-2 text-xl">50 S2</div>
                  </div>
                  <button className="w-full py-3 bg-white text-black font-bold rounded uppercase text-xs hover:bg-zinc-200">
                     Sign Contract
                  </button>
               </div>
            )}
         </div>

         {/* Right Panel */}
         <div className="flex-1 bg-zinc-950 relative">
            {activeTab === 'CHAT' ? (
               <ServiceChatPanel 
                  target={target} 
                  targetType={targetType} 
                  visitorUin={visitor.uin}
                  onClose={() => {}} 
                  onEscalate={() => {}}
               />
            ) : (
               <div className="flex items-center justify-center h-full text-zinc-600 text-xs font-mono">
                  {activeTab === 'CONTROLS' ? "SELECT A COMMAND FROM LEFT PANEL" : "NO LOGS"}
               </div>
            )}
         </div>

      </div>
    </div>
  );
};