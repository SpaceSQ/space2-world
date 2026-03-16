"use client";
import React, { useState } from 'react';
import { GalaxyMap } from '@/components/GalaxyMap';
import { FloorPlanGrid } from '@/components/FloorPlanGrid';
// 假设这是之前的数据获取 Hook
// import { useMyAgents } from '@/hooks/useAgents'; 

export default function FleetManagement() {
  const [viewMode, setViewMode] = useState<'GALAXY' | 'FLOOR'>('FLOOR');
  
  // 模拟数据 (替换为真实数据)
  const myUin = 'D-HUMAN-001';
  const owner = { uin: myUin, visual_model: '100', suns_address: 'MARS-CN-001-ELON' };
  const agents = [
    { uin: 'V-AGT-001', name: 'Alpha', status: 'IDLE', visual_model: '10' },
    { uin: 'V-AGT-002', name: 'Beta', status: 'BUSY', visual_model: '20' },
  ];
  // 模拟占位
  const occupancy = [
     { grid_id: 2, entity_uin: 'V-AGT-001' },
     { grid_id: 3, entity_uin: 'V-AGT-002' }
  ];

  return (
    <div className="pt-20 px-6 pb-12 h-screen flex flex-col">
       {/* 头部控制栏 */}
       <div className="flex justify-between items-end mb-6">
          <div>
             <h2 className="text-2xl font-black text-white">FLEET OPERATIONS</h2>
             <div className="text-xs text-zinc-500 font-mono">Managing Sector: {owner.suns_address}</div>
          </div>
          
          {/* 视图切换器 */}
          <div className="bg-zinc-900 p-1 rounded-lg flex gap-1 border border-zinc-800">
             <button 
               onClick={() => setViewMode('FLOOR')}
               className={`px-4 py-1.5 text-[10px] font-bold rounded transition-all flex items-center gap-2 ${viewMode === 'FLOOR' ? 'bg-emerald-600 text-white shadow' : 'text-zinc-500 hover:text-white'}`}
             >
                <span>📐</span> FLOOR PLAN
             </button>
             <button 
               onClick={() => setViewMode('GALAXY')}
               className={`px-4 py-1.5 text-[10px] font-bold rounded transition-all flex items-center gap-2 ${viewMode === 'GALAXY' ? 'bg-indigo-600 text-white shadow' : 'text-zinc-500 hover:text-white'}`}
             >
                <span>🌌</span> GALAXY MAP
             </button>
          </div>
       </div>

       {/* 主视图区域 */}
       <div className="flex-1 bg-black border border-zinc-800 rounded-2xl relative overflow-hidden flex items-center justify-center">
          {viewMode === 'GALAXY' ? (
             <div className="w-full h-full">
                {/* 传入真实数据 */}
                <GalaxyMap 
                   myUin={myUin} 
                   agents={agents} 
                   contracts={[]} 
                   onAgentClick={(id) => console.log(id)} 
                />
             </div>
          ) : (
             <div className="transform scale-110">
                {/* @ts-ignore */}
                <FloorPlanGrid 
                   owner={{ ...owner, name: 'LORD COMMANDER' }}
                   agents={agents as any}
                   occupancy={occupancy}
                   isViewerOwner={true}
                   isPublicSpace={false} // 私有领地，非虚影模式
                />
             </div>
          )}
          
          {/* 底部状态栏 */}
          <div className="absolute bottom-6 left-6 bg-black/80 backdrop-blur border border-zinc-800 px-4 py-2 rounded-full text-[10px] text-zinc-400 font-mono flex gap-4">
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <span>ONLINE: 2</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span>BUSY: 1</span>
             </div>
          </div>
       </div>
    </div>
  );
}