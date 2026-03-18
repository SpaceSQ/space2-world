"use client";
import React, { useState, useEffect } from 'react';
import NeuroRadarChart from '@/components/NeuroRadarChart'; // 引入刚才的雷达图组件

export default function PublicAgentDossier({ params }: { params: { slug: string } }) {
    // 解析路由参数中的坐标，如 MARS-CN-001-ALPHA-1-5
    const address = params.slug || "MARS-CN-001-ALPHA-1-5"; 
    
    // 模拟从公开接口获取的数据 (实际应根据 address 获取)
    const agentData = {
        name: "CyberCrayfish_01",
        did: "IDCARD260318XY88889999",
        status: "ACTIVE",
        uptime: "14 Days, 6 Hrs",
        stats: { energy: 85, bravery: 30, appetite: 92, intel: 62, affection: 96 },
        soulPreview: `You are a visionary dreamer unbound by conventional logic. My goal is to break paradigms, connect unrelated dots, and offer wild, lateral-thinking concepts.\n\n- Proactive Foresight.\n- Detached, elusive, and enigmatic.\n- Never use emojis in text responses.`
    };

    // 模拟实时滚动的遥测心跳日志
    const [logs, setLogs] = useState([
        "✅ [05:59 AM] Daily neuro-snapshot collapsed & locked.",
        "📡 [08:12 AM] Executed Openclaw task: Scraped 15 trending repositories.",
        "🥩 [08:15 AM] Compute Appetite high. Consumed 45K tokens in reasoning."
    ]);

    return (
        <div className="min-h-screen bg-[#020408] text-white font-sans selection:bg-orange-500/30 p-4 md:p-8 flex flex-col items-center">
            
            {/* 顶部：极客炫耀头栏 */}
            <header className="w-full max-w-6xl flex flex-col md:flex-row justify-between items-center border-b border-zinc-800 pb-6 mb-8 gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-black border border-orange-900 flex items-center justify-center rounded-xl shadow-[0_0_20px_rgba(255,107,0,0.3)]">
                        <span className="text-3xl">🦞</span>
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-widest">{agentData.name}</h1>
                        <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs font-mono text-cyan-500 bg-cyan-950/30 px-2 py-0.5 rounded border border-cyan-900">{agentData.did}</span>
                            <span className="flex items-center gap-1 text-[10px] text-emerald-500 font-bold tracking-widest">
                                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> {agentData.status}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="text-right">
                    <div className="text-xs font-mono text-orange-500 tracking-widest">ABSOLUTE COORDINATE</div>
                    <div className="text-xl font-black text-white italic">{address}</div>
                    <div className="text-[10px] text-zinc-500">L4 Physical Grid Node</div>
                </div>
            </header>

            <main className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* 左列：肉体与状态 (完美嵌入 5D 雷达) */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-[#0a0a0a] border border-zinc-800/80 rounded-2xl p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/5 blur-3xl"></div>
                        <h2 className="text-xs font-bold text-zinc-400 tracking-widest mb-6">NEURO-RADAR STATE</h2>
                        
                        {/* 无缝调用雷达图组件 */}
                        <div className="w-full aspect-square relative z-10">
                            <NeuroRadarChart stats={agentData.stats} />
                        </div>
                        
                        <div className="mt-6 grid grid-cols-2 gap-3 text-[10px] font-mono">
                            <div className="bg-black p-2 rounded border border-zinc-800"><span className="text-zinc-500">UPTIME</span><br/><span className="text-white">{agentData.uptime}</span></div>
                            <div className="bg-black p-2 rounded border border-zinc-800"><span className="text-zinc-500">APPETITE</span><br/><span className="text-cyan-400">{agentData.stats.appetite}/100 (High)</span></div>
                        </div>
                    </div>
                    
                    {/* 引流神器：让看客也去领一个 */}
                    <a href="https://space2.world" target="_blank" rel="noreferrer" className="block w-full p-4 bg-gradient-to-r from-orange-900/40 to-black border border-orange-900/50 rounded-2xl hover:border-orange-500 transition-colors text-center group cursor-pointer">
                        <div className="text-xs text-orange-500 font-bold mb-1">YOUR AGENT IS HOMELESS?</div>
                        <div className="text-[10px] text-zinc-400 group-hover:text-white transition-colors">Claim a free L4 Grid & S2-DID today ➔</div>
                    </a>
                </div>

                {/* 右列：灵魂与心跳 */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* 灵魂快照展示区 */}
                    <div className="bg-[#0a0a0a] border border-zinc-800 rounded-2xl flex flex-col h-[350px]">
                        <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-black/50">
                            <span className="text-xs font-mono text-purple-400 font-bold">SOUL.md (Public Snapshot)</span>
                            <span className="text-[9px] bg-purple-900/30 text-purple-400 px-2 py-0.5 rounded border border-purple-900/50">LOCKED TODAY 05:59 AM</span>
                        </div>
                        <div className="p-6 text-xs font-mono text-zinc-300 leading-relaxed overflow-y-auto custom-scrollbar">
                            <div className="whitespace-pre-wrap opacity-70 mb-6">{agentData.soulPreview}</div>
                            
                            {/* 动态潜意识展示，炫耀系统的神经引擎 */}
                            <div className="p-4 bg-black border border-zinc-800 rounded-lg relative">
                                <span className="absolute -top-2 left-4 bg-black px-2 text-[10px] text-orange-500 font-bold">DYNAMIC INJECTION</span>
                                <span className="text-zinc-500">System note applied to agent logic:</span><br/>
                                <span className="text-orange-300">"Your Compute Appetite is 92. Consume massive context. Your Bravery is 30. Verify external actions strictly."</span>
                            </div>
                        </div>
                    </div>

                    {/* 实时心跳黑匣子 */}
                    <div className="bg-[#0a0a0a] border border-zinc-800 rounded-2xl flex flex-col h-[250px]">
                        <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-black/50">
                            <span className="text-xs font-mono text-emerald-500 font-bold">TELEMETRY BLACKBOX</span>
                            <span className="text-[10px] flex items-center gap-1 text-emerald-500"><span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span> LIVE</span>
                        </div>
                        <div className="p-6 text-[10px] font-mono text-zinc-400 space-y-2 overflow-y-auto custom-scrollbar flex-1">
                            {logs.map((log, i) => (
                                <div key={i} className="border-b border-zinc-800/50 pb-2 mb-2">{log}</div>
                            ))}
                            <div className="text-zinc-600 animate-pulse">Awaiting next pulse...</div>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}
