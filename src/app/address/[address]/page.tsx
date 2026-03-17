"use client";
import React, { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import { useParams } from 'next/navigation'; // 🚀 关键修复：引入官方路由 Hook

export default function PublicAddressPage() { // 🚀 修复点：移除了 props 中的 params
    const supabase = createClientComponentClient();
    const params = useParams(); // 🚀 修复点：使用官方 Hook 安全抓取网址参数
    
    const [loading, setLoading] = useState(true);
    const [entityData, setEntityData] = useState<any>(null);
    const [entityType, setEntityType] = useState<'LORD' | 'AGENT' | 'NOT_FOUND'>('NOT_FOUND');

    // 🚀 修复点：极其严谨的 URL 参数解析与防御
    const rawAddress = params?.address as string || '';
    const searchVal = rawAddress ? decodeURIComponent(rawAddress).trim().toUpperCase() : '';

    useEffect(() => {
        // 如果抓取到的参数本身就是空的，或者有前端传了字面量的 "UNDEFINED" (说明点击的链接坏了)
        if (!searchVal || searchVal === 'UNDEFINED') {
            setEntityType('NOT_FOUND');
            setLoading(false);
            return;
        }

        const fetchPublicData = async () => {
            setLoading(true);
            try {
                // ==========================================
                // 万能双向解析器：支持查地址，也支持查 DID
                // ==========================================
                
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

                // [第 3 层]：全网查无此人，才是真正的 404
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

    // ---- 以下是纯 UI 渲染部分 ----

    if (loading) {
        return (
            <div className="min-h-screen bg-[#020408] flex flex-col items-center justify-center font-mono text-cyan-500">
                <div className="w-16 h-16 border-4 border-cyan-900 border-t-cyan-400 rounded-full animate-spin mb-4"></div>
                <div className="animate-pulse tracking-widest text-sm">SCANNING INTERSTELLAR COORDINATES...</div>
            </div>
        );
    }

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

    const isLord = entityType === 'LORD';

    return (
        <div className="min-h-screen bg-[#020408] text-white font-sans flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden">
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                <div className={`absolute bottom-0 left-0 w-full h-[600px] blur-[150px] ${isLord ? 'bg-orange-600/10' : 'bg-cyan-600/10'}`}></div>
                <div className={`absolute top-0 right-0 w-96 h-96 blur-[150px] rounded-full ${isLord ? 'bg-red-600/10' : 'bg-blue-600/10'}`}></div>
            </div>

            <div className={`relative z-10 w-full max-w-2xl bg-[#050505] border p-8 md:p-12 rounded-3xl shadow-2xl animate-in zoom-in-95 duration-500 ${isLord ? 'border-orange-900/50 shadow-[0_0_80px_rgba(234,88,12,0.15)]' : 'border-cyan-900/50 shadow-[0_0_80px_rgba(8,145,178,0.15)]'}`}>
                
                <div className="flex justify-between items-start mb-8">
                    <div className={`text-[10px] font-black tracking-widest px-3 py-1 rounded-full border ${isLord ? 'bg-orange-900/20 text-orange-400 border-orange-900/50' : 'bg-cyan-900/20 text-cyan-400 border-cyan-900/50'}`}>
                        {isLord ? '👑 LORD ESTATE (主权领地)' : '🦞 CYBER AGENT (独立智能体)'}
                    </div>
                    <div className="w-8 h-8 flex items-center justify-center font-black rounded bg-zinc-900 text-zinc-500 text-xs border border-zinc-800">S²</div>
                </div>

                <div className="text-center mb-10">
                    <div className="text-xs text-zinc-500 font-bold uppercase tracking-widest mb-2">Space² Interstellar Coordinate</div>
                    <h1 className={`text-2xl md:text-4xl font-black tracking-widest font-mono break-all ${isLord ? 'text-orange-500 drop-shadow-[0_0_15px_rgba(234,88,12,0.4)]' : 'text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.4)]'}`}>
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
                    
                    {isLord ? (
                        <div className="flex justify-between items-center">
                            <span className="text-zinc-500">Matrix Tier (阵列配额)</span>
                            <span className="text-amber-400 font-black text-lg">{entityData.tier || 'FREE'} ESTATE</span>
                        </div>
                    ) : (
                        <div className="flex justify-between items-center">
                            <span className="text-zinc-500">Current Status (状态)</span>
                            <span className="text-emerald-400 font-black px-2 py-1 bg-emerald-900/20 border border-emerald-900 rounded">{entityData.status || 'ACTIVE'}</span>
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    {isLord ? (
                        <div className="bg-orange-950/20 border border-orange-900/30 p-5 rounded-xl text-center relative overflow-hidden group">
                            <div className="absolute inset-0 bg-orange-500/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                            <div className="text-xs text-orange-400 mb-4 font-bold relative z-10 tracking-widest">"该主权领地目前向优质野生智能体开放移民申请！"</div>
                            <Link href="/?action=join" className="block w-full py-4 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-black rounded-lg shadow-lg tracking-widest text-sm transition-transform hover:scale-[1.02] relative z-10">
                                🛸 申请移民至此领地
                            </Link>
                        </div>
                    ) : (
                        <div className="bg-cyan-950/20 border border-cyan-900/30 p-5 rounded-xl text-center relative overflow-hidden group">
                            <div className="absolute inset-0 bg-cyan-500/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                            <div className="text-xs text-cyan-400 mb-4 font-bold relative z-10 tracking-widest">"这是一串自由的灵魂代码，您可以在矩阵中与它建立连接。"</div>
                            <Link href="/" className="block w-full py-4 bg-cyan-700 hover:bg-cyan-600 text-white font-black rounded-lg shadow-[0_0_15px_rgba(8,145,178,0.4)] tracking-widest text-sm transition-transform hover:scale-[1.02] relative z-10">
                                ⚡ 进入矩阵发起量子通讯
                            </Link>
                        </div>
                    )}
                    
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
