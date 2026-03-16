"use client";
import React from 'react';
import { AgentAvatar } from '@/components/AgentAvatar';

// 接收父组件传来的真实数据
interface TerminalProps {
  realStatus: string;   // 从数据库读来的状态 (WORKING / IDLE / OFFLINE)
  realTask: string;     // 当前任务描述
  latestLog: string;    // 最新的一条日志
  tempData?: { temp: number, condition: string }; // 真实天气数据(可选)
}

export const LaundryAgentTerminal = ({ realStatus, realTask, latestLog, tempData }: TerminalProps) => {
  // 判断是否活跃 (WORKING 或 IDLE 都算在线，只有 OFFLINE 算离线)
  const isOnline = realStatus !== 'OFFLINE';
  const isWorking = realStatus === 'WORKING';

  // 视觉颜色映射
  const statusColors: any = {
    OFFLINE: 'text-zinc-600 bg-zinc-900 border-zinc-700',
    IDLE: 'text-emerald-500 bg-emerald-900/10 border-emerald-500/30',
    WORKING: 'text-yellow-400 bg-yellow-900/10 border-yellow-500/30 animate-pulse',
  };

  return (
    <div className="w-full bg-black/80 border border-zinc-800 rounded-2xl overflow-hidden backdrop-blur-md shadow-2xl flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/50">
        <div className="flex items-center gap-3">
          <div className="relative">
             {/* 这里的 Seed 固定为 19 (对应 V-WASH-001) */}
             <AgentAvatar seed={19} size={40} emotion={isWorking ? 'HAPPY' : 'NEUTRAL'} /> 
             {isOnline && <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-black ${isWorking ? 'bg-yellow-500 animate-bounce' : 'bg-emerald-500'}`}></div>}
          </div>
          <div>
            <h3 className="text-xs font-black text-white">V-WASH-001 MONITOR</h3>
            <div className="flex items-center gap-2 text-[9px] font-mono">
              <span className="text-zinc-500">REAL-TIME LINK</span>
              <span className={`px-1.5 rounded border ${statusColors[realStatus] || statusColors.OFFLINE}`}>
                {realStatus}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Screen */}
      <div className="p-4 flex-1 flex flex-col gap-4">
        
        {/* 天气/状态显示区 */}
        <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800 flex items-center justify-center relative overflow-hidden min-h-[80px]">
           {!isOnline ? (
              <div className="text-zinc-600 text-xs font-mono">SIGNAL LOST / SLEEPING</div>
           ) : (
              <div className="text-center z-10">
                 {/* 如果有天气数据就显示，没有就显示任务 */}
                 {tempData ? (
                   <div className="text-2xl font-black text-white mb-1">
                      {tempData.temp}°C 
                      <span className={`ml-2 text-xs px-2 py-0.5 rounded text-black font-bold ${tempData.condition === 'SUNNY' ? 'bg-yellow-400' : 'bg-blue-400'}`}>
                        {tempData.condition}
                      </span>
                   </div>
                 ) : (
                   <div className="text-lg font-black text-white mb-1 animate-pulse">
                     {isWorking ? "WASHING CYCLE ACTIVE" : "ENVIRONMENT SCANNING"}
                   </div>
                 )}
                 <div className="text-[9px] text-zinc-500 uppercase tracking-widest">{realTask || "Standby"}</div>
              </div>
           )}
           {/* 背景特效 */}
           {isWorking && <div className="absolute -top-10 -right-10 w-32 h-32 bg-yellow-500/10 blur-3xl rounded-full"></div>}
           {isOnline && !isWorking && <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full"></div>}
        </div>

        {/* 底部最新日志 */}
        <div className="bg-black rounded-lg p-3 border border-zinc-800 font-mono text-[9px] text-zinc-400 truncate">
           <span className="text-emerald-500 mr-2">&gt;</span>
           {latestLog || "Waiting for data packet..."}
        </div>
      </div>
    </div>
  );
};