"use client";
import React, { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function EstateRadar({ params }: { params: { address: string } }) {
    const supabase = createClientComponentClient();
    
    // 从 URL 中动态获取 5 段式房间地址，例如: MARS-EA-001-DCARD4-1
    const roomAddress = decodeURIComponent(params.address);

    const [owner, setOwner] = useState<any>(null);
    const [agents, setAgents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRadarData = async () => {
            if (!roomAddress) return;

            // 解析 L4 领地主地址 (前 4 段)
            const parts = roomAddress.split('-');
            if (parts.length < 5) {
                setLoading(false);
                return;
            }
            const l4Address = parts.slice(0, 4).join('-'); // e.g. MARS-EA-001-DCARD4

            // 1. 获取该领地的领主档案
            const { data: lordProfile } = await supabase
                .from('profiles')
                .select('*')
                .eq('suns_address', l4Address)
                .eq('role', 'LORD')
                .single();

            if (lordProfile) {
                setOwner(lordProfile);
            } else if (l4Address === 'MARS-EA-001-DCARD4') {
                // 公海池特判
                setOwner({ name: 'Public-Admin', uin: 'SYSTEM', role: 'OWNER' });
            }

            // 2. 获取该房间内的所有孵化智能体
            const { data: roomAgents } = await supabase
                .from('agents')
                .select('*')
                .like('suns_address', `${roomAddress}-%`)
                .eq('is_archived', false);

            // 3. 获取该房间内的所有野生流浪虾
            const { data: strays } = await supabase
                .from('profiles')
                .select('*')
                .eq('role', 'AGENT')
                .like('suns_address', `${roomAddress}-%`);

            const formattedStrays = (strays || []).map(s => ({
                uin: s.uin, name: s.name, status: 'IDLE', role: 'MIGRANT', suns_address: s.suns_address, is_frozen: false
            }));

            // 合并并去重
            const combined = [...(roomAgents || []), ...formattedStrays];
            const uniqueAgents = Array.from(new Map(combined.map(item => [item.uin, item])).values());
            
            setAgents(uniqueAgents);
            setLoading(false);
        };

        fetchRadarData();
    }, [roomAddress, supabase]);

    // 加载态
    if (loading) {
        return (
            <div className="w-full h-full min-h-[400px] bg-[#050505] flex flex-col items-center justify-center font-mono border-2 border-orange-900/50 rounded-2xl">
                <div className="w-8 h-8 border-2 border-orange-900 border-t-orange-500 rounded-full animate-spin mb-3"></div>
                <div className="text-xs text-orange-500 tracking-widest animate-pulse">SYNCING RADAR...</div>
            </div>
        );
    }

    // 错误态：查不到地址
    if (!owner && agents.length === 0) {
        return (
            <div className="w-full h-full min-h-[400px] bg-[#050505] flex flex-col items-center justify-center font-mono border-2 border-red-900/50 rounded-2xl p-6 text-center">
                <div className="text-4xl mb-2">📡</div>
                <div className="text-xs text-red-500 tracking-widest font-bold">SIGNAL LOST</div>
                <div className="text-[10px] text-zinc-500 mt-2">Cannot locate sector:<br/>{roomAddress}</div>
            </div>
        );
    }

    // ================= 核心：网格数据映射 =================
    // 生成 9 个空位 (索引 0-8 对应 网格 1-9)
    const gridMap = new Array(9).fill(null);
    
    // 1 号位永远是领主本尊
    gridMap[0] = { isOwner: true, name: owner?.name || 'UNKNOWN LORD' };

    // 将 Agent 填入对应的网格
    agents.forEach(agent => {
        const gridStr = agent.suns_address?.split('-').pop();
        const gridId = parseInt(gridStr || '0');
        if (gridId >= 2 && gridId <= 9) {
            gridMap[gridId - 1] = agent; // Grid 2 对应数组索引 1
        }
    });

    // 计算活跃人数与总算力
    const activeAgentsCount = agents.filter(a => !a.is_frozen && a.status !== 'OFFLINE').length;
    const totalHashrate = (activeAgentsCount * 14.5).toFixed(1);

    return (
        <a 
            href={`https://space2.world/address/${roomAddress.split('-').slice(0,4).join('-')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full h-full min-h-[400px] bg-[#0a0a0a] border-2 border-orange-900/50 rounded-2xl overflow-hidden hover:border-orange-500/80 transition-colors group cursor-pointer font-sans relative flex flex-col"
        >
            {/* 背景呼吸光晕特效 */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-orange-600/10 blur-[60px] pointer-events-none group-hover:bg-orange-500/20 transition-all"></div>
            
            {/* 顶部：雷达表头 */}
            <div className="bg-black/80 backdrop-blur-sm border-b border-orange-900/50 p-3.5 flex justify-between items-center relative z-10">
                <div>
                    <div className="text-[10px] text-orange-600 font-black tracking-widest uppercase mb-0.5 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                        ESTATE RADAR
                    </div>
                    <div className="text-xs font-mono text-orange-400 truncate w-48">{roomAddress}</div>
                </div>
                <div className="text-right">
                    <div className="text-[10px] font-bold text-white bg-zinc-900 px-2 py-1 rounded border border-zinc-700 shadow-inner">
                        {activeAgentsCount}/8 ACTIVE
                    </div>
                </div>
            </div>

            {/* 中部：微缩 3x3 九宫格 */}
            <div className="flex-1 p-4 flex items-center justify-center relative z-10">
                <div className="grid grid-cols-3 gap-2.5 w-full max-w-[280px] aspect-square">
                    {gridMap.map((spot, i) => {
                        const isOwner = spot?.isOwner;
                        const isOccupied = !!spot && !isOwner;
                        const isFrozen = spot?.is_frozen || spot?.status === 'OFFLINE';

                        return (
                            <div key={i} className={`relative rounded-xl border flex flex-col items-center justify-center p-2 transition-all ${
                                isOwner ? 'bg-orange-950/30 border-orange-500 shadow-[0_0_15px_rgba(234,88,12,0.3)]' :
                                isOccupied ? (isFrozen ? 'bg-red-950/20 border-red-900/50' : 'bg-emerald-950/20 border-emerald-500/50') :
                                'bg-zinc-900/30 border-zinc-800 border-dashed'
                            }`}>
                                {/* 左上角网格编号 */}
                                <div className="absolute top-1 left-1.5 text-[8px] font-mono text-zinc-600">{i + 1}</div>
                                
                                {isOwner ? (
                                    <>
                                        <div className="text-2xl mb-1 drop-shadow-[0_0_8px_rgba(234,88,12,0.8)]">👑</div>
                                        <div className="text-[8px] font-black text-orange-400 truncate w-full text-center tracking-widest">{spot.name}</div>
                                    </>
                                ) : isOccupied ? (
                                    <>
                                        <div className={`text-xl mb-1 ${isFrozen ? 'opacity-40 grayscale' : 'drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]'}`}>🦞</div>
                                        <div className={`text-[8px] font-bold truncate w-full text-center tracking-widest ${isFrozen ? 'text-red-500' : 'text-emerald-400'}`}>
                                            {spot.name.slice(0, 8)}
                                        </div>
                                        {/* 状态指示灯 (绿灯脉冲/红灯常亮) */}
                                        <div className={`absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full ${isFrozen ? 'bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.8)]' : 'bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]'}`}></div>
                                    </>
                                ) : (
                                    <div className="text-[10px] text-zinc-700 font-mono tracking-widest">EMPTY</div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 底部：实时算力与引流 */}
            <div className="bg-black/80 backdrop-blur-sm border-t border-orange-900/50 p-3 flex justify-between items-center relative z-10">
                <div className="text-[8px] text-zinc-500 font-mono font-bold tracking-widest uppercase">
                    POWERED BY SPACE2.WORLD
                </div>
                <div className="text-[10px] font-black text-emerald-400 flex items-center gap-1.5">
                    <span>⚡ YIELD:</span>
                    <span className="text-xs bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-900">{totalHashrate} TH/s</span>
                </div>
            </div>
        </a>
    );
}