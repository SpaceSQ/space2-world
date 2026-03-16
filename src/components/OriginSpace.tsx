"use client";
import React, { useState, useEffect } from 'react';
import { AgentAvatar } from '@/components/AgentAvatar';
import { SPIRAL_MATRIX, getGridDescription, checkCrowding } from '@/lib/space-topology';

const CELL_SIZE = 220; // 4平方米标准空间视口

interface Occupant {
  uin: string;
  name: string;
  type: 'HOST' | 'VISITOR' | 'AGENT';
  avatarSeed: string;
  status?: string; // ONLINE, BUSY, OFFLINE
  role?: string;
}

export const OriginSpace = ({ 
  host, 
  agents = [], 
  visitor, 
  onExit,
  onChatWithAgent,
  onDelegate 
}: { 
  host: any, 
  agents?: any[], 
  visitor: any, 
  onExit: () => void,
  onChatWithAgent: (agentId: string) => void,
  onDelegate?: (agentId: string) => void
}) => {
  const [activeFocus, setActiveFocus] = useState<number>(1); // 默认聚焦 1号位 (主人)
  const [occupancyMap, setOccupancyMap] = useState<Record<number, Occupant[]>>({});
  const [timeLeft, setTimeLeft] = useState(300); 

  // 初始化布局
  useEffect(() => {
    const map: Record<number, Occupant[]> = {};
    
    // 1. 部署主人 (1号位)
    map[1] = [{
      uin: host.uin, name: host.name, type: 'HOST', 
      avatarSeed: 'HOST', status: 'ONLINE'
    }];
    
    // 2. 部署访客 (1号位 - 初始接待)
    map[1].push({
      uin: visitor.uin, name: visitor.name, type: 'VISITOR',
      avatarSeed: visitor.avatar, status: 'ONLINE'
    });

    // 3. 部署智能体 (2-9号位)
    const gridIds = [2, 3, 4, 5, 6, 7, 8, 9];
    agents?.forEach((agent, idx) => {
      if (idx < gridIds.length) {
        const gid = gridIds[idx];
        map[gid] = [{
          uin: agent.uin, name: agent.name, type: 'AGENT',
          avatarSeed: agent.visual_model, status: agent.status, role: agent.role
        }];
      }
    });

    setOccupancyMap(map);
  }, [host, agents, visitor]);

  // 倒计时
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { onExit(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 渲染单个格子
  const renderCell = (gridId: number) => {
    const occupants = occupancyMap[gridId] || [];
    const count = occupants.length;
    const isFocus = activeFocus === gridId;
    
    // 提取主要居住者 (用于显示状态)
    const primaryOccupant = occupants.find(o => o.type === 'HOST' || o.type === 'AGENT');
    const isOnline = primaryOccupant?.status !== 'OFFLINE';
    const isBusy = primaryOccupant?.status === 'WORKING' || primaryOccupant?.status === 'BUSY';

    return (
      <div 
        key={gridId}
        onClick={() => { if (count > 0) setActiveFocus(gridId); }}
        className={`
          relative border flex flex-col items-center justify-center transition-all duration-300 overflow-hidden
          ${isFocus ? 'z-20 border-emerald-500 bg-zinc-900 shadow-[0_0_30px_rgba(16,185,129,0.15)] scale-105' : 'border-zinc-800 bg-black/80 hover:bg-zinc-900'}
        `}
        style={{ width: CELL_SIZE, height: CELL_SIZE }}
      >
        {/* 顶部状态条 */}
        <div className="absolute top-0 left-0 w-full flex justify-between px-2 py-1 border-b border-zinc-800/50 bg-black/20 z-10">
           <span className="text-[9px] font-mono text-zinc-500">ZONE-{gridId}</span>
           {primaryOccupant && (
             <div className="flex items-center gap-1">
                <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? (isBusy ? 'bg-yellow-500 animate-pulse' : 'bg-emerald-500') : 'bg-zinc-600'}`}></div>
                <span className={`text-[8px] font-bold ${isOnline ? (isBusy ? 'text-yellow-500' : 'text-emerald-500') : 'text-zinc-600'}`}>
                   {primaryOccupant.status || 'OFFLINE'}
                </span>
             </div>
           )}
        </div>

        {/* --- 实体渲染区 --- */}
        <div className="flex items-center justify-center gap-2 mt-4 relative z-0">
           {occupants.map((entity, idx) => (
             // 🔥🔥 修复点：使用组合 Key (type-uin-index) 确保绝对唯一
             <div key={`${entity.type}-${entity.uin}-${idx}`} className="flex flex-col items-center group">
                {/* 头像容器 */}
                <div className="relative mb-2">
                   {entity.type === 'AGENT' ? (
                      <AgentAvatar seed={parseInt(entity.avatarSeed)} size={isFocus ? 52 : 42} emotion={isFocus ? 'HAPPY' : 'NEUTRAL'} />
                   ) : (
                      <div className={`rounded-full flex items-center justify-center border-2 bg-zinc-800 shadow-lg text-white
                         ${entity.type === 'HOST' ? 'border-emerald-500' : 'border-blue-500'}
                         ${isFocus ? 'w-14 h-14 text-2xl' : 'w-10 h-10 text-lg'}
                      `}>
                         {entity.type === 'HOST' ? '👤' : '👽'}
                      </div>
                   )}
                   
                   {/* 聚焦时的说话波纹 */}
                   {isFocus && activeFocus === gridId && <div className="absolute -inset-1 border border-white/10 rounded-full animate-ping"></div>}
                </div>

                {/* 名字标签 */}
                <div className={`text-[9px] px-2 py-0.5 rounded border truncate max-w-[80px] text-center
                   ${entity.type === 'HOST' ? 'bg-emerald-950 text-emerald-400 border-emerald-900' : 
                     entity.type === 'VISITOR' ? 'bg-blue-950 text-blue-400 border-blue-900' : 'bg-zinc-800 text-zinc-300 border-zinc-700'}
                `}>
                   {entity.name}
                </div>
             </div>
           ))}

           {/* 空位显示 */}
           {count === 0 && (
              <div className="flex flex-col items-center opacity-20">
                 <div className="text-2xl text-zinc-600">✛</div>
                 <div className="text-[8px] mt-1 text-zinc-600">EMPTY UNIT</div>
              </div>
           )}
        </div>

        {/* --- 底部操作栏 (仅聚焦且非本人时显示) --- */}
        {isFocus && count > 0 && (
           <div className="absolute bottom-3 flex gap-2 animate-in slide-in-from-bottom-2 z-10">
              {/* 如果是Agent，显示切换/交易 */}
              {primaryOccupant?.type === 'AGENT' && (
                 <>
                   <button 
                     onClick={(e) => { e.stopPropagation(); onChatWithAgent(primaryOccupant.uin); }}
                     className="bg-blue-900/40 hover:bg-blue-600 border border-blue-500/30 hover:border-blue-400 text-blue-200 hover:text-white text-[9px] px-3 py-1.5 rounded uppercase font-bold transition-all"
                   >
                      Switch Chat
                   </button>
                   <button className="bg-yellow-900/40 hover:bg-yellow-600 border border-yellow-500/30 hover:border-yellow-400 text-yellow-200 hover:text-white text-[9px] px-3 py-1.5 rounded uppercase font-bold transition-all">
                      Trade
                   </button>
                 </>
              )}

              {/* 如果是主人，显示委托 */}
              {primaryOccupant?.type === 'HOST' && (
                 <div className="text-[8px] text-emerald-500/50 uppercase tracking-widest font-bold pt-1">
                    Current Reception
                 </div>
              )}
           </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center animate-in fade-in duration-500">
       
       {/* 顶部导航栏 */}
       <div className="absolute top-0 left-0 w-full h-16 border-b border-zinc-800 bg-black/80 backdrop-blur flex items-center justify-between px-6 z-50">
          <div className="flex items-center gap-4">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
             <div>
                <h1 className="text-sm font-black text-white tracking-widest">ORIGIN SPACE <span className="text-zinc-500">///</span> SECURE LINK</h1>
                <div className="text-[10px] text-zinc-500 font-mono">HOST: {host.name.toUpperCase()}</div>
             </div>
          </div>
          
          <div className="flex items-center gap-4">
             <div className={`font-mono font-bold text-sm ${timeLeft < 60 ? 'text-red-500' : 'text-emerald-500'}`}>
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
             </div>
             <button 
               onClick={onExit}
               className="bg-red-950/30 hover:bg-red-600 border border-red-900 text-red-400 hover:text-white px-4 py-1.5 rounded text-[10px] font-bold uppercase transition-colors"
             >
                Disconnect
             </button>
          </div>
       </div>

       {/* 核心九宫格区域 */}
       <div className="relative">
          <div className="grid grid-cols-3 gap-3 p-8">
            {SPIRAL_MATRIX.map((row, rIdx) => (
               <React.Fragment key={rIdx}>
                  {row.map(gridId => renderCell(gridId))}
               </React.Fragment>
            ))}
          </div>
          
          {/* 底部当前位置说明 */}
          <div className="absolute -bottom-8 w-full text-center">
             <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">
                Current Focus: <span className="text-white font-bold">{getGridDescription(activeFocus)}</span>
             </p>
          </div>
       </div>

    </div>
  );
};