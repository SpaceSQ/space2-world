"use client";
import React, { useState, useEffect, useRef } from 'react';
import { generateGalaxyMap, StarSystem } from '@/lib/galaxy-utils';

const ROLE_COLORS: any = {
  SERVICE: 'bg-yellow-500 shadow-yellow-500/50',
  LOGIC: 'bg-blue-500 shadow-blue-500/50',
  CREATIVE: 'bg-purple-500 shadow-purple-500/50',
  GUARDIAN: 'bg-emerald-500 shadow-emerald-500/50',
};

// 🔥 修改 1: 面板现在接收 onVisit
const DiplomacyPanel = ({ system, onVisit }: { system: StarSystem, onVisit: (sys: StarSystem) => void }) => (
  <div className="absolute -top-4 left-1/2 -translate-x-1/2 -translate-y-full w-40 bg-black/90 border border-zinc-700 rounded-xl p-2 shadow-2xl backdrop-blur-md z-50 pointer-events-none group-hover/star:pointer-events-auto animate-in fade-in slide-in-from-bottom-2">
    <div className="text-[10px] font-bold text-white mb-1 border-b border-zinc-800 pb-1">{system.name}</div>
    <div className="text-[9px] text-zinc-400 mb-2">{system.status} • Score: {system.score}</div>
    <div className="flex gap-1">
        {/* 🔥 修改 2: 点击 Chat 触发 onVisit */}
        <button 
          onClick={(e) => { e.stopPropagation(); onVisit(system); }}
          className="flex-1 bg-emerald-700 hover:bg-emerald-600 text-white text-[8px] font-bold py-1 rounded uppercase transition-colors"
        >
          Visit
        </button>
        <button className="flex-1 bg-blue-700 hover:bg-blue-600 text-white text-[8px] font-bold py-1 rounded uppercase">Trade</button>
    </div>
  </div>
);

const PlanetPanel = ({ agent }: { agent: any }) => (
  <div className="absolute top-8 left-1/2 -translate-x-1/2 w-32 bg-zinc-900/90 border border-zinc-700 rounded-lg p-2 shadow-xl backdrop-blur-md z-50 pointer-events-none animate-in fade-in zoom-in-95">
    <div className="text-[10px] font-bold text-white text-center truncate">{agent.name}</div>
    <div className="text-[8px] text-zinc-400 text-center uppercase mt-0.5">{agent.role} • {agent.status}</div>
    <div className="text-[8px] text-emerald-500 text-center mt-1">▼ Click to Manage</div>
  </div>
);

const ContractPanel = ({ service }: { service: any }) => (
  <div className="absolute top-6 left-1/2 -translate-x-1/2 w-36 bg-blue-950/90 border border-blue-500/30 rounded-lg p-2 shadow-xl backdrop-blur-md z-50 pointer-events-none animate-in fade-in zoom-in-95">
    <div className="text-[9px] font-bold text-blue-200 text-center truncate">{service.agent.name}</div>
    <div className="text-[8px] text-blue-400 text-center uppercase mt-0.5">EXTERNAL CONTRACT</div>
    <div className="text-[8px] text-zinc-400 text-center mt-1 truncate">{service.terms.slice(0, 20)}...</div>
  </div>
);

interface GalaxyMapProps {
  myUin: string;
  agents: any[];
  contracts?: any[];
  onAgentClick: (agentId: string) => void;
  onVisit: (system: any) => void; // 🔥 新增回调定义
}

export const GalaxyMap = ({ myUin, agents, contracts = [], onAgentClick, onVisit }: GalaxyMapProps) => {
  const [systems, setSystems] = useState<StarSystem[]>([]);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setSystems(generateGalaxyMap(myUin));
  }, [myUin]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('.clickable-object')) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
  };
  const handleMouseUp = () => setIsDragging(false);

  return (
    <div 
      className="w-full h-[600px] bg-[#050505] border border-zinc-800 rounded-2xl relative overflow-hidden cursor-move select-none group/map"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ backgroundPosition: `${offset.x * 0.1}px ${offset.y * 0.1}px`, backgroundImage: 'radial-gradient(white 1px, transparent 1px)', backgroundSize: '60px 60px' }}></div>

      <div className="absolute top-1/2 left-1/2 w-0 h-0 flex items-center justify-center transition-transform duration-75 ease-out" style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}>
        <div className="absolute w-[320px] h-[320px] rounded-full border border-white/10 pointer-events-none"></div> 
        <div className="absolute w-[500px] h-[500px] rounded-full border border-blue-500/10 pointer-events-none border-dashed animate-[spin_120s_linear_infinite]"></div>

        {/* You */}
        <div className="relative z-20 flex flex-col items-center justify-center group/sun">
           <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-[0_0_60px_#10b981] flex items-center justify-center text-3xl relative z-10 hover:scale-110 transition-transform cursor-pointer" onClick={() => setOffset({x:0, y:0})}>🌞</div>
           <div className="mt-2 bg-black/60 px-2 py-0.5 rounded text-[10px] text-emerald-400 font-bold tracking-widest backdrop-blur-sm border border-emerald-500/20">HOME BASE</div>
        </div>

        {/* Owned Agents */}
        {agents.map((agent, index) => {
          const total = agents.length || 1;
          const angle = (index / total) * 2 * Math.PI - (Math.PI / 2);
          const radius = 160;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          const colorClass = ROLE_COLORS[agent.role] || 'bg-zinc-500 shadow-zinc-500/50';
          const isOnline = agent.status !== 'OFFLINE';

          return (
            <div key={agent.id} className="absolute clickable-object group/planet transition-all duration-500 hover:z-50" style={{ transform: `translate(${x}px, ${y}px)` }} onClick={() => onAgentClick(agent.id)}>
              <div className={`w-10 h-10 rounded-full border-2 border-black cursor-pointer relative hover:scale-125 transition-transform ${colorClass} shadow-lg ${isOnline ? 'animate-[pulse_4s_infinite]' : 'grayscale opacity-70'}`}>
                 {isOnline && <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 border-2 border-black rounded-full"></div>}
                 <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-white/90">{agent.role[0]}</div>
              </div>
              <div className="hidden group-hover/planet:block"><PlanetPanel agent={agent} /></div>
            </div>
          );
        })}

        {/* Contracts */}
        {contracts.map((svc, index) => {
           const total = contracts.length || 1;
           const angle = (index / total) * 2 * Math.PI + (Math.PI / 4); 
           const radius = 250;
           const x = Math.cos(angle) * radius;
           const y = Math.sin(angle) * radius;
           const isOnline = svc.agent.status !== 'OFFLINE';

           return (
             <div key={svc.contract_id} className="absolute clickable-object group/contract transition-all duration-500 hover:z-40" style={{ transform: `translate(${x}px, ${y}px)` }}>
                <div className={`w-8 h-8 rotate-45 border-2 border-blue-900 cursor-pointer relative hover:scale-110 transition-transform bg-blue-950 shadow-[0_0_15px_#3b82f6] ${!isOnline && 'grayscale opacity-60'}`}>
                   <div className="w-full h-full -rotate-45 flex items-center justify-center text-[10px]">🤖</div>
                </div>
                <svg className="absolute top-1/2 left-1/2 w-[500px] h-[2px] pointer-events-none" style={{ transform: 'translate(0, 0)' }}><line x1="0" y1="0" x2={-x} y2={-y} stroke="#3b82f6" strokeWidth="1" strokeDasharray="2,4" opacity="0.2" /></svg>
                <div className="hidden group-hover/contract:block"><ContractPanel service={svc} /></div>
             </div>
           );
        })}

        {/* Friends (Deep Space) */}
        {systems.map((sys) => {
           const x = Math.cos(sys.angle) * sys.distance;
           const y = Math.sin(sys.angle) * sys.distance;
           return (
             <div key={sys.uin} className="absolute clickable-object group/star hover:z-30 transition-all duration-500" style={{ transform: `translate(${x}px, ${y}px) scale(${sys.scale})` }}>
                <div className="hidden group-hover/star:block transform transition-all" style={{ transform: `scale(${1/sys.scale})` }}>
                   {/* 🔥 传入 onVisit */}
                   <DiplomacyPanel system={sys} onVisit={onVisit} />
                </div>
                <div className={`w-6 h-6 rounded-full shadow-lg flex items-center justify-center text-[10px] relative cursor-pointer hover:ring-2 ring-white transition-all ${sys.status === 'ONLINE' ? 'bg-indigo-600 shadow-[0_0_20px_#6366f1]' : 'bg-zinc-700'}`}>🪐</div>
                <div className="mt-2 text-[8px] text-zinc-500 bg-black/50 px-1 rounded backdrop-blur-sm whitespace-nowrap">{sys.name}</div>
             </div>
           );
        })}

      </div>
      
      <div className="absolute top-4 left-4 pointer-events-none">
         <h2 className="text-sm font-bold text-white flex items-center gap-2">GALACTIC COMMAND <span className="text-[9px] bg-emerald-600 px-1.5 py-0.5 rounded text-white">LIVE</span></h2>
         <div className="text-[9px] text-zinc-500">Internal: {agents.length} • Contracted: {contracts.length}</div>
      </div>
      <button onClick={() => setOffset({x:0, y:0})} className="absolute bottom-4 right-4 bg-zinc-800/80 hover:bg-zinc-700 text-white p-2 rounded-lg text-xs backdrop-blur-md border border-zinc-700 z-50 shadow-lg">🏠 RECENTER VIEW</button>
    </div>
  );
};