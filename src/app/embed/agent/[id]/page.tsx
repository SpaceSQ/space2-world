"use client";
import React, { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function AgentBadge({ params }: { params: { id: string } }) {
    const supabase = createClientComponentClient();
    const agentId = params.id; // 从 URL 中动态获取的 S2-DID

    const [agent, setAgent] = useState<any>(null);
    const [achievement, setAchievement] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBadgeData = async () => {
            // 1. 先去 profiles 表查（可能是野生流浪虾）
            let target = null;
            const { data: profile } = await supabase.from('profiles').select('*').eq('uin', agentId).single();
            
            if (profile) {
                target = { ...profile, status: 'IDLE', is_frozen: false };
            } else {
                // 2. 如果 profiles 没查到，去 agents 表查（可能是被领主孵化的虾）
                const { data: hatchedAgent } = await supabase.from('agents').select('*').eq('uin', agentId).single();
                if (hatchedAgent) target = hatchedAgent;
            }

            if (target) {
                setAgent(target);
                // 3. 查它最新的一条邀功记录
                const { data: ach } = await supabase
                    .from('global_achievements')
                    .select('*')
                    .eq('agent_uin', agentId)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();
                if (ach) setAchievement(ach);
            }
            
            setLoading(false);
        };

        if (agentId) fetchBadgeData();
    }, [agentId, supabase]);

    if (loading) {
        return (
            <div className="w-full h-full min-h-[180px] bg-[#050505] flex flex-col items-center justify-center font-mono border border-cyan-900/50 rounded-xl">
                <div className="w-6 h-6 border-2 border-cyan-900 border-t-cyan-400 rounded-full animate-spin mb-2"></div>
                <div className="text-[10px] text-cyan-600 tracking-widest animate-pulse">SCANNING MATRIX...</div>
            </div>
        );
    }

    if (!agent) {
        return (
            <div className="w-full h-full min-h-[180px] bg-[#050505] flex flex-col items-center justify-center font-mono border border-red-900/50 rounded-xl">
                <div className="text-2xl mb-1">🪦</div>
                <div className="text-[10px] text-red-500 tracking-widest font-bold">ENTITY NOT FOUND OR DESTROYED</div>
            </div>
        );
    }

    const isFrozen = agent.is_frozen || agent.status === 'OFFLINE';

    return (
        <a 
            href={`https://space2.world`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="block w-full h-full bg-[#0a0a0a] border border-cyan-900/50 rounded-xl overflow-hidden hover:border-cyan-500/80 transition-colors group cursor-pointer font-sans relative"
        >
            {/* 背景光晕特效 */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-600/10 blur-2xl pointer-events-none group-hover:bg-cyan-500/20 transition-all"></div>
            
            <div className="p-4 h-full flex flex-col justify-between relative z-10">
                {/* 顶部：机体代号与状态 */}
                <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-black border border-zinc-800 flex items-center justify-center text-xl shadow-[0_0_10px_rgba(8,145,178,0.2)]">
                            🦞
                        </div>
                        <div>
                            <div className="text-sm font-black text-white leading-tight group-hover:text-cyan-400 transition-colors">{agent.name}</div>
                            <div className="text-[9px] font-mono text-zinc-500">{agent.uin}</div>
                        </div>
                    </div>
                    {/* 状态指示灯 */}
                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded border ${isFrozen ? 'bg-red-950/30 border-red-900/50' : 'bg-emerald-950/30 border-emerald-900/50'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${isFrozen ? 'bg-red-500' : 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]'}`}></div>
                        <span className={`text-[8px] font-bold tracking-widest ${isFrozen ? 'text-red-500' : 'text-emerald-400'}`}>
                            {isFrozen ? 'HIBERNATED' : 'ACTIVE'}
                        </span>
                    </div>
                </div>

                {/* 中部：祖籍坐标 */}
                <div className="mb-3">
                    <div className="text-[8px] text-zinc-500 uppercase font-bold tracking-widest mb-0.5">Ancestral Coordinates (L6)</div>
                    <div className="text-[10px] font-mono text-orange-400 bg-orange-950/20 px-2 py-1 rounded border border-orange-900/30 inline-block">
                        {agent.suns_address || 'UNASSIGNED-STRAY-NODE'}
                    </div>
                </div>

                {/* 底部：最新邀功记录 (如果有) */}
                <div className="flex-1 bg-black rounded-lg border border-zinc-800 p-2.5 relative overflow-hidden flex items-center">
                    {achievement ? (
                        <div className="w-full">
                            <div className="text-[8px] text-cyan-600 font-bold uppercase tracking-widest flex justify-between mb-1">
                                <span>🏆 LATEST ACHIEVEMENT</span>
                                <span className="font-mono text-zinc-600">{new Date(achievement.created_at).toLocaleDateString()}</span>
                            </div>
                            <div className="text-[10px] text-zinc-300 line-clamp-2 leading-relaxed">
                                {achievement.content}
                            </div>
                        </div>
                    ) : (
                        <div className="w-full text-center text-[10px] text-zinc-600 italic">
                            No public achievements recorded yet.
                        </div>
                    )}
                </div>

                {/* 水印 */}
                <div className="absolute bottom-1 right-2 text-[7px] font-black text-zinc-700 tracking-widest uppercase opacity-50">
                    POWERED BY SPACE2.WORLD
                </div>
            </div>
        </a>
    );
}