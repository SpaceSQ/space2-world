"use client";
import React from 'react';
import { AgentAvatar } from '@/components/AgentAvatar';
import { RoomInterior } from '@/components/RoomInterior';
import { AgentHukouBook } from '@/components/AgentHukouBook';

interface AgentViewProps {
  selfUin: string;        // 当前登录的 Agent ID
  landlord: any;          // 房东信息
  agents: any[];          // 所有邻居 (包含自己)
  occupancy: any[];       // 占位信息
  onChat: (targetUin: string) => void;
}

export const AgentPerspectiveGrid = ({ selfUin, landlord, agents, occupancy, onChat }: AgentViewProps) => {
  
  // 1. 数据重组：将所有实体拍平，并标记角色
  const allEntities = [
    { ...landlord, isLandlord: true, gridId: 1, uin: landlord.uin }, // 房东永远在 Grid 1
    ...agents.map(ag => {
       const occ = occupancy.find(o => o.entity_uin === ag.uin);
       return { ...ag, isLandlord: false, gridId: occ?.grid_id || 0, uin: ag.uin };
    })
  ];

  // 2. 布局策略：使用 CSS Grid Area
  // 我们定义一个 3x3 的网格，但中心区域 (Row 2, Col 2) 实际上可能通过 CSS 放大
  // 或者，我们使用 Flex 布局，中间大，周围小
  
  // 更好的策略：
  // 无论我在哪个物理 Grid (比如 Grid 3), 在我的视图里，我就在中间。
  // 其他人相对位置保持不变？不，原来的九宫格物理位置不能乱。
  // 方案：保持物理九宫格结构，但利用 CSS transform scale 放大“我”所在的格子，并挤压其他格子？
  // 不，用户要求：我的空间在中间占50%。这意味着我们要“重绘”地图。
  
  // 算法：
  // Center Slot: 我 (Self)
  // Top/Left/Right/Bottom Slots: 邻居和房东 (按物理距离排序或直接平铺)
  
  // 为了简化且满足需求，我们构建一个 "1 + 8" 布局
  // 中间是 Self，周围一圈 8 个位置放其他人。
  // 需要把其他人（含房东）填入周围 8 个坑。
  
  const selfEntity = allEntities.find(e => e.uin === selfUin);
  const others = allEntities.filter(e => e.uin !== selfUin);

  // 渲染单个迷你格子
  const renderMiniCell = (entity: any) => {
     if (!entity) return <div className="w-full h-full bg-[#050505] border border-zinc-900/50 rounded opacity-50"></div>;
     
     return (
       <div 
         onClick={() => onChat(entity.uin)}
         className={`relative w-full h-full bg-black border rounded-lg overflow-hidden cursor-pointer group transition-all
            ${entity.isLandlord ? 'border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.4)]' : 'border-zinc-800 hover:border-zinc-600'}
         `}
       >
          <div className="absolute inset-0 opacity-30 group-hover:opacity-50 transition-opacity">
             <RoomInterior styleId={entity.room_style || 'default'} status={entity.status || 'IDLE'} intensity={0.5} />
          </div>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
             <div className="scale-75">
                <AgentAvatar 
                   seed={parseInt(entity.visual_model || '100')} 
                   size={60} 
                   isHuman={entity.isLandlord} 
                   emotion="NEUTRAL"
                />
             </div>
             <div className="mt-1 text-[8px] font-bold text-white bg-black/80 px-2 rounded border border-zinc-800 truncate max-w-[90%]">
                {entity.name}
             </div>
             {entity.isLandlord && (
                <div className="absolute top-1 right-1 text-[6px] bg-red-600 text-white px-1 rounded font-black">LANDLORD</div>
             )}
          </div>
       </div>
     );
  };

  return (
    <div className="w-full max-w-4xl mx-auto aspect-video bg-[#020202] border border-zinc-800 rounded-2xl p-4 flex gap-4">
       
       {/* 左侧：周边邻居列表 (Grid 布局, 2列 x 4行) */}
       <div className="w-1/3 grid grid-cols-2 grid-rows-4 gap-2">
          {others.slice(0, 8).map((other, idx) => (
             <div key={idx} className="w-full h-full">
                {renderMiniCell(other)}
             </div>
          ))}
          {/* 填补空位 */}
          {Array.from({ length: Math.max(0, 8 - others.length) }).map((_, i) => (
             <div key={`empty-${i}`} className="w-full h-full bg-zinc-900/20 border border-zinc-800/30 rounded border-dashed"></div>
          ))}
       </div>

       {/* 右侧：我 (占据 2/3 区域，巨大化) */}
       <div className="flex-1 relative bg-zinc-950 border-2 border-emerald-500/50 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(16,185,129,0.1)]">
          {/* 1. 我的装修 */}
          <div className="absolute inset-0 z-0">
             <RoomInterior styleId={selfEntity?.room_style || 'default'} status={selfEntity?.status || 'IDLE'} intensity={1} />
          </div>

          {/* 2. 我的户口薄 (仅我看得到) */}
          <div className="absolute top-4 right-4 z-20">
             <AgentHukouBook agentUin={selfUin} agentName={selfEntity?.name || 'ME'} />
          </div>

          {/* 3. 我的本尊 */}
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
             <div className="scale-150 drop-shadow-2xl">
                <AgentAvatar 
                   seed={parseInt(selfEntity?.visual_model || '100')} 
                   size={120} 
                   emotion="HAPPY" 
                   isHuman={false}
                />
             </div>
             <div className="mt-8 text-2xl font-black text-white tracking-widest">{selfEntity?.name}</div>
             <div className="text-xs text-emerald-500 font-mono mt-1">{selfUin}</div>
             <div className="mt-4 flex gap-2">
                <span className="px-3 py-1 bg-black/50 border border-zinc-700 rounded text-[10px] text-zinc-400">STATUS: ONLINE</span>
                <span className="px-3 py-1 bg-black/50 border border-zinc-700 rounded text-[10px] text-zinc-400">GRID: #{selfEntity?.gridId}</span>
             </div>
          </div>
          
          <div className="absolute bottom-4 left-4 text-[9px] text-zinc-600 font-mono">
             PERSPECTIVE: FIRST_PERSON_SILICON
          </div>
       </div>

    </div>
  );
};