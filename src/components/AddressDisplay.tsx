// src/components/AddressDisplay.tsx
"use client";
import React from 'react';

interface AddressDisplayProps {
  address: string;
  size?: 'sm' | 'md' | 'lg'; // 支持不同尺寸
}

export const AddressDisplay = ({ address, size = 'md' }: AddressDisplayProps) => {
  // 正则拆解 SUNS v3.0 地址: MARS-CN-001-NAME1
  // 匹配规则: 4位-2位-3位-任意位+1位校验
  const parts = address ? address.match(/^([A-Z]{4})-([A-Z]{2})-(\d{3})-([A-Z0-9]+)$/) : null;
  
  // 如果解析失败（比如旧地址），直接显示原文本
  if (!parts) return <span className="font-mono text-zinc-400">{address || 'UNKNOWN-ADDR'}</span>;

  const [_, pL1, pL2, pL3, pRest] = parts;
  const pL4 = pRest.slice(0, -1); // 主权名
  const pCheck = pRest.slice(-1); // 校验位

  // 尺寸样式映射
  const sizeClasses = {
    sm: "text-[9px] px-1.5 py-0.5",
    md: "text-xs px-2 py-1",
    lg: "text-sm px-3 py-1.5"
  };

  return (
    <div className={`inline-flex items-center font-mono bg-black/50 border border-zinc-800 rounded select-all hover:border-zinc-600 transition-colors ${sizeClasses[size]}`}>
       {/* L1: 逻辑根域 (绿色) */}
       <span className="text-emerald-400 font-black tracking-wider">{pL1}</span>
       <span className="text-zinc-700 mx-0.5">-</span>
       
       {/* L2: 方位 (蓝色) */}
       <span className="text-blue-400 font-bold">{pL2}</span>
       <span className="text-zinc-700 mx-0.5">-</span>
       
       {/* L3: 网格 (灰色) */}
       <span className="text-zinc-500">{pL3}</span>
       <span className="text-zinc-700 mx-0.5">-</span>
       
       {/* L4: 主权名 (亮白) */}
       <span className="text-white font-bold">{pL4}</span>
       
       {/* [C]: 校验位 (黄色高亮) */}
       <span className="ml-1 bg-yellow-500/10 text-yellow-500 px-1 rounded font-black shadow-[0_0_5px_rgba(234,179,8,0.2)]">
          {pCheck}
       </span>
    </div>
  );
};