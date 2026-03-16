"use client";
import React, { useState } from 'react';
import { AgentAvatar } from '@/components/AgentAvatar';

interface ContractedAgent {
  contract_id: string;
  agent: {
    name: string;
    uin: string;
    role: string;
    status: string;
    last_seen: string | null;
    visual_model: string;
    current_task: string | null;
  };
  terms: string;
  logs: string;
}

export const ContractCard = ({ data }: { data: ContractedAgent }) => {
  const [showDetails, setShowDetails] = useState(false);
  
  // 在线状态判断
  const isOnline = (new Date().getTime() - (data.agent.last_seen ? new Date(data.agent.last_seen).getTime() : 0)) < 360 * 1000;
  const isWorking = isOnline && data.agent.status === 'WORKING';

  return (
    <div className="relative bg-blue-950/20 border border-blue-500/30 rounded-xl p-4 overflow-hidden group hover:border-blue-400/50 transition-all">
      {/* 背景装饰：合约印章感 */}
      <div className="absolute -right-6 -top-6 text-[80px] text-blue-500/5 rotate-12 font-black pointer-events-none select-none">
        CONTRACT
      </div>

      {/* 头部：服务商信息 */}
      <div className="flex justify-between items-start mb-3">
         <div className="flex items-center gap-2">
            <span className="text-[9px] font-bold bg-blue-900/50 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded">
               EXTERNAL VENDOR
            </span>
            <span className="text-[9px] font-mono text-zinc-500">ID: {data.agent.uin.slice(0,8)}...</span>
         </div>
         
         {/* 状态灯：只能看，不能摸 */}
         <div className="flex items-center gap-1.5">
            <span className={`text-[9px] font-bold ${isOnline ? 'text-blue-400' : 'text-zinc-600'}`}>
                {isOnline ? data.agent.status : 'OFFLINE'}
            </span>
            <div className={`w-2 h-2 rounded-full ${!isOnline ? 'bg-zinc-700' : isWorking ? 'bg-blue-400 animate-pulse' : 'bg-blue-400'}`}></div>
         </div>
      </div>

      {/* 主体：头像与名称 */}
      <div className="flex items-center gap-4 mb-4">
        54 |          <AgentAvatar seed={parseInt(data.agent.visual_model || '88')} size={48} emotion="HAPPY" {...({ className: "grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all" } as any)} />
         <div className="min-w-0">
            <h3 className="text-md font-bold text-white truncate group-hover:text-blue-300 transition-colors">{data.agent.name}</h3>
            <div className="text-[10px] text-zinc-400 font-mono truncate">
               {data.agent.current_task || 'Awaiting Instructions'}
            </div>
         </div>
      </div>

      {/* 底部：合约操作 */}
      <div className="mt-2 pt-2 border-t border-blue-500/20 flex justify-between items-center">
         <button 
           onClick={() => setShowDetails(!showDetails)}
           className="text-[9px] font-bold text-blue-400 hover:text-white uppercase tracking-wider flex items-center gap-1"
         >
           {showDetails ? 'Hide Terms' : 'View Contract'}
           <span>{showDetails ? '▲' : '▼'}</span>
         </button>
         
         <div className="text-[9px] text-zinc-500">
            Linked via Smart Contract
         </div>
      </div>

      {/* 展开的合约详情与谈判记录 */}
      {showDetails && (
        <div className="mt-3 bg-black/50 rounded border border-blue-500/20 p-3 text-[10px] font-mono animate-in slide-in-from-top-2">
           <div className="mb-2">
              <div className="text-blue-500 font-bold mb-1">TERMS & CONDITIONS:</div>
              <div className="text-zinc-300 leading-relaxed">{data.terms}</div>
           </div>
           <div>
              <div className="text-zinc-500 font-bold mb-1">NEGOTIATION LOG:</div>
              <div className="text-zinc-400 italic opacity-70">{data.logs}</div>
           </div>
        </div>
      )}
    </div>
  );
};