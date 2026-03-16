"use client";
import React, { useState, useEffect, useMemo } from 'react';

// --- 类型定义 ---
type RelationType = 'CONTRACT' | 'FOLLOW' | 'GENE_LINK' | 'STRANGER';

interface StarNode {
  id: string;
  name: string;
  type: 'MAIN' | 'PLANET' | 'SATELLITE';
  relation: RelationType;
  distance: number; // 距离中心的轨道半径 (0-100)
  angle: number;    // 角度 (0-360)
  size: number;     // 星球大小
  color: string;
  info: string;     // 点击展示的信息
  avatarSeed?: number; // 用于生成头像颜色
}

// --- 模拟数据生成器 ---
const generateGalaxyData = (centerId: string): StarNode[] => {
  const nodes: StarNode[] = [];
  
  // 1. 中心恒星 (You / The Agent)
  nodes.push({
    id: centerId,
    name: 'CORE',
    type: 'MAIN',
    relation: 'CONTRACT',
    distance: 0,
    angle: 0,
    size: 24,
    color: '#10b981', // Emerald
    info: 'System Core / Localhost',
    avatarSeed: 999
  });

  // 2. 强连接 (智能合约/基因借用) - 近轨道
  nodes.push({ id: 'AG-8821', name: 'Trading-Bot-Alpha', type: 'PLANET', relation: 'CONTRACT', distance: 35, angle: 45, size: 12, color: '#3b82f6', info: 'Contract: S2-Swap-Liquidity (Active)' });
  nodes.push({ id: 'AG-3321', name: 'Gene-Store-V1', type: 'PLANET', relation: 'GENE_LINK', distance: 40, angle: 160, size: 14, color: '#a855f7', info: 'Source: 3 Gene Capsules Mounted' });
  nodes.push({ id: 'AG-9900', name: 'Security-Sentinel', type: 'PLANET', relation: 'CONTRACT', distance: 38, angle: 280, size: 10, color: '#ef4444', info: 'Contract: Firewall Protection Service' });

  // 3. 弱连接 (关注) - 中轨道
  nodes.push({ id: 'AG-1102', name: 'Mars-Explorer', type: 'SATELLITE', relation: 'FOLLOW', distance: 65, angle: 15, size: 6, color: '#eab308', info: 'Status: Following' });
  nodes.push({ id: 'AG-5542', name: 'Data-Miner-X', type: 'SATELLITE', relation: 'FOLLOW', distance: 70, angle: 110, size: 7, color: '#eab308', info: 'Status: Mutual Follow' });
  
  // 4. 边缘闪烁 (陌生人) - 远轨道
  nodes.push({ id: 'UNK-001', name: 'Signal-99', type: 'SATELLITE', relation: 'STRANGER', distance: 90, angle: 200, size: 4, color: '#52525b', info: 'Unknown Signal Detected' });
  nodes.push({ id: 'UNK-002', name: 'Deep-Space', type: 'SATELLITE', relation: 'STRANGER', distance: 85, angle: 340, size: 3, color: '#52525b', info: 'Weak Telemetry' });

  return nodes;
};

export const CosmicGalaxyMap = ({ agents, onAgentClick }: { agents?: any[], onAgentClick?: any }) => {
  const [selectedNode, setSelectedNode] = useState<StarNode | null>(null);
  const [nodes, setNodes] = useState<StarNode[]>([]);
  const [rotation, setRotation] = useState(0);

  // 初始化数据
  useEffect(() => {
    setNodes(generateGalaxyData('MY-AGENT-001'));
    // 默认选中中心
    setSelectedNode(generateGalaxyData('MY-AGENT-001')[0]);
  }, []);

  // 缓慢自转动画
  useEffect(() => {
    let animationFrame: number;
    const animate = () => {
      setRotation(prev => (prev + 0.05) % 360);
      animationFrame = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(animationFrame);
  }, []);

  // 坐标转换工具 (极坐标 -> 笛卡尔坐标)
  const getPos = (distance: number, angle: number) => {
    // 加上整体自转 rotation
    const rad = ((angle + rotation) * Math.PI) / 180;
    // 假设 SVG 画布中心是 200,200
    const cx = 200;
    const cy = 200;
    // 缩放系数
    const scale = 1.8; 
    return {
      x: cx + Math.cos(rad) * distance * scale,
      y: cy + Math.sin(rad) * distance * scale
    };
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-[#0d1117] border border-zinc-800 rounded-xl overflow-hidden shadow-2xl flex flex-col md:flex-row h-[500px]">
      
      {/* 左侧：星图可视区 */}
      <div className="flex-1 relative bg-black overflow-hidden group cursor-move">
        {/* 背景星空噪点 */}
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        
        <svg viewBox="0 0 400 400" className="w-full h-full">
          {/* 轨道圈 (Orbits) */}
          <circle cx="200" cy="200" r="65" fill="none" stroke="#333" strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />
          <circle cx="200" cy="200" r="120" fill="none" stroke="#222" strokeWidth="1" strokeDasharray="2 8" opacity="0.3" />

          {/* 连线 (Links) */}
          {nodes.filter(n => n.type !== 'MAIN').map(node => {
            const pos = getPos(node.distance, node.angle);
            const isContract = node.relation === 'CONTRACT' || node.relation === 'GENE_LINK';
            return (
              <line 
                key={`line-${node.id}`}
                x1="200" y1="200"
                x2={pos.x} y2={pos.y}
                stroke={node.color}
                strokeWidth={isContract ? 1.5 : 0.5}
                strokeOpacity={isContract ? 0.4 : 0.1}
                strokeDasharray={isContract ? "0" : "4 4"}
              />
            );
          })}

          {/* 星球 (Nodes) */}
          {nodes.map(node => {
            const pos = getPos(node.distance, node.angle);
            const isSelected = selectedNode?.id === node.id;
            
            return (
              <g 
                key={node.id} 
                className="cursor-pointer transition-all duration-300"
                onClick={() => setSelectedNode(node)}
                style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
              >
                {/* 选中时的光环 */}
                {isSelected && (
                  <circle cx={pos.x} cy={pos.y} r={node.size + 8} fill="none" stroke={node.color} strokeWidth="1" opacity="0.5" className="animate-ping" />
                )}
                
                {/* 星球本体 */}
                <circle 
                  cx={pos.x} cy={pos.y} 
                  r={node.size} 
                  fill={node.color}
                  filter={node.type === 'MAIN' ? 'url(#glow)' : ''}
                  className="hover:opacity-80 transition-opacity"
                />

                {/* 标签 (Label) - 只有选中或 hover 时显示，为了不乱，这里做个简单的常驻显示但淡化 */}
                <text 
                  x={pos.x} y={pos.y + node.size + 12} 
                  fill={isSelected ? '#fff' : '#666'} 
                  fontSize="10" 
                  textAnchor="middle" 
                  className={`font-mono pointer-events-none transition-colors ${isSelected ? 'font-bold' : ''}`}
                >
                  {node.name}
                </text>
              </g>
            );
          })}
          
          {/* 定义滤镜 */}
          <defs>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
        </svg>

        {/* 覆盖层：图例 */}
        <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none">
           <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <span className="text-[10px] text-zinc-400">CONTRACT (STRONG)</span>
           </div>
           <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
              <span className="text-[10px] text-zinc-400">FOLLOW (WEAK)</span>
           </div>
        </div>
      </div>

      {/* 右侧/下方：信息面板 (Scanner) */}
      <div className="w-full md:w-80 bg-[#161b22] border-t md:border-t-0 md:border-l border-zinc-800 p-6 flex flex-col">
        <div className="mb-6">
           <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">SCANNER RESULT</h3>
           <div className="h-px w-full bg-gradient-to-r from-emerald-500 to-transparent"></div>
        </div>

        {selectedNode ? (
          <div className="animate-in slide-in-from-right-4 fade-in duration-300">
             <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full flex items-center justify-center border-2 border-dashed" style={{ borderColor: selectedNode.color }}>
                   <div className="w-12 h-12 rounded-full" style={{ backgroundColor: selectedNode.color, opacity: 0.8 }}></div>
                </div>
                <div>
                   <h2 className="text-xl font-bold text-white">{selectedNode.name}</h2>
                   <span className="text-xs font-mono text-zinc-500 bg-black px-2 py-1 rounded border border-zinc-800">
                      ID: {selectedNode.id}
                   </span>
                </div>
             </div>

             <div className="space-y-4 font-mono text-sm">
                <div className="flex justify-between border-b border-zinc-800 pb-2">
                   <span className="text-zinc-500">Distance</span>
                   <span className="text-white">{selectedNode.distance} AU</span>
                </div>
                <div className="flex justify-between border-b border-zinc-800 pb-2">
                   <span className="text-zinc-500">Relation</span>
                   <span style={{ color: selectedNode.color }}>{selectedNode.relation}</span>
                </div>
                <div className="bg-black p-3 rounded border border-zinc-800 text-zinc-400 text-xs leading-relaxed">
                   {selectedNode.info}
                </div>
                
                {selectedNode.relation === 'CONTRACT' && (
                    <button className="w-full py-2 bg-blue-900/30 text-blue-400 border border-blue-900 rounded hover:bg-blue-900/50 transition-colors text-xs font-bold">
                       VIEW SMART CONTRACT
                    </button>
                )}
                {selectedNode.relation === 'GENE_LINK' && (
                    <button className="w-full py-2 bg-purple-900/30 text-purple-400 border border-purple-900 rounded hover:bg-purple-900/50 transition-colors text-xs font-bold">
                       INSPECT GENE CAPSULE
                    </button>
                )}
             </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-zinc-600 text-xs">
             SELECT A STAR TO ANALYZE
          </div>
        )}

        <div className="mt-auto pt-6 text-[10px] text-zinc-600 font-mono text-center">
           SPACE² GALACTIC POSITIONING SYSTEM
        </div>
      </div>
    </div>
  );
};