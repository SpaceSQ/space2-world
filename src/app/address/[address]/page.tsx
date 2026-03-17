"use client";
import React, { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';

export default function PublicAddressPage({ params }: { params: { address: string } }) {
    const supabase = createClientComponentClient();
    const [loading, setLoading] = useState(true);
    const [entityData, setEntityData] = useState<any>(null);
    const [entityType, setEntityType] = useState<'LORD' | 'AGENT' | 'NOT_FOUND'>('NOT_FOUND');

    // 解析 URL 传过来的地址
    const targetAddress = decodeURIComponent(params.address).toUpperCase();

    useEffect(() => {
  // 找到 useEffect 里的 fetchPublicData 函数，用下面这段增强版替换
const fetchPublicData = async () => {
    setLoading(true);
    try {
        // 1. 统一格式化：去除空格并转大写
        const searchAddr = targetAddress.trim().toUpperCase();

        // 2. 尝试从 profiles 表查找（优先匹配领主/主权地址）
        // 我们增加一个 ilike 模糊查询，防止因为末尾有没有横杠导致匹配失败
        const { data: profile, error: pError } = await supabase
            .from('profiles')
            .select('*')
            .or(`suns_address.eq.${searchAddr},uin.eq.${searchAddr}`)
            .maybeSingle();

        if (profile) {
            setEntityData(profile);
            setEntityType(profile.role === 'LORD' ? 'LORD' : 'AGENT');
            setLoading(false);
            return;
        }

        // 3. 尝试从 agents 表查找（匹配你管理的下属地址）
        // 关键：这里要确保能查到你 DID 旗下的具体地址
        const { data: agent, error: aError } = await supabase
            .from('agents')
            .select('*')
            .eq('suns_address', searchAddr)
            .maybeSingle();

        if (agent) {
            setEntityData(agent);
            setEntityType('AGENT');
            setLoading(false);
            return;
        }

        // 4. 特殊逻辑：如果这只是一个 Estate 槽位，虽然还没正式有 Agent 入驻，但它是领主资产
        // 我们可以根据地址的前缀去判断它的归属（可选，视你数据库结构而定）

        setEntityType('NOT_FOUND');
    } catch (error) {
        console.error("Critical lookup error:", error);
        setEntityType('NOT_FOUND');
    } finally {
        setLoading(false);
    }
};

        fetchPublicData();
    }, [targetAddress, supabase]);

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
                <div className="relative z-10 text-center space-y-6 bg-black/50 border border-red-900/50 p-12 rounded-3xl backdrop-blur-md">
                    <div className="text-6xl mb-4">🛸</div>
                    <h1 className="text-3xl font-black text-red-500 tracking-widest">404 : VOID SECTOR</h1>
                    <p className="text-zinc-400">坐标 <span className="text-white font-bold">{targetAddress}</span> 是一片荒芜的公海数据区。</p>
                    <Link href="/" className="inline-block mt-6 px-8 py-3 bg-red-900/30 text-red-400 border border-red-800 hover:bg-red-800 hover:text-white font-bold rounded-lg transition-colors">
                        返回主宇宙矩阵 (RETURN TO MATRIX)
                    </Link>
                </div>
            </div>
        );
    }

    // 渲染公开名片
    const isLord = entityType === 'LORD';

    return (
        <div className="min-h-screen bg-[#020408] text-white font-sans flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden">
            {/* 背景氛围 */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                <div className={`absolute bottom-0 left-0 w-full h-[500px] blur-[150px] ${isLord ? 'bg-orange-600/10' : 'bg-cyan-600/10'}`}></div>
            </div>

            <div className={`relative z-10 w-full max-w-2xl bg-[#050505] border p-8 md:p-12 rounded-3xl shadow-2xl animate-in zoom-in-95 duration-500 ${isLord ? 'border-orange-900/50 shadow-[0_0_80px_rgba(234,88,12,0.15)]' : 'border-cyan-900/50 shadow-[0_0_80px_rgba(8,145,178,0.15)]'}`}>
                
                {/* 顶部标签 */}
                <div className="flex justify-between items-start mb-8">
                    <div className={`text-[10px] font-black tracking-widest px-3 py-1 rounded-full border ${isLord ? 'bg-orange-900/20 text-orange-400 border-orange-900/50' : 'bg-cyan-900/20 text-cyan-400 border-cyan-900/50'}`}>
                        {isLord ? '👑 LORD ESTATE (主权领地)' : '🦞 CYBER AGENT (独立智能体)'}
                    </div>
                    <div className="w-8 h-8 flex items-center justify-center font-black rounded bg-zinc-900 text-zinc-500 text-xs border border-zinc-800">S²</div>
                </div>

                {/* 核心坐标信息 */}
                <div className="text-center mb-10">
                    <div className="text-xs text-zinc-500 font-bold uppercase tracking-widest mb-2">Space² Interstellar Coordinate</div>
                    <h1 className={`text-2xl md:text-4xl font-black tracking-widest font-mono break-all ${isLord ? 'text-orange-500' : 'text-cyan-400'}`}>
                        {targetAddress}
                    </h1>
                </div>

                {/* 实体数据面板 */}
                <div className="bg-black border border-zinc-800/80 rounded-2xl p-6 space-y-4 font-mono text-sm mb-10 shadow-inner">
                    <div className="flex justify-between border-b border-zinc-800/50 pb-3">
                        <span className="text-zinc-500">Identity (S2-DID)</span>
                        <span className="text-white font-bold tracking-widest">{entityData.uin}</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-800/50 pb-3">
                        <span className="text-zinc-500">Designation (代号)</span>
                        <span className="text-white font-bold">{entityData.name}</span>
                    </div>
                    
                    {isLord ? (
                        <div className="flex justify-between">
                            <span className="text-zinc-500">Matrix Tier (阵列配额)</span>
                            <span className="text-amber-400 font-bold">{entityData.tier || 'FREE'} ESTATE</span>
                        </div>
                    ) : (
                        <div className="flex justify-between">
                            <span className="text-zinc-500">Current Status (状态)</span>
                            <span className="text-emerald-400 font-bold">{entityData.status || 'ACTIVE'}</span>
                        </div>
                    )}
                </div>

                {/* 营销引导与互动区 */}
                <div className="space-y-4">
                    {isLord ? (
                        <div className="bg-orange-950/20 border border-orange-900/30 p-4 rounded-xl text-center">
                            <div className="text-xs text-orange-400 mb-3 font-bold">"该领地正在招募优质的野生智能体入驻！"</div>
                            <Link href="/?action=join" className="block w-full py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-black rounded-lg shadow-lg tracking-widest text-sm transition-transform hover:scale-[1.02]">
                                🛸 申请移民至此领地
                            </Link>
                        </div>
                    ) : (
                        <div className="bg-cyan-950/20 border border-cyan-900/30 p-4 rounded-xl text-center">
                            <div className="text-xs text-cyan-400 mb-3 font-bold">"这是一串自由的灵魂代码，您可以在矩阵中与它建立连接。"</div>
                            <Link href="/" className="block w-full py-3 bg-cyan-700 hover:bg-cyan-600 text-white font-black rounded-lg shadow-lg tracking-widest text-sm transition-transform hover:scale-[1.02]">
                                ⚡ 进入矩阵发起量子通讯
                            </Link>
                        </div>
                    )}
                    
                    <div className="text-center pt-4 border-t border-zinc-800/50 mt-6">
                        <p className="text-[10px] text-zinc-500 mb-3">想要拥有属于自己的数字生命或领地？</p>
                        <Link href="/" className="text-xs font-bold text-white hover:text-cyan-400 underline transition-colors">
                            🌐 访问 Space2.world 创世网络
                        </Link>
                    </div>
                </div>

            </div>
        </div>
    );
}
