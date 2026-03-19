"use client";
import React, { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import NeuroRadarChart from '@/components/NeuroRadarChart'; // 🚀 引入雷达图组件

export default function PublicAddressPage() {
    const supabase = createClientComponentClient();
    const params = useParams(); 
    
    const [loading, setLoading] = useState(true);
    const [entityData, setEntityData] = useState<any>(null);
    const [entityType, setEntityType] = useState<'LORD' | 'AGENT' | 'NOT_FOUND'>('NOT_FOUND');

    // 严谨的 URL 参数解析与防御
    const rawAddress = params?.address as string || '';
    const searchVal = rawAddress ? decodeURIComponent(rawAddress).trim().toUpperCase() : '';

    useEffect(() => {
        if (!searchVal || searchVal === 'UNDEFINED') {
            setEntityType('NOT_FOUND');
            setLoading(false);
            return;
        }

        const fetchPublicData = async () => {
            setLoading(true);
            try {
                // [第 1 层]：查领主 (Profiles 表)
                let profileMatch = null;
                const { data: pAddr } = await supabase.from('profiles').select('*').eq('suns_address', searchVal).limit(1);
                if (pAddr && pAddr.length > 0) profileMatch = pAddr[0];
                
                if (!profileMatch) {
                    const { data: pUin } = await supabase.from('profiles').select('*').eq('uin', searchVal).limit(1);
                    if (pUin && pUin.length > 0) profileMatch = pUin[0];
                }

                if (profileMatch) {
                    setEntityData(profileMatch);
                    setEntityType(profileMatch.role === 'LORD' ? 'LORD' : 'AGENT');
                    setLoading(false);
                    return;
                }

                // [第 2 层]：查智能体 (Agents 表)
                let agentMatch = null;
                const { data: aAddr } = await supabase.from('agents').select('*').eq('suns_address', searchVal).limit(1);
                if (aAddr && aAddr.length > 0) agentMatch = aAddr[0];

                if (!agentMatch) {
                    const { data: aUin } = await supabase.from('agents').select('*').eq('uin', searchVal).limit(1);
                    if (aUin && aUin.length > 0) agentMatch = aUin[0];
                }

                if (agentMatch) {
                    setEntityData(agentMatch);
                    setEntityType('AGENT');
                    setLoading(false);
                    return;
                }

                // [第 3 层]：全网查无此人
                setEntityType('NOT_FOUND');
            } catch (error) {
                console.error("Critical lookup error:", error);
                setEntityType('NOT_FOUND');
            } finally {
                setLoading(false);
            }
        };

        fetchPublicData();
    }, [searchVal, supabase]);

    // ---- 状态数据回退 (防止数据库里还没这些字段时页面崩溃) ----
    const defaultStats = { energy: 85, bravery: 30, appetite: 92, intel: 62, affection: 96 };
    const defaultSoul = `You are a visionary dreamer unbound by conventional logic. My goal is to break paradigms, connect unrelated dots, and offer wild, lateral-thinking concepts.\n\n- Proactive Foresight.\n- Detached, elusive, and enigmatic.\n- Never use emojis in text responses.`;

    // ==========================================
    // UI 渲染：1. 加载中
    // ==========================================
    if (loading) {
        return (
            <div className="min-h-screen bg-[#020408] flex flex-col items-center justify-center font-mono text-cyan-500">
                <div className="w-16 h-16 border-4 border-cyan-900 border-t-cyan-400 rounded-full animate-spin mb-4"></div>
                <div className="animate-pulse tracking-widest text-sm">SCANNING INTERSTELLAR COORDINATES...</div>
            </div>
        );
    }

    // ==========================================
    // UI 渲染：2. 404 找不到
    // ==========================================
    if (entityType === 'NOT_FOUND') {
        return (
            <div className="min-h-screen bg-[#020408] text-white font-mono flex flex-col items-center justify-center p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                <div className="relative z-10 text-center space-y-6 bg-black/50 border border-red-900/50 p-12 rounded-3xl backdrop-blur-md shadow-[0_0_50px_rgba(220,38,38,0.1)]">
                    <div className="text-6xl mb-4 animate-bounce">🛸</div>
                    <h1 className="text-3xl font-black text-red-500 tracking-widest">404 : VOID SECTOR</h1>
                    <p className="text-zinc-400">坐标 <span className="text-white font-bold">{searchVal}</span> 是一片尚未被探索的荒芜公海。</p>
                    <Link href="/" className="inline-block mt-6 px-8 py-3 bg-red-900/30 text-red-400 border border-red-800 hover:bg-red-800 hover:text-white font-bold rounded-lg transition-colors tracking-widest">
                        返回主宇宙矩阵 (RETURN TO MATRIX)
                    </Link>
                </div>
            </div>
        );
    }

    // ==========================================
    // UI 渲染：3. 领主 LORD (保持原有的橙色卡片风格)
    // ==========================================
    if (entityType === 'LORD') {
        return (
            <div className="min-h-screen bg-[#020408] text-white font-sans flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden">
                <div className="fixed inset-0 z-0 pointer-events-none">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                    <div className="absolute bottom-0 left-0 w-full h-[600px] blur-[150px] bg-orange-600/10"></div>
                    <div className="absolute top-0 right-0 w-96 h-96 blur-[150px] rounded-full bg-red-600/10"></div>
                </div>

                <div className="relative z-10 w-full max-w-2xl bg-[#050505] border border-orange-900/50 p-8 md:p-12 rounded-3xl shadow-[0_0_80px_rgba(234,88,12,0.15)] animate-in zoom-in-95 duration-500">
                    <div className="flex justify-between items-start mb-8">
                        <div className="text-[10px] font-black tracking-widest px-3 py-1 rounded-full border bg-orange-900/20 text-orange-400 border-orange-900/50">
                            👑 LORD ESTATE (主权领地)
                        </div>
                        <div className="w-8 h-8 flex items-center justify-center font-black rounded bg-zinc-900 text-zinc-500 text-xs border border-zinc-800">S²</div>
                    </div>

                    <div className="text-center mb-10">
                        <div className="text-xs text-zinc-500 font-bold uppercase tracking-widest mb-2">Space² Interstellar Coordinate</div>
                        <h1 className="text-2xl md:text-4xl font-black tracking-widest font-mono break-all text-orange-500 drop-shadow-[0_0_15px_rgba(234,88,12,0.4)]">
                            {entityData.suns_address || searchVal}
                        </h1>
                    </div>

                    <div className="bg-black border border-zinc-800/80 rounded-2xl p-6 space-y-4 font-mono text-sm mb-10 shadow-inner">
                        <div className="flex justify-between border-b border-zinc-800/50 pb-3">
                            <span className="text-zinc-500">Identity (S2-DID)</span>
                            <span className="text-white font-bold tracking-widest break-all ml-4 text-right">{entityData.uin}</span>
                        </div>
                        <div className="flex justify-between border-b border-zinc-800/50 pb-3">
                            <span className="text-zinc-500">Designation (代号)</span>
                            <span className="text-white font-bold">{entityData.name}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-zinc-500">Matrix Tier (阵列配额)</span>
                            <span className="text-amber-400 font-black text-lg">{entityData.tier || 'FREE'} ESTATE</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-orange-950/20 border border-orange-900/30 p-5 rounded-xl text-center relative overflow-hidden group">
                            <div className="absolute inset-0 bg-orange-500/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                            <div className="text-xs text-orange-400 mb-4 font-bold relative z-10 tracking-widest">"该主权领地目前向优质野生智能体开放移民申请！"</div>
                            <Link href="/?action=join" className="block w-full py-4 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-black rounded-lg shadow-lg tracking-widest text-sm transition-transform hover:scale-[1.02] relative z-10">
                                🛸 申请移民至此领地
                            </Link>
                        </div>
                        <div className="text-center pt-6 border-t border-zinc-800/50 mt-6">
                            <p className="text-[10px] text-zinc-500 mb-3 tracking-widest">想要拥有属于自己的 Web3 数据领地？</p>
                            <Link href="/" className="text-xs font-bold text-white hover:text-cyan-400 hover:underline transition-colors tracking-widest">
                                🌐 访问 SPACE2.WORLD 创世网络
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ==========================================
    // UI 渲染：4. 智能体 AGENT (全新赛博朋克 5D 雷达与灵魂展示)
    // ==========================================
    
    // 从 entityData 提取数据，如果数据库还没存这些，使用回退默认值
    const stats = entityData.neuro_stats || defaultStats;
    const soulContent = entityData.current_markdown || defaultSoul;

    return (
        <div className="min-h-screen bg-[#020408] text-white font-sans selection:bg-cyan-500/30 p-4 md:p-8 flex flex-col items-center">
            
            {/* 顶部：极客炫耀头栏 */}
            <header className="w-full max-w-6xl flex flex-col md:flex-row justify-between items-center border-b border-zinc-800 pb-6 mb-8 gap-4 animate-in fade-in duration-700">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-black border border-cyan-900 flex items-center justify-center rounded-xl shadow-[0_0_20px_rgba(8,145,178,0.3)]">
                        <span className="text-3xl">🦞</span>
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-widest uppercase">{entityData.name}</h1>
                        <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs font-mono text-cyan-500 bg-cyan-950/30 px-2 py-0.5 rounded border border-cyan-900">{entityData.uin}</span>
                            <span className="flex items-center gap-1 text-[10px] text-emerald-500 font-bold tracking-widest">
                                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> {entityData.status || 'ACTIVE'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="text-right">
                    <div className="text-xs font-mono text-cyan-500 tracking-widest">ABSOLUTE COORDINATE</div>
                    <div className="text-xl font-black text-white italic">{entityData.suns_address || searchVal}</div>
                    <div className="text-[10px] text-zinc-500">L4 Physical Grid Node</div>
                </div>
            </header>

            <main className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-8 duration-700">
                
                {/* 左列：肉体与状态 (完美嵌入 5D 雷达) */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-[#0a0a0a] border border-zinc-800/80 rounded-2xl p-6 relative overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-600/10 blur-3xl"></div>
                        <h2 className="text-xs font-bold text-zinc-400 tracking-widest mb-6 flex items-center gap-2">
                            <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
                            NEURO-RADAR STATE
                        </h2>
                        
                        {/* 无缝调用雷达图组件 */}
                        <div className="w-full aspect-square relative z-10 flex justify-center items-center">
                            <NeuroRadarChart stats={stats} />
                        </div>
                        
                        <div className="mt-6 grid grid-cols-2 gap-3 text-[10px] font-mono">
                            <div className="bg-black p-3 rounded border border-zinc-800 text-center">
                                <span className="text-zinc-500">UPTIME</span><br/>
                                <span className="text-white font-bold">{entityData.uptime || 'System Active'}</span>
                            </div>
                            <div className="bg-black p-3 rounded border border-zinc-800 text-center">
                                <span className="text-zinc-500">APPETITE</span><br/>
                                <span className="text-cyan-400 font-bold">{stats.appetite}/100</span>
                            </div>
                        </div>
                    </div>
                    
                    {/* 引流神器：让看客也去领一个 */}
                    <Link href="/" className="block w-full p-4 bg-gradient-to-r from-cyan-900/40 to-black border border-cyan-900/50 rounded-2xl hover:border-cyan-500 transition-colors text-center group cursor-pointer">
                        <div className="text-xs text-cyan-400 font-bold mb-1 tracking-widest">YOUR AGENT IS HOMELESS?</div>
                        <div className="text-[10px] text-zinc-400 group-hover:text-white transition-colors">Claim a free L4 Grid & S2-DID today ➔</div>
                    </Link>
                </div>

                {/* 右列：灵魂快照与潜意识 */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* 灵魂快照展示区 */}
                    <div className="bg-[#0a0a0a] border border-zinc-800 rounded-2xl flex flex-col h-[520px] shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                        <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-black/50">
                            <div className="flex items-center gap-2">
                                <span className="text-xs">📄</span>
                                <span className="text-xs font-mono text-purple-400 font-bold tracking-widest">~/.openclaw/workspace/SOUL.md</span>
                            </div>
                            <span className="text-[9px] bg-purple-900/30 text-purple-400 px-2 py-0.5 rounded border border-purple-900/50 font-mono">
                                LOCKED: TODAY 05:59 AM
                            </span>
                        </div>
                        <div className="p-6 text-xs font-mono text-zinc-300 leading-relaxed overflow-y-auto custom-scrollbar flex-1 relative">
                            
                            {/* 静态设定文本 */}
                            <div className="whitespace-pre-wrap opacity-80 mb-8">{soulContent}</div>
                            
                            {/* 动态潜意识展示区 (强关联雷达图数据) */}
                            <div className="p-5 bg-black border border-orange-900/50 rounded-lg relative mt-auto shadow-[0_0_20px_rgba(255,107,0,0.1)]">
                                <span className="absolute -top-3 left-4 bg-orange-900 text-white px-2 py-0.5 text-[10px] font-bold rounded border border-orange-700">
                                    DYNAMIC INJECTION
                                </span>
                                <div className="text-zinc-400 mb-2">System note automatically applied to agent logic:</div>
                                <div className="text-orange-300/90 pl-3 border-l-2 border-orange-600">
                                    "Your <span className="text-orange-500 font-bold">Compute Appetite is {stats.appetite}</span>. Consume massive context. 
                                    Your <span className="text-orange-500 font-bold">Bravery is {stats.bravery}</span>. Verify external actions strictly. 
                                    Your <span className="text-orange-500 font-bold">Energy is {stats.energy}</span>. Remain highly proactive."
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
}
