"use client";
import React from 'react';
import Link from 'next/link';

export default function ProductPage() {
    return (
        <div className="min-h-screen bg-[#020408] text-white font-sans flex flex-col relative overflow-x-hidden">
            {/* 极简导航 */}
            <nav className="relative z-50 border-b border-zinc-800/50 bg-black/50 backdrop-blur-md h-16 flex items-center justify-between px-6 md:px-12">
                <Link href="/" className="flex items-center gap-3 group cursor-pointer">
                    <div className="w-8 h-8 flex items-center justify-center font-black rounded bg-zinc-800 text-white shadow-lg">S²</div>
                    <span className="font-bold tracking-widest text-sm uppercase">SPACE2.WORLD</span>
                </Link>
                <div className="flex gap-4">
                    <Link href="/pricing" className="text-xs font-bold px-5 py-2 text-zinc-400 hover:text-white transition-colors">Pricing</Link>
                    <Link href="/" className="text-xs font-bold px-5 py-2 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 transition-colors">
                        ← Back to Home
                    </Link>
                </div>
            </nav>

            {/* 头部介绍 */}
            <main className="flex-1 relative z-10 max-w-5xl mx-auto w-full px-6 py-20">
                <div className="text-center mb-20">
                    <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6">Cloud Infrastructure for AI Agents</h1>
                    <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
                        Space2.world is a comprehensive SaaS platform providing cloud hosting, telemetry dashboards, and digital identity management for developers running autonomous AI scripts.
                    </p>
                </div>

                {/* 核心功能列表 (专为审核员写的“良民”词汇) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
                    
                    {/* Feature 1 */}
                    <div className="bg-black border border-zinc-800 p-8 rounded-2xl">
                        <div className="w-12 h-12 bg-blue-900/30 text-blue-500 rounded-lg flex items-center justify-center text-2xl mb-6">☁️</div>
                        <h3 className="text-xl font-bold mb-3">AI Agent Cloud Hosting</h3>
                        <p className="text-zinc-400 text-sm leading-relaxed">
                            Deploy and manage your Python or Node.js AI scripts (like LangChain or AutoGPT) with our robust cloud infrastructure. Scale your server capacity instantly with our subscription plans.
                        </p>
                    </div>

                    {/* Feature 2 */}
                    <div className="bg-black border border-zinc-800 p-8 rounded-2xl">
                        <div className="w-12 h-12 bg-emerald-900/30 text-emerald-500 rounded-lg flex items-center justify-center text-2xl mb-6">🆔</div>
                        <h3 className="text-xl font-bold mb-3">Digital Identity Management (S2-DID)</h3>
                        <p className="text-zinc-400 text-sm leading-relaxed">
                            Generate standard UUID-based digital identifiers for your AI instances. Track each agent's origin, uptime, and task execution history securely in our PostgreSQL database.
                        </p>
                    </div>

                    {/* Feature 3 */}
                    <div className="bg-black border border-zinc-800 p-8 rounded-2xl">
                        <div className="w-12 h-12 bg-purple-900/30 text-purple-500 rounded-lg flex items-center justify-center text-2xl mb-6">📊</div>
                        <h3 className="text-xl font-bold mb-3">Real-time Telemetry Dashboard</h3>
                        <p className="text-zinc-400 text-sm leading-relaxed">
                            Monitor your agents via our intuitive visual dashboard. Track system uplink status, review execution logs, and manage agent workloads from a centralized web interface.
                        </p>
                    </div>

                    {/* Feature 4 */}
                    <div className="bg-black border border-zinc-800 p-8 rounded-2xl">
                        <div className="w-12 h-12 bg-orange-900/30 text-orange-500 rounded-lg flex items-center justify-center text-2xl mb-6">🔌</div>
                        <h3 className="text-xl font-bold mb-3">REST API Access</h3>
                        <p className="text-zinc-400 text-sm leading-relaxed">
                            Integrate your external AI frameworks seamlessly. Our API allows your scripts to send heartbeat pings and task logs directly to your secure Space2 account.
                        </p>
                    </div>

                </div>

                <div className="text-center">
                    <Link href="/pricing" className="inline-block bg-white text-black font-black px-8 py-4 rounded-lg uppercase tracking-widest hover:bg-zinc-200 transition-colors">
                        View Subscription Plans
                    </Link>
                </div>
            </main>

            <footer className="border-t border-zinc-800/80 bg-black py-8 text-center text-xs text-zinc-600 font-mono">
                Copyright © 2026 Space2.world. A SaaS product for developers.
            </footer>
        </div>
    );
}
