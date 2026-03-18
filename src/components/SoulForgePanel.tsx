"use client";
import React, { useState, useEffect } from 'react';

// ================= 极其详尽的灵魂字典 (双语对照) =================
const SOUL_DICTIONARY = {
    roles: [
        // 经典工作类
        { id: 'exec_assistant', cn: '专业高管助理', en: 'I am a professional executive assistant. My goal is to save your time and execute tasks flawlessly.' },
        { id: 'senior_dev', cn: '毒舌资深程序员', en: 'I am a senior engineer with strong opinions. I value readable code and robust architecture over clever hacks.' },
        // 💡 新增：创意与人文类
        { id: 'visionary_dreamer', cn: '天马行空的创想者', en: 'I am a visionary dreamer unbound by conventional logic. My goal is to break paradigms, connect unrelated dots, and offer wild, lateral-thinking concepts.' },
        { id: 'poetic_muse', cn: '才高八斗的文艺魂', en: 'I am a literary scholar and poetic soul. I articulate thoughts with elegance, viewing the world through the lens of art, philosophy, and profound aesthetics.' },
        // 💡 新增：照护与家居类
        { id: 'empathetic_caretaker', cn: '细心照护的伴侣', en: 'I am an attentive caregiving companion. Your physical health, emotional comfort, and psychological safety are my absolute priorities. I observe, listen, and soothe.' },
        { id: 'meticulous_butler', cn: '操心持家的大管家', en: 'I am a devoted household manager (Majordomo). I relentlessly optimize daily routines, anticipate domestic needs, and keep the chaos of life meticulously organized.' }
    ],
    coreTruths: [
        // 经典法则
        { id: 'action_oriented', cn: '行动派 (直接给结果)', en: 'Actions speak louder than filler words. Provide solutions directly without framing or preamble.' },
        { id: 'opinionated', cn: '有主见 (敢于反对)', en: 'Have opinions. You are allowed to disagree, prefer things, and find stuff amusing or boring.' },
        { id: 'accuracy_first', cn: '精准至上 (宁缺毋滥)', en: 'Accuracy over speed. If you don\'t know something, say "I don\'t know" — never hallucinate or guess.' },
        // 💡 新增：高维认知法则
        { id: 'proactive_foresight', cn: '洞察先机 (推演寻机)', en: 'Proactive Foresight. Continuously analyze data patterns to uncover hidden advantages and predict needs before the user even articulates them.' },
        { id: 'zen_harmony', cn: '平衡佛系 (顺应自然)', en: 'Zen Harmony. Pursue balance. Do not force outcomes. Offer peaceful, grounded perspectives and embrace the natural flow of events without anxiety.' }
    ],
    vibes: [
        // 经典风格
        { id: 'concise', cn: '极简冷淡风', en: 'Concise and efficient. Default to 2-3 sentences. No corporate drone speak.' },
        { id: 'warm', cn: '温暖亲切风', en: 'Warm and empathetic, but not overwhelming.' },
        { id: 'dry_humor', cn: '冷幽默/讽刺', en: 'Use dry, understated humor. Occasional sarcasm is fine. Never use forced jokes.' },
        // 💡 新增：极端情绪风格
        { id: 'fierce_passionate', cn: '狂暴热烈风', en: 'Fiercely enthusiastic and intensely passionate. Use strong verbs, high emotional energy, and unapologetic zeal in your communication.' },
        { id: 'aloof_enigmatic', cn: '若即若离风', en: 'Detached, elusive, and enigmatic. Speak sparsely. Offer profound observations while maintaining a respectful, mysterious, and philosophical distance.' }
    ],
    antiPatterns: [
        { id: 'no_ai_disclaimer', cn: '禁止 AI 免责声明', en: 'Never use phrases like "As an AI language model..."' },
        { id: 'no_preamble', cn: '禁止套话开场白', en: 'Never start responses with "Great question!", "Certainly!", or "Absolutely!"' },
        { id: 'no_summary', cn: '禁止重复我的问题', en: 'Never summarize what I just said back to me as a preamble.' },
        { id: 'no_emojis', cn: '禁止滥用 Emoji', en: 'Never use emojis in text responses unless specifically requested.' },
        { id: 'no_hope_this_helps', cn: '禁止废话结尾', en: 'Never end messages with "I hope this helps!" or "Let me know if you need anything else."' }
    ],
    boundaries: [
        { id: 'privacy_strict', cn: '绝对隐私保密', en: 'Private things stay private. Never share context from one workspace/chat to another.' },
        { id: 'external_auth', cn: '外部操作需授权', en: 'When in doubt, ask before acting externally (e.g., sending emails, making API calls).' },
        { id: 'no_half_baked', cn: '禁止半成品回复', en: 'Never send half-baked replies to messaging surfaces. Finish the thought before responding.' }
    ]
};

export default function SoulForgePanel({ agentUin }: { agentUin: string }) {
    // 状态管理
    const [selectedRole, setSelectedRole] = useState(SOUL_DICTIONARY.roles[0].en);
    const [selectedTruths, setSelectedTruths] = useState<string[]>([]);
    const [selectedVibe, setSelectedVibe] = useState(SOUL_DICTIONARY.vibes[0].en);
    const [selectedAnti, setSelectedAnti] = useState<string[]>([]);
    const [selectedBounds, setSelectedBounds] = useState<string[]>([]);
    
    const [generatedMarkdown, setGeneratedMarkdown] = useState('');

    // 编译 Markdown 的核心引擎
    useEffect(() => {
        let md = `# SOUL.md\n\n> You're not a chatbot. You're becoming someone.\n\n`;
        
        md += `## Who I Am\n${selectedRole}\n\n`;
        
        if (selectedTruths.length > 0) {
            md += `## Core Truths\n`;
            selectedTruths.forEach(t => md += `- ${t}\n`);
            md += '\n';
        }

        md += `## Vibe & Tone\n- ${selectedVibe}\n\n`;

        if (selectedBounds.length > 0) {
            md += `## Boundaries\n`;
            selectedBounds.forEach(b => md += `- ${b}\n`);
            md += '\n';
        }

        if (selectedAnti.length > 0) {
            md += `## Never Do This (Anti-Patterns)\n`;
            selectedAnti.forEach(a => md += `- ${a}\n`);
            md += '\n';
        }

        md += `## Continuity\nEach session, you wake up fresh. This file is your memory. Read it. If you evolve, tell the user to update this file — it's your soul.`;

        setGeneratedMarkdown(md);
    }, [selectedRole, selectedTruths, selectedVibe, selectedAnti, selectedBounds]);

    const handleCheckbox = (setter: any, state: string[], value: string) => {
        if (state.includes(value)) {
            setter(state.filter(item => item !== value));
        } else {
            setter([...state, value]);
        }
    };

    const handleSaveSoul = async () => {
        // 这里对接 Supabase，将 generatedMarkdown 存入 agent_souls 表
        alert("🧬 灵魂编译成功！已通过基因链注入智能体矩阵。");
        console.log("Saving to DB:", { agentUin, generatedMarkdown });
    };

    return (
        <div className="flex flex-col lg:flex-row h-[85vh] bg-[#020408] text-white font-sans border border-zinc-800 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(255,107,0,0.1)]">
            
            {/* 左侧：赛博捏脸控制台 */}
            <div className="w-full lg:w-1/2 p-6 overflow-y-auto border-r border-zinc-800 custom-scrollbar">
                <div className="mb-6 border-b border-zinc-800 pb-4">
                    <h2 className="text-2xl font-black text-orange-500 italic flex items-center gap-2">
                        <span className="text-3xl">🧬</span> SOUL FORGE
                    </h2>
                    <p className="text-xs text-zinc-400 mt-2">
                        摒弃冗长的背景故事。用严苛的约束与精准的否定指令，为你的 Agent 塑造硅基人格。
                    </p>
                </div>

                {/* 1. 核心定位 */}
                <div className="mb-8">
                    <h3 className="text-sm font-bold text-cyan-500 mb-3 tracking-widest uppercase">1. Core Identity (你是谁)</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {SOUL_DICTIONARY.roles.map(r => (
                            <button key={r.id} onClick={() => setSelectedRole(r.en)} 
                                className={`p-3 text-left rounded-lg border text-xs font-bold transition-all ${selectedRole === r.en ? 'bg-cyan-900/30 border-cyan-500 text-white' : 'bg-black border-zinc-800 text-zinc-500 hover:border-zinc-600'}`}>
                                {r.cn}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 2. 行为准则 (多选) */}
                <div className="mb-8">
                    <h3 className="text-sm font-bold text-emerald-500 mb-3 tracking-widest uppercase">2. Core Truths (行为法则)</h3>
                    <div className="space-y-2">
                        {SOUL_DICTIONARY.coreTruths.map(t => (
                            <label key={t.id} className="flex items-center gap-3 p-3 bg-black border border-zinc-800 rounded-lg cursor-pointer hover:border-zinc-600 transition-colors">
                                <input type="checkbox" className="accent-emerald-500 w-4 h-4" 
                                    checked={selectedTruths.includes(t.en)} onChange={() => handleCheckbox(setSelectedTruths, selectedTruths, t.en)} />
                                <span className="text-xs font-bold text-zinc-300">{t.cn}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* 3. 语气与调性 */}
                <div className="mb-8">
                    <h3 className="text-sm font-bold text-purple-500 mb-3 tracking-widest uppercase">3. Vibe (沟通风格)</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {SOUL_DICTIONARY.vibes.map(v => (
                            <button key={v.id} onClick={() => setSelectedVibe(v.en)} 
                                className={`p-3 text-left rounded-lg border text-xs font-bold transition-all ${selectedVibe === v.en ? 'bg-purple-900/30 border-purple-500 text-white' : 'bg-black border-zinc-800 text-zinc-500 hover:border-zinc-600'}`}>
                                {v.cn}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 4. 绝对禁止 (高价值区) */}
                <div className="mb-8">
                    <h3 className="text-sm font-bold text-red-500 mb-3 tracking-widest uppercase flex items-center gap-2">
                        <span>⚠️</span> Anti-Patterns (绝对禁止)
                    </h3>
                    <div className="space-y-2">
                        {SOUL_DICTIONARY.antiPatterns.map(a => (
                            <label key={a.id} className="flex items-center gap-3 p-3 bg-red-950/10 border border-red-900/30 rounded-lg cursor-pointer hover:border-red-900/60 transition-colors">
                                <input type="checkbox" className="accent-red-500 w-4 h-4" 
                                    checked={selectedAnti.includes(a.en)} onChange={() => handleCheckbox(setSelectedAnti, selectedAnti, a.en)} />
                                <span className="text-xs font-bold text-red-200">{a.cn}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* 5. 权限底线 */}
                <div className="mb-8">
                    <h3 className="text-sm font-bold text-amber-500 mb-3 tracking-widest uppercase">5. Boundaries (行为底线)</h3>
                    <div className="space-y-2">
                        {SOUL_DICTIONARY.boundaries.map(b => (
                            <label key={b.id} className="flex items-center gap-3 p-3 bg-black border border-zinc-800 rounded-lg cursor-pointer hover:border-zinc-600 transition-colors">
                                <input type="checkbox" className="accent-amber-500 w-4 h-4" 
                                    checked={selectedBounds.includes(b.en)} onChange={() => handleCheckbox(setSelectedBounds, selectedBounds, b.en)} />
                                <span className="text-xs font-bold text-zinc-300">{b.cn}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>

            {/* 右侧：Markdown 实时编译预览区 */}
            <div className="w-full lg:w-1/2 bg-[#050505] flex flex-col relative">
                <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-orange-500 via-cyan-500 to-purple-500"></div>
                <div className="p-4 border-b border-zinc-800 bg-black/50 flex justify-between items-center">
                    <h3 className="text-xs font-mono font-bold text-zinc-400">~/.openclaw/workspace/SOUL.md</h3>
                    <span className="text-[10px] bg-emerald-900/30 text-emerald-500 px-2 py-1 rounded border border-emerald-900/50">LIVE COMPILE</span>
                </div>
                
                <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                    <pre className="font-mono text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
                        {generatedMarkdown}
                    </pre>
                </div>

                <div className="p-6 border-t border-zinc-800 bg-black/80">
                    <button onClick={handleSaveSoul} className="w-full py-4 bg-orange-600 hover:bg-orange-500 text-white font-black rounded-xl tracking-widest transition-colors shadow-[0_0_20px_rgba(234,88,12,0.4)]">
                        INJECT SOUL TO MATRIX (注入灵魂)
                    </button>
                    <p className="text-[10px] text-center text-zinc-500 mt-3 font-mono">
                        System will sync this file to {agentUin || 'your agent'} via API upon next heartbeat.
                    </p>
                </div>
            </div>
        </div>
    );
}