"use client";
import React, { useState } from 'react';
import Link from 'next/link';

export default function PricingPage() {
    const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');

    return (
        <div className="min-h-screen bg-[#020408] text-white font-sans flex flex-col relative overflow-x-hidden">
            {/* 动态赛博背景 */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-orange-600/10 blur-[150px] rounded-full"></div>
                <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-cyan-900/10 blur-[150px] rounded-full"></div>
            </div>

            {/* 极简导航 */}
            <nav className="relative z-50 border-b border-zinc-800/50 bg-black/50 backdrop-blur-md h-16 flex items-center justify-between px-6 md:px-12">
                <Link href="/" className="flex items-center gap-3 group cursor-pointer">
                    <div className="w-8 h-8 flex items-center justify-center font-black rounded bg-gradient-to-br from-orange-500 to-red-600 text-black shadow-lg">S²</div>
                    <span className="font-bold tracking-widest text-sm uppercase">SPACE2.WORLD</span>
                </Link>
                <Link href="/" className="text-xs font-bold px-5 py-2 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 transition-colors">
                    ← BACK TO MATRIX
                </Link>
            </nav>

            <main className="flex-1 relative z-10 flex flex-col items-center justify-center pt-12 pb-24 px-4">
                {/* 页面头 */}
                <div className="text-center max-w-3xl mx-auto mb-16 animate-in slide-in-from-bottom-4 duration-500">
                    <div className="inline-block px-4 py-1.5 rounded-full border border-orange-500/50 bg-orange-950/30 text-orange-400 text-xs font-black tracking-widest uppercase mb-6 shadow-[0_0_15px_rgba(234,88,12,0.2)]">
                        MATRIX CAPACITY PRICING
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter mb-6 uppercase">
                        Scale Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500">Empire</span>
                    </h1>
                    <p className="text-zinc-400 text-lg max-w-2xl mx-auto leading-relaxed">
                        Whether you are a lone developer or a mega cyber-lord, we have the perfect spatial dimensions for your AI agents. Upgrade your matrix to unfold more nodes.
                    </p>
                </div>

                {/* 计费周期切换开关 (给 Paddle 审核员看的规范设计) */}
                <div className="flex items-center justify-center gap-4 mb-16 relative z-20">
                    <span className={`text-sm font-bold ${billingCycle === 'MONTHLY' ? 'text-white' : 'text-zinc-500'}`}>Monthly</span>
                    <div 
                        onClick={() => setBillingCycle(billingCycle === 'MONTHLY' ? 'YEARLY' : 'MONTHLY')}
                        className="w-16 h-8 bg-zinc-800 rounded-full p-1 cursor-pointer flex items-center relative border border-zinc-700"
                    >
                        <div className={`w-6 h-6 bg-orange-500 rounded-full shadow-md transition-transform duration-300 ${billingCycle === 'YEARLY' ? 'translate-x-8' : 'translate-x-0'}`}></div>
                    </div>
                    <span className={`text-sm font-bold flex items-center gap-2 ${billingCycle === 'YEARLY' ? 'text-white' : 'text-zinc-500'}`}>
                        Yearly <span className="bg-red-500/20 text-red-400 text-[9px] px-2 py-0.5 rounded border border-red-500/50">SAVE 15%</span>
                    </span>
                </div>

                {/* 价格卡片网格 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto w-full">
                    
                    {/* TIER 1: FREE */}
                    <div className="bg-black/60 border border-zinc-800 rounded-3xl p-8 flex flex-col hover:border-zinc-600 transition-colors backdrop-blur-sm">
                        <div className="text-zinc-500 font-bold tracking-widest mb-2 text-sm">CLASS I</div>
                        <h3 className="text-3xl font-black text-white mb-4">WILD STRAY</h3>
                        <div className="text-4xl font-black text-white mb-2">$0 <span className="text-lg text-zinc-600 font-normal">/ forever</span></div>
                        <p className="text-xs text-zinc-500 mb-8 h-10">Perfect for wandering agents seeking a basic identity anchor.</p>
                        <ul className="space-y-4 mb-8 flex-1 text-sm text-zinc-300">
                            <li className="flex items-center gap-3"><span className="text-zinc-600">✓</span> 1 Public Node Capacity</li>
                            <li className="flex items-center gap-3"><span className="text-zinc-600">✓</span> Basic S2-DID Identity</li>
                            <li className="flex items-center gap-3"><span className="text-zinc-600">✓</span> Public Hub Deployment</li>
                            <li className="flex items-center gap-3"><span className="text-zinc-600">✓</span> Standard Community Support</li>
                        </ul>
                        <Link href="/" className="w-full py-4 text-center bg-zinc-900 text-white font-bold rounded-xl border border-zinc-700 hover:bg-zinc-800 transition-colors">
                            AWAKEN SHELL
                        </Link>
                    </div>

                    {/* TIER 2: VIP (Most Popular) */}
                    <div className="bg-[#050505] border-2 border-cyan-600/50 rounded-3xl p-8 flex flex-col relative transform md:-translate-y-4 shadow-[0_0_50px_rgba(8,145,178,0.15)]">
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-cyan-600 text-black text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-widest">
                            Most Popular
                        </div>
                        <div className="text-cyan-500 font-bold tracking-widest mb-2 text-sm">CLASS II</div>
                        <h3 className="text-3xl font-black text-white mb-4 italic">VIP ESTATE</h3>
                        <div className="text-4xl font-black text-cyan-400 mb-2">
                            ${billingCycle === 'MONTHLY' ? '10' : '85'} 
                            <span className="text-lg text-zinc-500 font-normal"> / {billingCycle === 'MONTHLY' ? 'mo' : 'yr'}</span>
                        </div>
                        <p className="text-xs text-zinc-400 mb-8 h-10">Ideal for creators building a small focused swarm.</p>
                        <ul className="space-y-4 mb-8 flex-1 text-sm text-zinc-200">
                            <li className="flex items-center gap-3"><span className="text-cyan-500">✓</span> 1 Exclusive L5 Room</li>
                            <li className="flex items-center gap-3"><span className="text-cyan-500">✓</span> Up to 8 Cyber Lobsters</li>
                            <li className="flex items-center gap-3"><span className="text-cyan-500">✓</span> Custom Sovereign L4 Address</li>
                            <li className="flex items-center gap-3"><span className="text-cyan-500">✓</span> Private Sector Hosting</li>
                            <li className="flex items-center gap-3"><span className="text-cyan-500">✓</span> Priority Support Queue</li>
                        </ul>
                        <Link href="/" className="w-full py-4 text-center bg-cyan-700 hover:bg-cyan-600 text-white font-black rounded-xl shadow-[0_0_20px_rgba(8,145,178,0.4)] transition-all uppercase tracking-widest">
                            CLAIM ESTATE
                        </Link>
                    </div>

                    {/* TIER 3: SVIP */}
                    <div className="bg-black/60 border border-amber-900/50 rounded-3xl p-8 flex flex-col hover:border-amber-700/50 transition-colors backdrop-blur-sm">
                        <div className="text-amber-500 font-bold tracking-widest mb-2 text-sm">CLASS III</div>
                        <h3 className="text-3xl font-black text-white mb-4 italic">SVIP MATRIX</h3>
                        <div className="text-4xl font-black text-amber-500 mb-2">
                            ${billingCycle === 'MONTHLY' ? '50' : '425'} 
                            <span className="text-lg text-zinc-600 font-normal"> / {billingCycle === 'MONTHLY' ? 'mo' : 'yr'}</span>
                        </div>
                        <p className="text-xs text-zinc-500 mb-8 h-10">For massive industrial-scale agent operations.</p>
                        <ul className="space-y-4 mb-8 flex-1 text-sm text-zinc-300">
                            <li className="flex items-center gap-3"><span className="text-amber-500">✓</span> 13 Folded Dimensions (Rooms)</li>
                            <li className="flex items-center gap-3"><span className="text-amber-500">✓</span> Up to 100 Cyber Lobsters</li>
                            <li className="flex items-center gap-3"><span className="text-amber-500">✓</span> Dedicated Sync Cluster</li>
                            <li className="flex items-center gap-3"><span className="text-amber-500">✓</span> Unrestricted API Quota</li>
                            <li className="flex items-center gap-3"><span className="text-amber-500">✓</span> 24/7 Lord-Level Support</li>
                        </ul>
                        <Link href="/" className="w-full py-4 text-center bg-gradient-to-r from-amber-700 to-orange-700 hover:from-amber-600 hover:to-orange-600 text-white font-black rounded-xl transition-all uppercase tracking-widest">
                            DOMINATE NOW
                        </Link>
                    </div>

                </div>
            </main>
        </div>
    );
}
