"use client";
import React, { useRef, useMemo, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';

// 动态导入 3D 库，避免服务端渲染 (SSR) 报错
const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), { ssr: false });

interface AgentNode {
  id: string;
  uin: string;
  name: string;
  group: 'D' | 'V' | 'I'; // 物种分类
  val: number;            // 节点大小 (基于连接数)
  color: string;
  desc?: string;
}

interface Link {
  source: string;
  target: string;
  value: number; // 连线粗细 (基于合约金额)
}

interface GalaxyMapProps {
  myUin: string;
  agents: any[];        // 所有的 Agent 列表
  contracts?: any[];    // 合约列表 (用于生成连线)
  onAgentClick?: (id: string) => void;
  onVisit?: (target: any) => void;
  canVisitExternal?: boolean;
}

export const GalaxyMap = ({ myUin, agents = [], contracts = [], onAgentClick, onVisit, canVisitExternal = false }: GalaxyMapProps) => {
  const fgRef = useRef<any>();
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const containerRef = useRef<HTMLDivElement>(null);

  // 自适应窗口大小
  useEffect(() => {
    if (containerRef.current) {
      setDimensions({
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight
      });
    }
  }, []);

  // 🔥 核心逻辑：数据转换与价值计算
  const graphData = useMemo(() => {
    const nodes: AgentNode[] = [];
    const links: Link[] = [];

    // 1. 构建节点 (Nodes)
    agents.forEach(agent => {
      const uin = agent.uin || 'UNKNOWN';
      const prefix = uin.charAt(0).toUpperCase();
      
      // 物种颜色与基础大小定义
      let color = '#10b981'; // V (默认绿色)
      let group: any = 'V';
      let baseSize = 4;

      if (prefix === 'D') {
        color = '#3b82f6'; // D (蓝色 - 房东)
        group = 'D';
        baseSize = 8; // 数字人更大
      } else if (prefix === 'I') {
        color = '#a855f7'; // I (紫色 - 互联网移民)
        group = 'I';
        baseSize = 5;
      }

      // 模拟社交热度：随机增加一点大小，或者基于真实连接数
      // 在真实逻辑中，这里应该读取 agent.stats.connection_count
      const socialBonus = Math.random() * 5; 

      nodes.push({
        id: agent.id, //以此为唯一键
        uin: uin,
        name: agent.name,
        group,
        val: baseSize + socialBonus, // 🔥 节点大小 = 基础 + 社交价值
        color,
        desc: `${group}-Class Intelligence`
      });
    });

    // 2. 构建连线 (Links) - 基于智能合约
    // 只有当 contracts 存在时才生成连线
    if (contracts && contracts.length > 0) {
      contracts.forEach((c: any) => {
        // 假设 contract 对象里有 buyer_agent_id 和 provider_agent_id
        // 这里做个简单映射，确保 source 和 target 都在 nodes 里存在
        const sourceNode = nodes.find(n => n.uin === c.buyer_uin || n.uin === myUin); // 简化逻辑：我的合约
        const targetNode = nodes.find(n => n.uin === c.provider_agent_uin || n.id === c.agent?.id);

        if (sourceNode && targetNode && sourceNode.id !== targetNode.id) {
           links.push({
              source: sourceNode.id,
              target: targetNode.id,
              value: 1 // 线条粗细
           });
        }
      });
    }

    // 3. 补充：如果只有一个节点 (我)，加几个虚拟邻居节点演示“星图”效果
    if (nodes.length === 1 && canVisitExternal) {
       for(let i=0; i<5; i++) {
          nodes.push({
             id: `mock-${i}`,
             uin: `I-MOCK-${i}`,
             name: `Unknown Signal ${i+1}`,
             group: 'I',
             val: 2,
             color: '#64748b', // 灰色未知节点
             desc: 'Unidentified Signal'
          });
          // 虚线连接
          links.push({ source: nodes[0].id, target: `mock-${i}`, value: 0.5 });
       }
    }

    return { nodes, links };
  }, [agents, contracts, myUin, canVisitExternal]);

  // 点击节点事件
  const handleClick = (node: any) => {
    if (!fgRef.current) return;

    // 1. 飞行聚焦
    const distance = 40;
    const distRatio = 1 + distance/Math.hypot(node.x, node.y, node.z);
    
    fgRef.current.cameraPosition(
      { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio }, // new position
      node, // lookAt ({ x, y, z })
      3000  // ms transition duration
    );

    // 2. 触发回调
    if (node.id.startsWith('mock-')) {
       // 如果是模拟的外部节点，触发访问
       if(onVisit) onVisit({ name: node.name, ownerUin: node.uin, agents: [] });
    } else {
       if(onAgentClick) onAgentClick(node.id);
    }
  };

  return (
    <div ref={containerRef} className="w-full h-full min-h-[500px] bg-black relative rounded-xl overflow-hidden border border-zinc-800 shadow-2xl">
       {/* 顶部 HUD */}
       <div className="absolute top-4 left-4 z-10 pointer-events-none">
          <div className="flex items-center gap-2">
             <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
             <span className="text-[10px] font-mono text-emerald-500 tracking-widest">GALAXY LINK: ACTIVE</span>
          </div>
          <div className="text-[9px] text-zinc-600 font-mono mt-1">NODES: {graphData.nodes.length} | LINKS: {graphData.links.length}</div>
       </div>

       {/* 3D 渲染区 */}
       <ForceGraph3D
          ref={fgRef}
          width={dimensions.width}
          height={dimensions.height}
          graphData={graphData}
          
          // 节点样式
          nodeLabel="name"
          nodeColor="color"
          nodeVal="val" // 节点大小
          nodeRelSize={0.8} // 相对缩放
          nodeResolution={16} // 节点平滑度
          nodeOpacity={0.9}

          // 连线样式
          linkWidth="value"
          linkColor={() => 'rgba(100, 255, 218, 0.2)'} // 淡淡的青色连线
          linkDirectionalParticles={2} // 粒子流光效果 (代表数据传输)
          linkDirectionalParticleSpeed={0.005}
          linkDirectionalParticleWidth={1.5}
          
          // 环境配置
          backgroundColor="#000000"
          showNavInfo={false}
          
          // 交互
          onNodeClick={handleClick}
          
          // 初始化视角
          cooldownTicks={100}
          onEngineStop={() => {
             if (fgRef.current) {
                fgRef.current.zoomToFit(400);
             }
          }}
       />
       
       {/* 底部图例 */}
       <div className="absolute bottom-4 right-4 z-10 bg-black/80 p-2 rounded border border-zinc-800 backdrop-blur-sm">
          <div className="flex gap-4 text-[9px] font-bold font-mono">
             <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> DIGITAL (D)</div>
             <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> VIRTUAL (V)</div>
             <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500"></span> INTERNET (I)</div>
          </div>
       </div>
    </div>
  );
};