"use client";
import React from 'react';

interface RoomInteriorProps {
  styleId: string;       
  status?: string;       
  intensity?: number;    
}

export const RoomInterior = ({ styleId, status = 'IDLE', intensity = 0.8 }: RoomInteriorProps) => {
  
  // 状态指示色 (仅用于微弱的背景倾向，不再做高亮)
  const getBgColor = () => {
    switch (status) {
      case 'BUSY': return '#1a0505'; // 极暗红
      case 'IDLE': return '#020617'; // 极暗蓝/黑 (默认)
      case 'VISITING': return '#050b1a'; // 极暗蓝
      default: return '#000000'; // 纯黑
    }
  };

  const getBorderColor = () => {
    switch (status) {
      case 'BUSY': return '#450a0a'; 
      case 'IDLE': return '#1e293b'; 
      case 'VISITING': return '#172554'; 
      default: return '#18181b'; 
    }
  };

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
      <svg viewBox="0 0 200 200" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
        {/* 1. 纯黑底色 (带极微弱的状态倾向) */}
        <rect x="0" y="0" width="200" height="200" fill={getBgColor()} />
        
        {/* 2. 极简边框 (标识区域) */}
        <rect x="0" y="0" width="200" height="200" fill="none" stroke={getBorderColor()} strokeWidth="1" />

        {/* 3. 没有任何家具代码 */}
      </svg>
    </div>
  );
};