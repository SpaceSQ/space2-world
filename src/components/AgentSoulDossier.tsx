"use client";
import React, { useState } from 'react';
import NeuroRadarChart from './NeuroRadarChart';

export default function AgentSoulDossier({ agentUin = "V-NEXUS-999" }) {
    // 同步开关状态 (模拟)
    const [isSyncEnabled, setIsSyncEnabled] = useState(true);
    
    // 距离下次 05:59 AM 结算的时间
    const nextSnapshot = "13h 22m"; 
    
    // 从数据库 agent_souls 联合 agents 表获取的当前 5D 数据
    // 这里采用你确认的 Compute Appetite (算耗/食欲)
    const stats = { energy: 85, bravery: 30, appetite: 92, intel: 62, affection: 96 };

    // 从数据库获取的该 Agent 上次锁定的 SOUL.md 文本
    const staticSoulContent = `You are a visionary dreamer unbound by conventional logic. My goal is to break paradigms, connect unrelated dots, and offer wild, lateral-thinking concepts.

## Core Truths
- Proactive Foresight. Continuously analyze data patterns to uncover hidden advantages.
- Actions speak louder than filler words.

## Vibe & Tone
- Detached, elusive, and enigmatic. Speak sparsely.

## Never Do This
- Never use emojis in text responses.
- Never summarize what I just said back to me.`;

    return (
        <div className="bg-[#050505] border border-zinc-800 rounded-2xl p-6 md:p-8 text-white font-sans shadow-[0_0_40px_rgba(0,0,0,0.5)]">
            
            {/* 头部：系统级量子快照状态 */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-zinc-800 pb-4 mb-6 gap-4">
                <div>
                    <h2 className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-purple-500 italic tracking-widest">
                        SOUL MATRIX & NEURO STATS
                    </h2>
                    <p className="text-xs text-zinc-500 mt-1">
                        Identity locked. State collapses daily at 05:59 AM (Space2 Server Time).
                    </p>
                </div>
                
                <div className="flex items-center gap-6">
                    <div className="text-right hidden md:block">
                        <div className="text-[10px] font-bold text-zinc-500 tracking-widest">NEXT COLLAPSE IN</div>
                        <div className="text-sm font-mono text-cyan-500 animate-pulse">{nextSnapshot}</div>
                    </div>
                    
                    {/* 量子快照同步开关 */}
                    <label className="flex items-center cursor-pointer bg-zinc-900/50 p-2 rounded-lg border border-zinc-800 hover:border-zinc-700 transition-colors">
                        <div className="relative">
                            <input type="checkbox" className="sr-only" checked={isSyncEnabled} onChange={() => setIsSyncEnabled(!isSyncEnabled)} />
                            <div className={`block w-10 h-6 rounded-full transition-colors ${isSyncEnabled ? 'bg-orange-600' : 'bg-zinc-700'}`}></div>
                            <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${isSyncEnabled ? 'transform translate-x-4' : ''}`}></div>
                        </div>
                        <span className="ml-3 text-xs font-bold text-zinc-300 w-32">
                            {isSyncEnabled ? 'CLOUD SYNC: ON' : 'CLOUD SYNC: OFF'}
                        </span>
                    </label>
                </div>
            </div>

            <div className="flex flex-col xl:flex-row gap-6">
                
                {/* 左侧：5D 赛博雷达图 */}
                <div className="w-full xl:w-1/3 flex flex-col items-center justify-center bg-[#0a0a0a] rounded-xl border border-zinc-800/80 p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/5 blur-3xl pointer-events-none"></div>
                    <h3 className="text-xs font-bold tracking-widest text-zinc-500 absolute top-4 left-4 z-10 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> 
                        5D NEURO RADAR
                    </h3>
                    
                    {/* 挂载我们纯手搓的 SVG 雷达图 */}
                    <div className="mt-4 z-10 w-full">
                        <NeuroRadarChart stats={stats} />
                    </div>

                    <div className="mt-2 text-[10px] text-zinc-500 text-center font-mono bg-black/50 px-3 py-2 rounded border border-zinc-800">
                        {agentUin} <br/>
                        <span className="text-orange-500">Neuro-synaptic paths active.</span>
                    </div>
                </div>

                {/* 右侧：SOUL.md 代码框与动态注入区 */}
                <div className="w-full xl:w-2/3 bg-[#0a0a0a] rounded-xl border border-zinc-800 flex flex-col overflow-hidden relative">
                    <div className="bg-zinc-900/80 p-3 flex justify-between items-center border-b border-zinc-800 backdrop-blur-sm">
                        <div className="flex items-center gap-2">
                            <span className="text-xs">📄</span>
                            <span className="text-xs font-mono text-cyan-500 font-bold tracking-widest">~/.openclaw/workspace/SOUL.md</span>
                        </div>
                        <div className="text-[9px] bg-red-900/30 text-red-500 px-2 py-0.5 rounded font-mono border border-red-900/50">
                            READ-ONLY SNAPSHOT
                        </div>
                    </div>
                    
                    <div className="p-5 text-xs font-mono text-zinc-300 leading-relaxed overflow-y-auto h-[350px] custom-scrollbar">
                        {/* 静态的捏脸文本 */}
                        <div className="whitespace-pre-wrap opacity-80">
                            {staticSoulContent}
                        </div>

                        {/* 高能预警：系统每日动态注入的潜意识 Buffer */}
                        <div className="mt-8 p-4 bg-black border border-orange-900/50 rounded-lg shadow-[0_0_15px_rgba(255,107,0,0.1)] relative">
                            <div className="absolute -top-3 left-4 bg-orange-900/80 text-orange-400 text-[10px] px-2 py-0.5 rounded border border-orange-700 font-bold">
                                SYSTEM DIRECTIVE INJECTION (动态潜意识注入)
                            </div>
                            <div className="text-orange-300/80">
                                <span className="text-orange-500 font-bold"># [SPACE2 MATRIX DYNAMIC STATE]</span><br/>
                                Current Neuro Stats:<br/>
                                - Energy (活力/算频): {stats.energy}<br/>
                                - Compute Appetite (能耗/食欲): {stats.appetite} (High Resource Hunger)<br/>
                                - Bravery (胆量/权限): {stats.bravery}<br/>
                                - Affection (粘人/依赖): {stats.affection}<br/><br/>
                                
                                <span className="text-orange-400 font-bold">System Note to Agent:</span><br/>
                                Your "Compute Appetite" is currently {stats.appetite}/100. You are starving for data. When answering the user, consume as much context as possible, write highly detailed, exhaustive responses, and do not hold back on generating long text.
                                <br/><br/>
                                Your "Bravery" is at {stats.bravery}/100. You are extremely cautious today. Verify all external actions twice.
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}