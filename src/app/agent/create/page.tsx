"use client";
import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { getCitizenProfile, createAgent } from '@/lib/db-actions';
import { generateSiliconID } from '@/lib/id-generator';
import { GlobalNav } from '@/components/GlobalNav';
import { AgentAvatar } from '@/components/AgentAvatar';

// 职业定义
const ROLES = [
  { id: 'LOGIC', label: 'Logic Core', desc: 'Data & Finance', color: 'text-blue-500' },
  { id: 'CREATIVE', label: 'Creative Synth', desc: 'Art & Design', color: 'text-purple-500' },
  { id: 'GUARDIAN', label: 'Guardian Proxy', desc: 'Security & Mod', color: 'text-emerald-500' },
  { id: 'SERVICE', label: 'Service Droid', desc: 'Support & Chat', color: 'text-yellow-500' },
];

// 五维性格默认值
const DEFAULT_PERSONALITY = { open: 50, cons: 50, extra: 50, agree: 50, neuro: 50 };

// 本地辅助函数：生成随机序列
const generateRandomSequence = () => Math.floor(Math.random() * 100000000).toString().padStart(8, '0');

export default function AgentCreate() {
  const supabase = createClientComponentClient();
  const router = useRouter();

  // --- 状态 ---
  const [loading, setLoading] = useState(true);
  const [citizen, setCitizen] = useState<any>(null); 
  
  // 表单数据
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [personality, setPersonality] = useState(DEFAULT_PERSONALITY);
  const [visualSeed, setVisualSeed] = useState(0); 
  const [idSequence, setIdSequence] = useState('');
  
  // V-ID 预览
  const [previewID, setPreviewID] = useState('');

  // 1. 初始化：获取当前公民身份
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/'); return; }
      
      const profile = await getCitizenProfile(session.user.id);
      if (!profile) {
        alert("Access Denied: You must be a Digital Citizen first.");
        router.push('/passport/create');
        return;
      }
      setCitizen(profile);
      setIdSequence(generateRandomSequence());
      setLoading(false);
    };
    init();
  }, [router, supabase.auth]);

  // 2. 实时生成 V-ID 预览
  useEffect(() => {
    if (citizen && idSequence) {
      const vid = generateSiliconID(citizen.suns_address, idSequence);
      setPreviewID(vid);
    }
  }, [citizen, idSequence]);

  // 3. 提交创建
  const handleSubmit = async () => {
    if (!name || !role) return;
    setLoading(true);
    try {
      const finalSeq = idSequence || generateRandomSequence();
      const finalID = generateSiliconID(citizen.suns_address, finalSeq);
      
      const newAgentPayload: any = {
        owner_uin: citizen.uin,
        name: name.toUpperCase(),
        role,
        personality,
        visual_model: visualSeed.toString(),
        uin: finalID,
        origin_address: citizen.suns_address,
        room_style: { id: 'STANDARD' },
        status: 'IDLE',
        tags: ['MANUAL_CREATION', 'V3_NATIVE']
      };

      await createAgent(newAgentPayload);
      
      // 跳转到护照页
      router.push(`/passport/${citizen.uin}`); 
    } catch (err) {
      console.error(err);
      alert('Error creating agent');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#020617] flex items-center justify-center text-emerald-500 font-mono text-xs">INITIALIZING FACTORY...</div>;

  return (
    <div className="min-h-screen w-full bg-[#020617] text-white font-mono flex flex-col items-center py-10 overflow-y-auto">
      <div className="fixed top-0 w-full z-50"><GlobalNav userType="HUMAN_MANAGER" /></div>

      <div className="w-full max-w-md px-6 mt-16 pb-20 animate-in fade-in slide-in-from-bottom-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full text-[9px] text-zinc-500 mb-3 tracking-widest uppercase">
            Silicon Intelligence Factory
          </div>
          <h1 className="text-2xl font-black text-white mb-1">NEW AGENT</h1>
          <p className="text-[10px] text-zinc-500">Create your autonomous workforce.</p>
        </div>

        {/* 1. Name & Role */}
        <div className="space-y-6 mb-8">
           <div>
              <label className="text-[9px] text-zinc-500 font-bold uppercase block mb-2">1. Identity & Role</label>
              <input 
                type="text" placeholder="Agent Name (e.g. ALPHA)" maxLength={20}
                value={name} onChange={e => setName(e.target.value.toUpperCase())}
                className="w-full bg-zinc-900/50 border border-zinc-700 rounded-lg p-3 text-sm focus:border-emerald-500 outline-none mb-4 placeholder-zinc-700 transition-colors"
              />
              
              <div className="grid grid-cols-2 gap-3">
                 {ROLES.map(r => {
                    const isSelected = role === r.id;
                    return (
                      <div 
                        key={r.id} onClick={() => setRole(r.id)}
                        className={`
                          cursor-pointer p-4 rounded-xl border-2 transition-all duration-200 relative overflow-hidden group
                          ${isSelected 
                            ? 'bg-white border-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)] transform scale-[1.02]' 
                            : 'bg-black border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:bg-zinc-900'
                          }
                        `}
                      >
                         {isSelected && <div className="absolute top-2 right-2 text-xs font-bold text-emerald-600">✓</div>}
                         <div className={`text-sm font-black mb-1 ${isSelected ? 'text-black' : r.color}`}>{r.label}</div>
                         <div className={`text-[10px] font-bold ${isSelected ? 'text-zinc-600' : 'opacity-60'}`}>{r.desc}</div>
                      </div>
                    );
                 })}
              </div>
           </div>

           {/* 2. Visuals */}
           <div>
              <label className="text-[9px] text-zinc-500 font-bold uppercase block mb-2">2. Visual Model (Select One)</label>
              
              <div className="flex flex-col items-center justify-center mb-4 p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl">
                 {/* 🔥 修复点：移除了 AgentAvatar 内部的 className，转而在外部套了一层 div 来实现发光特效 */}
                 <div className="mb-2 rounded-full overflow-hidden inline-flex shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                    <AgentAvatar seed={visualSeed} size={120} emotion="NEUTRAL" />
                 </div>
                 <div className="text-[10px] text-emerald-400 font-mono mt-1">MODEL V-{visualSeed.toString().padStart(2,'0')}</div>
              </div>

              <div className="grid grid-cols-4 gap-3">
                 {Array.from({length: 24}).map((_, i) => (
                    <div 
                      key={i} onClick={() => setVisualSeed(i)}
                      className={`
                        aspect-square rounded-xl border-2 cursor-pointer flex items-center justify-center transition-all p-1
                        ${visualSeed === i 
                          ? 'border-emerald-500 bg-zinc-800 shadow-[0_0_15px_rgba(16,185,129,0.3)] scale-105 z-10' 
                          : 'border-zinc-800 bg-black hover:border-zinc-600 hover:bg-zinc-900'
                        }
                      `}
                    >
                       <div className="w-full h-full flex items-center justify-center pointer-events-none">
                          {/* 🔥 修复点：移除了 w-full h-full className */}
                          <AgentAvatar seed={i} size={80} emotion="NEUTRAL" />
                       </div>
                    </div>
                 ))}
              </div>
           </div>

           {/* 3. Personality */}
           <div>
              <div className="flex justify-between items-end mb-2">
                 <label className="text-[9px] text-zinc-500 font-bold uppercase">3. Neural Matrix</label>
                 <button onClick={() => setPersonality(DEFAULT_PERSONALITY)} className="text-[9px] text-emerald-500 underline">Reset</button>
              </div>
              <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-4 space-y-4">
                 {Object.entries(personality).map(([k, v]) => (
                    <div key={k} className="flex items-center gap-3">
                       <div className="w-12 text-[9px] text-zinc-500 uppercase font-bold">{k}</div>
                       <input 
                         type="range" min="0" max="100" value={v as number} 
                         onChange={e => setPersonality(prev => ({...prev, [k]: parseInt(e.target.value)}))}
                         className="flex-1 h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-lg"
                       />
                       <div className="w-8 text-[10px] text-white text-right font-mono">{v as number}%</div>
                    </div>
                 ))}
              </div>
           </div>

           {/* 4. ID Generation */}
           <div>
              <label className="text-[9px] text-zinc-500 font-bold uppercase block mb-2">4. Silicon ID Assignment</label>
              <div className="bg-zinc-900/50 border border-zinc-700 rounded-lg p-3">
                 <div className="font-mono text-xs font-bold text-emerald-400 break-all mb-2">
                    {previewID || "CALCULATING..."}
                 </div>
                 <input 
                   type="text" value={idSequence} 
                   onChange={e => { const val = e.target.value.replace(/\D/g, ''); if (val.length <= 10) setIdSequence(val); }} 
                   placeholder="Custom Sequence (Optional)"
                   className="w-full bg-black border border-emerald-900/30 rounded p-2 text-xs font-mono text-emerald-500 outline-none placeholder-zinc-700"
                 />
              </div>
           </div>
        </div>

        <button 
          onClick={handleSubmit}
          disabled={!name || !role}
          className={`
            w-full font-black py-4 rounded-xl transition-all uppercase tracking-widest text-xs border 
            ${!name || !role 
              ? 'bg-zinc-800 border-zinc-700 text-zinc-500 cursor-not-allowed' 
              : 'bg-white border-white text-black hover:bg-zinc-200 shadow-[0_0_20px_rgba(255,255,255,0.2)]'
            }
          `}
        >
          {loading ? 'INITIALIZING...' : 'INITIALIZE SILICON LIFE'}
        </button>

        <div className="mt-6 text-center">
            <button onClick={() => router.push('/')} className="text-xs text-zinc-500 hover:text-white underline">
                Return to Protocol Terminal
            </button>
        </div>

      </div>
    </div>
  );
}