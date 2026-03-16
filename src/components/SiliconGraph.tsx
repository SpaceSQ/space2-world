"use client";
import React, { useMemo } from 'react';

// 类型定义
interface Node {
  id: string;
  type: 'CITIZEN' | 'OWNED_AGENT' | 'CONTRACT_AGENT';
  label: string;
  status: string;
  avatarSeed: string; // 用于生成颜色或图标
}

interface Link {
  source: string;
  target: string;
  type: 'BLOODLINE' | 'CONTRACT'; // 血缘 vs 合约
}

export const SiliconGraph = ({ 
  profile, 
  agents, 
  contracts 
}: { 
  profile: any, 
  agents: any[], 
  contracts: any[] 
}) => {
  
  // 1. 构建节点和连线数据
  const { nodes, links } = useMemo(() => {
    const nodes: Node[] = [];
    const links: Link[] = [];
    const centerX = 400;
    const centerY = 300;

    // A. 核心节点：数字人 (Citizen)
    if (profile) {
      nodes.push({
        id: profile.uin,
        type: 'CITIZEN',
        label: 'COMMANDER',
        status: profile.status,
        avatarSeed: profile.uin
      });
    }

    // B. 内环节点：自有 Agents (Owned)
    // 环绕半径 180
    agents.forEach((agent, i) => {
      const angle = (i / (agents.length || 1)) * 2 * Math.PI;
      const x = centerX + Math.cos(angle) * 180;
      const y = centerY + Math.sin(angle) * 180;
      
      nodes.push({
        id: agent.uin,
        type: 'OWNED_AGENT',
        label: agent.name,
        status: agent.status,
        avatarSeed: agent.visual_model,
        // 临时存一下坐标，实际应该用力导向图库，这里手算为了轻量
        x, y 
      } as any);

      // 血脉连线
      links.push({
        source: profile?.uin,
        target: agent.uin,
        type: 'BLOODLINE'
      });
    });

    // C. 外环节点：合约 Agents (Contracted)
    // 环绕半径 280，且位置稍微偏移
    contracts.forEach((svc, i) => {
      // 为了不重叠，加个偏移量
      const angle = (i / (contracts.length || 1)) * 2 * Math.PI + 0.5; 
      const x = centerX + Math.cos(angle) * 280;
      const y = centerY + Math.sin(angle) * 280;

      nodes.push({
        id: svc.agent.uin,
        type: 'CONTRACT_AGENT',
        label: svc.agent.name,
        status: svc.agent.status,
        avatarSeed: svc.agent.visual_model,
        x, y
      } as any);

      // 合约连线 (虚线)
      links.push({
        source: profile?.uin,
        target: svc.agent.uin,
        type: 'CONTRACT'
      });
    });

    return { nodes, links };
  }, [profile, agents, contracts]);

  if (!profile) return null;

  return (
    <div className="w-full h-[600px] bg-zinc-950/50 border border-zinc-800 rounded-2xl relative overflow-hidden flex flex-col items-center justify-center">
      
      {/* 标题 */}
      <div className="absolute top-4 left-6 z-10">
        <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
           Silicon Genealogy Graph 
           <span className="text-[9px] bg-zinc-800 px-2 py-0.5 rounded text-zinc-500">FAMILY TREE</span>
        </h2>
      </div>

      {/* 核心 SVG */}
      <svg className="w-full h-full" viewBox="0 0 800 600">
        <defs>
          {/* 发光滤镜 */}
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 1. 绘制轨道 (Orbits) */}
        <circle cx="400" cy="300" r="180" fill="none" stroke="#10b981" strokeWidth="1" strokeOpacity="0.1" strokeDasharray="5,5" className="animate-[spin_60s_linear_infinite]" />
        <circle cx="400" cy="300" r="280" fill="none" stroke="#3b82f6" strokeWidth="1" strokeOpacity="0.1" strokeDasharray="5,5" className="animate-[spin_120s_linear_infinite_reverse]" />

        {/* 2. 绘制连线 */}
        {links.map((link, i) => {
          const sourceNode = nodes.find(n => n.id === link.source) as any;
          const targetNode = nodes.find(n => n.id === link.target) as any;
          if (!sourceNode || !targetNode) return null;

          const isBlood = link.type === 'BLOODLINE';
          const startX = sourceNode.x || 400;
          const startY = sourceNode.y || 300;
          const endX = targetNode.x;
          const endY = targetNode.y;

          return (
            <g key={`link-${i}`}>
              <line 
                x1={startX} y1={startY} x2={endX} y2={endY} 
                stroke={isBlood ? '#10b981' : '#3b82f6'} 
                strokeWidth={isBlood ? 2 : 1} 
                strokeOpacity={isBlood ? 0.4 : 0.3}
                strokeDasharray={isBlood ? '0' : '4,4'}
              />
              {/* 传输粒子的动画 */}
              <circle r={isBlood ? 2 : 1} fill={isBlood ? '#10b981' : '#3b82f6'}>
                <animateMotion dur={isBlood ? "3s" : "6s"} repeatCount="indefinite" path={`M${startX},${startY} L${endX},${endY}`} />
              </circle>
            </g>
          );
        })}

        {/* 3. 绘制节点 */}
        {nodes.map((node: any, i) => {
          const isCenter = node.type === 'CITIZEN';
          const isOwned = node.type === 'OWNED_AGENT';
          const x = node.x || 400;
          const y = node.y || 300;
          const isActive = node.status !== 'OFFLINE';

          // 颜色定义
          const color = isCenter ? '#ffffff' : isOwned ? '#10b981' : '#3b82f6';
          
          return (
            <g key={node.id} className="cursor-pointer hover:opacity-80 transition-opacity">
              {/* 节点光晕 */}
              <circle cx={x} cy={y} r={isCenter ? 30 : 15} fill={color} fillOpacity="0.1" filter="url(#glow)">
                 {isActive && <animate attributeName="r" values={isCenter?"30;35;30":"15;20;15"} dur="3s" repeatCount="indefinite" />}
              </circle>
              
              {/* 节点核心 */}
              <circle cx={x} cy={y} r={isCenter ? 12 : 6} fill={color} stroke="#000" strokeWidth="2" />

              {/* 标签文字 */}
              <text x={x} y={y + (isCenter ? 45 : 25)} textAnchor="middle" fill={color} fontSize={isCenter ? 12 : 9} fontFamily="monospace" fontWeight="bold">
                {node.label}
              </text>
              <text x={x} y={y + (isCenter ? 60 : 35)} textAnchor="middle" fill="#666" fontSize="8" fontFamily="monospace">
                {node.id.slice(0, 8)}...
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};