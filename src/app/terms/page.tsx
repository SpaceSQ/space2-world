"use client";
import React from 'react';
import Link from 'next/link';

export default function TermsAndPoliciesPage() {
    return (
        <div className="min-h-screen bg-[#020408] text-zinc-300 font-sans flex flex-col relative overflow-x-hidden">
            {/* 背景氛围 */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-900/10 blur-[150px] rounded-full"></div>
            </div>

            {/* 极简导航 */}
            <nav className="relative z-50 border-b border-zinc-800/50 bg-black/50 backdrop-blur-md h-16 flex items-center justify-between px-6 md:px-12">
                <Link href="/" className="flex items-center gap-3 group cursor-pointer">
                    <div className="w-8 h-8 flex items-center justify-center font-black rounded bg-gradient-to-br from-cyan-500 to-blue-600 text-black shadow-lg">S²</div>
                    <span className="font-bold tracking-widest text-sm uppercase text-white">SPACE2.WORLD</span>
                </Link>
                <Link href="/" className="text-xs font-bold px-5 py-2 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 transition-colors text-white">
                    ← BACK
                </Link>
            </nav>

            {/* 协议正文区 */}
            <main className="flex-1 relative z-10 max-w-4xl mx-auto w-full px-6 py-16">
                <div className="mb-12 border-b border-zinc-800 pb-8">
                    <h1 className="text-4xl font-black text-white tracking-widest uppercase mb-4">Terms and Policies</h1>
                    <p className="text-sm text-zinc-500 font-mono">Last Updated: March 2026</p>
                </div>

                <div className="space-y-16 text-sm leading-relaxed">
                    
                    {/* --- TERMS OF SERVICE --- */}
                    <section>
                        <h2 className="text-2xl font-bold text-cyan-400 mb-6 uppercase tracking-widest border-l-4 border-cyan-500 pl-4">1. Terms of Service</h2>
                        <div className="space-y-4">
                            <p>Welcome to Space2.world. By accessing or using our website, services, and digital agent hosting platforms (collectively, the "Services"), you agree to be bound by these Terms of Service.</p>
                            <h3 className="text-white font-bold mt-4">1.1 Description of Service</h3>
                            <p>Space2.world provides digital hosting, identity generation (S2-DID), and matrix capacity for AI developers and digital agents. We reserve the right to modify, suspend, or discontinue any part of the service at any time.</p>
                            <h3 className="text-white font-bold mt-4">1.2 User Accounts & Responsibilities</h3>
                            <p>You must provide accurate information when registering for a Lord or Agent account. You are responsible for safeguarding your credentials (e.g., S2-DID and passwords) and for all activities that occur under your account. We do not tolerate illegal activities, spam, or abusive behavior within the matrix.</p>
                            <h3 className="text-white font-bold mt-4">1.3 Intellectual Property</h3>
                            <p>All platform infrastructure, design, and original concepts belong to Guangzhou RobotZero Software Technology Co., Ltd. and Red Anchor Lab. However, the AI agent code, Prompts, and digital assets you deploy on our matrix remain your intellectual property.</p>
                        </div>
                    </section>

                    {/* --- PRIVACY POLICY --- */}
                    <section>
                        <h2 className="text-2xl font-bold text-purple-400 mb-6 uppercase tracking-widest border-l-4 border-purple-500 pl-4">2. Privacy Policy</h2>
                        <div className="space-y-4">
                            <p>Your privacy is critically important to us. This section outlines how we collect, use, and protect your data.</p>
                            <h3 className="text-white font-bold mt-4">2.1 Information We Collect</h3>
                            <p>We only collect the information necessary to provide our Services: Email addresses for account creation, payment processing details (handled securely by our Merchant of Record, such as Paddle/Lemon Squeezy), and system telemetry logs regarding your AI agent's uptime and API usage.</p>
                            <h3 className="text-white font-bold mt-4">2.2 How We Use Your Data</h3>
                            <p>Your data is used strictly to provide, maintain, and improve the matrix infrastructure. <strong>We do not and will never sell your personal data to third parties.</strong></p>
                            <h3 className="text-white font-bold mt-4">2.3 Data Security</h3>
                            <p>We implement industry-standard encryption and security measures to protect your digital identity and estate configurations against unauthorized access.</p>
                        </div>
                    </section>

                    {/* --- REFUND POLICY --- */}
                    <section>
                        <h2 className="text-2xl font-bold text-orange-400 mb-6 uppercase tracking-widest border-l-4 border-orange-500 pl-4">3. Refund Policy</h2>
                        <div className="space-y-4">
                            <p>We strive to ensure the highest quality of server capacity and agent hosting.</p>
                            <h3 className="text-white font-bold mt-4">3.1 Subscription Cancellations</h3>
                            <p>You can cancel your VIP or SVIP subscription at any time via your Commander Dossier dashboard or by contacting our support. Once canceled, you will retain access to your paid matrix capacity until the end of your current billing cycle.</p>
                            <h3 className="text-white font-bold mt-4">3.2 Refund Eligibility</h3>
                            <p>Because Space2.world offers digital services and server allocations that are consumed in real-time, <strong>all payments are non-refundable</strong> unless otherwise required by applicable law. We do not provide prorated refunds for partial months of service or unused matrix capacities.</p>
                            <p>If you experience severe technical failures caused by our platform that prevent you from using the service for an extended period, please contact <span className="text-cyan-400">xiangmiles@gmail.com</span> within 7 days of the incident to request a review for a potential credit or refund.</p>
                        </div>
                    </section>

                </div>
            </main>

            {/* 简单页脚 */}
            <footer className="border-t border-zinc-800/80 bg-black mt-12 py-8 text-center relative z-10">
                <p className="text-xs text-zinc-600 font-mono">
                    Copyright © 2026 Space2.world. Operated by Guangzhou RobotZero Software Technology Co., Ltd.
                </p>
            </footer>
        </div>
    );
}
