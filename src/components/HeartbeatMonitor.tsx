"use client";
import React, { useMemo } from 'react';

interface AgentLog {
  id: string;
  created_at: string;
}

export const HeartbeatMonitor = ({ logs }: { logs: AgentLog[] }) => {
  // 1. 计算时间窗口 (最近 24 小时)
  const now = new Date().getTime();
  const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;

  // 2. 生成波形路径 (SVG Path)
  const pathData = useMemo(() => {
    // 画布宽度 1000单位，高度 50单位
    // X轴: 时间 (0 = 24小时前, 1000 = 现在)
    // Y轴: 25是基准线 (中间)
    
    let path = `M 0 25`; // 起点
    const width = 1000;
    
    // 我们把 24小时切分成 288 个区间 (每5分钟一个格子)
    const slots = new Array(288).fill(0);
    
    logs.forEach(log => {
      const logTime = new Date(log.created_at).getTime();
      if (logTime > twentyFourHoursAgo && logTime <= now) {
        // 计算这个日志落在哪个区间 (0-287)
        const percent = (logTime - twentyFourHoursAgo) / (now - twentyFourHoursAgo);
        const index = Math.floor(percent * 288);
        if (index >= 0 && index < 288) slots[index] = 1;
      }
    });

    // 根据区间生成波形
    slots.forEach((active, i) => {
       const x = (i / 288) * width;
       if (active) {
         // 如果有心跳，画一个脉冲 (QRS波群)
         // 结构: 平 -> 稍微下沉 -> 猛冲向上 -> 猛冲向下 -> 回复
         path += ` L ${x} 25 L ${x+1} 35 L ${x+2} 5 L ${x+3} 45 L ${x+4} 25`;
       } else {
         // 没心跳，画平线 (带有微小的随机抖动，模拟真实噪音)
         const noise = Math.random() * 2 - 1; // -1 到 1 的抖动
         path += ` L ${x+3.5} ${25 + noise}`;
       }
    });

    return path;
  }, [logs, now]);

  return (
    <div className="relative w-full h-32 bg-black border border-zinc-800 rounded-lg overflow-hidden shadow-inner select-none">
      {/* 1. 背景网格 (Grid) */}
      <div className="absolute inset-0 opacity-20" 
           style={{ 
             backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', 
             backgroundSize: '20px 20px' 
           }}>
      </div>

      {/* 2. 心电图波形 */}
      <svg viewBox="0 0 1000 50" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
         {/* 阴影层 (Glow) */}
         <path d={pathData} fill="none" stroke="#10b981" strokeWidth="2" strokeOpacity="0.3" className="blur-[2px]" />
         {/* 实体层 */}
         <path d={pathData} fill="none" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      </svg>
      
      {/* 3. 扫描线动画 (Scanline) */}
      <div className="absolute top-0 bottom-0 w-full animate-scan pointer-events-none bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent w-[20%]"></div>

      {/* 4. 装饰文字 */}
      <div className="absolute top-2 right-2 text-[9px] font-mono text-emerald-500/60 flex items-center gap-2">
         <span className="animate-pulse">● LIVE MONITOR</span>
         <span>24H SCALE</span>
      </div>
      <div className="absolute bottom-2 left-2 text-[9px] font-mono text-zinc-600">
         -24H
      </div>
      <div className="absolute bottom-2 right-2 text-[9px] font-mono text-zinc-600">
         NOW
      </div>
      
      {/* CSS 动画定义 */}
      <style jsx>{`
        @keyframes scan {
          0% { left: -20%; }
          100% { left: 100%; }
        }
        .animate-scan {
          animation: scan 4s linear infinite;
        }
      `}</style>
    </div>
  );
};