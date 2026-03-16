"use client";
import React, { useState } from 'react';
import { AgentAvatar } from '@/components/AgentAvatar';

const STATUS_COLORS: Record<string, string> = {
  IDLE: 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]', 
  BUSY: 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]',      
  AWAY: 'border-zinc-500 opacity-70',                                
  OFFLINE: 'border-yellow-500 opacity-50 grayscale',                 
};

interface Agent {
  uin: string;
  name: string;
  status: 'IDLE' | 'BUSY' | 'AWAY' | 'OFFLINE';
  visual_model: string;
  role: string;
  suns_address?: string; 
  is_frozen?: boolean;   
}

interface VisitorInfo {
  gridId: number;
  agent: Agent;
  isFirstTime?: boolean; 
  isOwner?: boolean;     
}

interface FloorPlanProps {
  owner: { name: string; uin: string; visual_model: string; suns_address?: string; role?: string } | null; 
  agents: Agent[];                                            
  visitors?: VisitorInfo[];              
  onAgentClick?: (agent: any, isOwner?: boolean, gridId?: number) => void;
  activeRoomId?: number;
  viewerRole?: 'LORD' | 'AGENT';
  viewerId?: string;
}

export const FloorPlanGrid = ({ owner, agents, visitors = [], onAgentClick, activeRoomId = 1, viewerRole = 'LORD', viewerId }: FloorPlanProps) => {
  const [hoveredGrid, setHoveredGrid] = useState<number | null>(null);

  // 严格映射：2=TopLeft, 3=TopCenter(数字人正上方), 4=TopRight, 9=MidLeft, 1=Center, 5=MidRight...
  const VISUAL_ORDER = [2, 3, 4, 9, 1, 5, 8, 7, 6];

  const renderCell = (gridId: number) => {
    
    // === 1号位：数字人房东 / 系统节点 ===
    if (gridId === 1) {
      const isLordMe = viewerRole === 'LORD' && viewerId === owner?.uin;

      if (!owner) return null;

      return (
        <div 
            className="flex flex-col items-center justify-center relative w-full h-full group cursor-pointer pointer-events-auto"
            onClick={(e) => {
                e.stopPropagation();
                if (onAgentClick) onAgentClick(owner, isLordMe, 1); 
            }}
        >
           <div className={`absolute inset-2 rounded-full blur-xl animate-pulse ${isLordMe ? 'bg-blue-900/20' : 'bg-orange-900/20'}`}></div>
           <div className={`relative z-10 p-1 rounded-full border-4 transition-transform group-hover:scale-105 ${isLordMe ? 'border-blue-600/50 shadow-[0_0_30px_rgba(37,99,235,0.5)]' : 'border-orange-600/50 shadow-[0_0_30px_rgba(234,88,12,0.5)]'}`}>
              <AgentAvatar seed={parseInt(owner?.visual_model || '100')} size={80} isHuman={true} emotion="NEUTRAL" />
           </div>
           <div className={`mt-2 px-3 py-0.5 rounded text-[9px] font-black tracking-widest uppercase shadow-lg ${isLordMe ? 'bg-blue-900/80 border border-blue-500 text-blue-100' : 'bg-orange-950/90 border border-orange-700 text-orange-200'}`}>
              {isLordMe ? 'OWNER (ME)' : (owner.name || 'SYSTEM NODE')}
           </div>
        </div>
      );
    }

    // === 2-9号位：打工虾标准空间 ===
    const resident = agents.find((a: any) => {
        if (!a || !a.suns_address) return false;
        const parts = a.suns_address.split('-');
        const addressGridId = parts[parts.length - 1]; 
        return addressGridId === gridId.toString();
    });

    const visitorObj = visitors.find(v => v.gridId === gridId);

    if (!resident) {
       return (
         <div 
             onClick={(e) => { e.stopPropagation(); if (onAgentClick) onAgentClick(null, false, gridId); }}
             className="w-full h-full flex flex-col items-center justify-center border border-zinc-800/30 rounded-xl bg-zinc-900/10 hover:bg-zinc-800/30 hover:border-zinc-600/50 transition-colors cursor-pointer group"
         >
            <span className="text-zinc-800 text-[10px] font-mono select-none group-hover:text-zinc-500 transition-colors">GRID {gridId}</span>
         </div>
       );
    }

    const isFrozen = resident.is_frozen === true;
    const statusClass = isFrozen ? STATUS_COLORS.OFFLINE : (STATUS_COLORS[resident.status] || STATUS_COLORS.OFFLINE);
    const isAgentMe = viewerRole === 'AGENT' && viewerId === resident.uin;

    let isVipPosition = false;
    if (visitorObj) {
        if (visitorObj.isOwner || visitorObj.agent.role === 'OWNER' || visitorObj.agent.uin.startsWith('D')) {
            isVipPosition = true;
        }
    }

    const hostTransform = visitorObj 
       ? (isVipPosition ? 'translate(calc(-50% - 30px), calc(-50% - 30px))' : 'translate(calc(-50% + 30px), calc(-50% - 30px))') 
       : 'translate(-50%, -50%)';

    const visitorTransform = isVipPosition 
       ? 'translate(calc(-50% + 35px), calc(-50% + 35px))'   
       : 'translate(calc(-50% - 35px), calc(-50% + 35px))'; 

    const avatarContainerClass = (isAgentMe && !isFrozen)
        ? 'p-1 rounded-full border-4 border-red-600 bg-black transition-all relative z-10 shadow-[0_0_30px_rgba(239,68,68,0.8)]' 
        : `p-1 rounded-full border-2 bg-black transition-all relative z-10 ${statusClass}`;

    return (
      <div 
        className={`relative w-full h-full cursor-pointer group pointer-events-auto overflow-hidden rounded-2xl ${isFrozen ? 'grayscale opacity-50 hover:opacity-80' : ''}`}
        onClick={(e) => {
            e.stopPropagation();
            if (onAgentClick) onAgentClick(resident, isAgentMe, gridId); 
        }}
      >
         {isAgentMe && !isFrozen && (
            <div className="absolute inset-0 bg-red-600/10 rounded-2xl animate-pulse pointer-events-none z-0"></div>
         )}

         <div 
             className={`absolute top-1/2 left-1/2 flex flex-col items-center z-10 transition-transform duration-500 ${!visitorObj && !isFrozen ? 'group-hover:scale-105' : ''}`}
             style={{ transform: hostTransform }}
         >
            <div className={avatarContainerClass}>
               {/* 🔥 核心修复：去掉了强制的 isHuman={false}，找回被屏蔽的专属个性化参数！ */}
               <AgentAvatar seed={parseInt(resident.visual_model || '0')} size={visitorObj ? 48 : 56} />
               
               {isFrozen ? (
                   <div className="absolute -top-1 -right-1 bg-zinc-800 border border-zinc-600 text-[10px] w-5 h-5 flex items-center justify-center rounded-full shadow-lg z-20" title="Energy Depleted">🧊</div>
               ) : (
                   <div className={`absolute top-0 right-0 w-3 h-3 rounded-full border-2 border-black animate-pulse ${isAgentMe ? 'bg-red-500' : (resident.status === 'IDLE' ? 'bg-emerald-500' : 'bg-red-500')}`}></div>
               )}
            </div>
            
            {!visitorObj && (
                <div className={`mt-2 text-[8px] px-2 py-0.5 rounded border backdrop-blur-sm shadow-lg max-w-[80px] truncate text-center relative z-10 ${isAgentMe && !isFrozen ? 'bg-red-950/90 text-red-400 border-red-600 font-black' : 'text-zinc-300 bg-zinc-900/90 border-zinc-700'}`}>
                   {resident.name} {isAgentMe ? '(YOU)' : ''}
                </div>
            )}
         </div>

         {visitorObj && !isFrozen && (
            <div 
               className="absolute top-1/2 left-1/2 flex flex-col items-center z-50 animate-in zoom-in slide-in-from-bottom-2 duration-500"
               style={{ transform: visitorTransform }}
            >
               <div className="relative">
                  <div className={`absolute -top-4 ${isVipPosition ? '-right-2' : '-left-2'} text-xs animate-bounce z-30 drop-shadow-lg`}>💬</div>
                  <div className={`${isVipPosition ? 'transform -scale-x-100' : ''}`}>
                     <div className={`p-1 rounded-full border-2 bg-black ${isVipPosition ? 'border-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.5)]' : 'border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.4)]'}`}>
                         <AgentAvatar seed={parseInt(visitorObj.agent.visual_model || '0')} size={48} isHuman={isVipPosition} emotion="NEUTRAL" />
                     </div>
                  </div>
               </div>
            </div>
         )}

         {visitorObj && !isFrozen && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
               <defs>
                  <linearGradient id={`grad-${gridId}`} x1="0%" y1="0%" x2="100%" y2="0%">
                     <stop offset="0%" stopColor="rgba(255,255,255,0)" />
                     <stop offset="50%" stopColor="rgba(255,255,255,0.4)" />
                     <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                  </linearGradient>
               </defs>
               <line 
                  x1={isVipPosition ? "35%" : "65%"} y1="35%" x2={isVipPosition ? "67%" : "33%"} y2="67%" 
                  stroke={`url(#grad-${gridId})`} strokeWidth="1.5" strokeDasharray="3 3"
               >
                  <animate attributeName="stroke-dashoffset" from="6" to="0" dur="1s" repeatCount="indefinite" />
               </line>
            </svg>
         )}
      </div>
    );
  };

  return (
    <div className="w-full max-w-[600px] aspect-square mx-auto bg-[#09090b] border border-zinc-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden ring-1 ring-white/5">
         <div className="absolute inset-0 pointer-events-none opacity-10" style={{ backgroundImage: `linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)`, backgroundSize: '33.33% 33.33%' }}></div>
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/2 h-1/2 bg-emerald-500/5 blur-[80px] rounded-full pointer-events-none"></div>

         <div className="grid grid-cols-3 grid-rows-3 h-full gap-4 relative z-10">
            {VISUAL_ORDER.map(id => (
               <div key={id} className={`relative border rounded-2xl transition-colors ${hoveredGrid === id ? 'bg-zinc-900/40 border-zinc-700' : 'bg-black/20 border-zinc-800/40'}`} onMouseEnter={() => setHoveredGrid(id)} onMouseLeave={() => setHoveredGrid(null)}>
                  <div className="absolute top-2 right-2 text-[10px] text-zinc-800 font-mono font-bold select-none z-0">#{id}</div>
                  <div className="w-full h-full flex items-center justify-center p-2 relative z-10">
                     {renderCell(id)}
                  </div>
               </div>
            ))}
         </div>
    </div>
  );
};