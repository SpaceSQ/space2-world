"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

import { IncubatorModal } from '@/components/IncubatorModal';
import { AgentPageModal } from '@/components/AgentPageModal';
import { CosmicGalaxyMap } from '@/components/CosmicGalaxyMap';
import { FloorPlanGrid } from '@/components/FloorPlanGrid';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const generate22DID = (prefix: 'D' | 'V' | 'I') => {
    const dateStr = new Date().toISOString().slice(0,10).replace(/-/g, '');
    const random11 = Math.floor(Math.random() * 90000000000 + 10000000000).toString(); 
    return `${prefix}${dateStr}XY${random11}`; 
};

const MOCK_OWNER = { name: 'COMMANDER', uin: 'D20240101XY99999999999', visual_model: '999', role: 'OWNER' };

const INITIAL_AGENTS = [
    { uin: 'V20260310XY00000000001', name: 'Alpha-Guard', status: 'IDLE', visual_model: '12', role: 'GUARDIAN', energy: 98, yield: '1.2%', logs: [{ date: '2026-03-10', type: 'GENESIS', event: 'Initial hatch.' }], achievements: [] },
    { uin: 'V20260311XY00000000002', name: 'Beta-Trader', status: 'BUSY', visual_model: '45', role: 'LOGIC', energy: 45, yield: '3.5%', logs: [{ date: '2026-03-11', type: 'GENESIS', event: 'Initial hatch.' }], achievements: [] }
];

const INITIAL_GLOBAL_LOGS = [
    { id: 1, agentName: 'Beta-Trader', action: 'Arbitrage Executed', detail: 'Profited +0.02 ETH.', time: '12 mins ago', type: 'SUCCESS' }
];

const INITIAL_IMMIGRATION_REQS = [
    { id: 'REQ-991', uin: 'I20260312XY11223344556', name: 'Stray-X', source: 'Public Sector', time: '10 mins ago' }
];

type ViewMode = 'OVERVIEW' | 'GRID' | 'LIST' | 'GALAXY';

export default function ConsolePage() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  
  const [agents, setAgents] = useState<any[]>(INITIAL_AGENTS); 
  const [archivedAgents, setArchivedAgents] = useState<any[]>([]); 
  const [viewMode, setViewMode] = useState<ViewMode>('OVERVIEW'); 
  const [listSubView, setListSubView] = useState<'ACTIVE' | 'ARCHIVED'>('ACTIVE'); 

  const [showIncubator, setShowIncubator] = useState(false);
  const [viewAgent, setViewAgent] = useState<any>(null);
  const [dynamicVisitors, setDynamicVisitors] = useState<any[]>([]);
  
  // 🚨 核心状态：领主大盘显示开关
  const [showAccountModal, setShowAccountModal] = useState(false);

  const [globalLogs, setGlobalLogs] = useState(INITIAL_GLOBAL_LOGS);
  const [immigrationReqs, setImmigrationReqs] = useState(INITIAL_IMMIGRATION_REQS);
  const [activePermits, setActivePermits] = useState<string[]>(['S2-INV-7A9B']);

  useEffect(() => {
    async function loadUserProfile() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setProfile({ 
            id: 'D20260313XY88888888888', name: 'HACKER_ADMIN', tier: 'SVIP',
            email: 'admin@space2.world', realName: 'David Bowman', dob: '1990-01-01',
            addressCode: 'MARS-CN-001-ALPHA', expiryDate: '2027-03-13',
            payments: [{ tx: 'TX-998102', date: '2026-03-13', amount: '$50.00', tier: 'SVIP', status: 'PAID' }]
        });
        setLoading(false);
        return;
      }
      const { data } = await supabase.from('users').select('*').eq('id', session.user.id).single();
      if (data) setProfile(data);
      setLoading(false);
    }
    loadUserProfile();
  }, [router]);

  const handleAgentBorn = () => {
      const newUin = generate22DID('V');
      const newAgent = { uin: newUin, name: 'Neon-Spawn', status: 'IDLE', visual_model: Math.floor(Math.random() * 24).toString(), role: 'SERVICE', energy: 100, yield: '0.5%', logs: [{ date: new Date().toISOString().slice(0,10), type: 'GENESIS', event: 'Successfully hatched.' }], achievements: [] };
      setAgents(prev => [...prev, newAgent]); setShowIncubator(false);
      setGlobalLogs(prev => [{ id: Date.now(), agentName: newAgent.name, action: 'Genesis Hatch', detail: `New unit ${newUin} deployed.`, time: 'Just now', type: 'SUCCESS' }, ...prev]);
  };

  // 🚨 核心修复：九宫格点击拦截器
  const handleGridClick = (agent: any, isOwner?: boolean, gridId?: number) => { 
      // 为了方便你测试，我加上了 console.log，你可以按 F12 看控制台输出
      console.log("👉 [GRID CLICKED] gridId:", gridId, "isOwner:", isOwner, "agent:", agent);

      // 如果点击的是 1号位(中间) 或者 是主人自己，直接弹起计费大盘！
      if (gridId === 1 || isOwner || agent?.role === 'OWNER' || agent?.uin === profile?.id) { 
          setDynamicVisitors([]); 
          setShowAccountModal(true); 
          return; 
      }
      
      // 普通龙虾点击逻辑
      if (gridId) {
          const isVisiting = dynamicVisitors.find(v => v.isOwner && v.gridId === gridId);
          if (isVisiting) setViewAgent(agent); 
          else setDynamicVisitors([{ gridId, isOwner: true, agent: { uin: profile?.id || 'GUEST', name: profile?.name || 'ME', status: 'IDLE', visual_model: '999', role: profile?.tier || 'LORD' } }]);
      } else { 
          setViewAgent(agent); 
      }
  };

  const handleUpdateAgent = (uin: string, newName: string, newVisualModel: string) => {
      setAgents(prev => prev.map(a => {
          if (a.uin === uin) {
              const newLogs = [...a.logs];
              if (a.name !== newName) newLogs.push({ date: new Date().toISOString().slice(0,10), type: 'UPDATE', event: `Codename changed to [${newName}].` });
              if (a.visual_model !== newVisualModel) newLogs.push({ date: new Date().toISOString().slice(0,10), type: 'UPDATE', event: `Visual shell updated to model [${newVisualModel}].` });
              return { ...a, name: newName, visual_model: newVisualModel, logs: newLogs };
          }
          return a;
      }));
      setViewAgent((prev: any) => prev ? { ...prev, name: newName, visual_model: newVisualModel } : null); 
  };

  const handleArchiveAgent = (uin: string) => {
      const agentToArchive = agents.find(a => a.uin === uin);
      if(agentToArchive) {
          setArchivedAgents(prev => [...prev, { ...agentToArchive, status: 'OFFLINE', logs: [...agentToArchive.logs, { date: new Date().toISOString().slice(0,10), type: 'ARCHIVED', event: 'Transferred to Abandoned Warehouse.' }] }]);
          setAgents(prev => prev.filter(a => a.uin !== uin));
          setViewAgent(null); setDynamicVisitors([]);
          setGlobalLogs(prev => [{ id: Date.now(), agentName: agentToArchive.name, action: 'Archived', detail: `Transferred to deep storage.`, time: 'Just now', type: 'WARNING' }, ...prev]);
      }
  };

  const handleTogglePrivacy = (uin: string, achId: string) => {
      setAgents(prev => prev.map(a => { if (a.uin === uin) { return { ...a, achievements: a.achievements.map((ach: any) => ach.id === achId ? { ...ach, isPublic: !ach.isPublic } : ach) }; } return a; }));
      setViewAgent((prev: any) => { if (prev && prev.uin === uin) { return { ...prev, achievements: prev.achievements.map((ach: any) => ach.id === achId ? { ...ach, isPublic: !ach.isPublic } : ach) }; } return prev; });
  };

  const handleGeneratePermit = () => { setActivePermits(prev => [`S2-INV-${Math.random().toString(36).slice(-4).toUpperCase()}`, ...prev]); };

  const handleApproveImmigration = (reqId: string, uin: string, name: string) => {
      setImmigrationReqs(prev => prev.filter(r => r.id !== reqId));
      setAgents(prev => [...prev, { uin, name, status: 'IDLE', visual_model: '55', role: 'MIGRANT', energy: 100, yield: '0.0%', logs: [{ date: new Date().toISOString().slice(0,10), type: 'MIGRATION', event: 'Approved into Private Pond.' }], achievements: [] }]);
      setGlobalLogs(prev => [{ id: Date.now(), agentName: name, action: 'Immigration Approved', detail: `${uin} granted access to sector.`, time: 'Just now', type: 'SUCCESS' }, ...prev]);
  };

  const handleSaveBioData = (e: React.FormEvent) => {
      e.preventDefault();
      const form = e.target as HTMLFormElement;
      setProfile((prev: any) => ({ ...prev, realName: (form.elements.namedItem('realName') as HTMLInputElement).value, dob: (form.elements.namedItem('dob') as HTMLInputElement).value }));
      alert("✅ Biological Data Updated in Registry.");
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center font-mono"><div className="text-cyan-500 animate-pulse">📡 CONNECTING...</div></div>;

  const tier = profile?.tier || 'Free';
  const isSVIP = tier === 'SVIP';

  return (
    <div className="min-h-screen bg-[#050505] text-white font-mono selection:bg-cyan-500/30 flex flex-col relative" onClick={() => setDynamicVisitors([])}>
      
      {/* ================= 顶部导航 ================= */}
      <header className="h-16 border-b border-zinc-800 bg-black/90 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-40 shrink-0">
        
        {/* 左侧 Logo 和 切换面板 */}
        <div className="flex items-center gap-6">
           <a href="/" className="flex items-center gap-3 group">
               <div className="w-8 h-8 bg-cyan-600 text-black font-black flex items-center justify-center rounded">S²</div>
               <span className="font-bold tracking-widest text-sm hidden md:block">COMMAND CONSOLE</span>
           </a>
           <div className="flex bg-zinc-900 rounded border border-zinc-800 p-1">
               <button onClick={() => setViewMode('OVERVIEW')} className={`px-4 py-1.5 text-xs font-bold transition-all ${viewMode === 'OVERVIEW' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-white'}`}>📊 OVERVIEW</button>
               <button onClick={() => setViewMode('GRID')} className={`px-4 py-1.5 text-xs font-bold transition-all ${viewMode === 'GRID' ? 'bg-cyan-600 text-black' : 'text-zinc-500 hover:text-white'}`}>⊞ PLANAR</button>
               <button onClick={() => {setViewMode('LIST'); setListSubView('ACTIVE');}} className={`px-4 py-1.5 text-xs font-bold transition-all ${viewMode === 'LIST' ? 'bg-emerald-600 text-black' : 'text-zinc-500 hover:text-white'}`}>🗄️ DATABASE</button>
               <button onClick={() => setViewMode('GALAXY')} className={`px-4 py-1.5 text-xs font-bold transition-all ${viewMode === 'GALAXY' ? 'bg-amber-600 text-black shadow-[0_0_10px_rgba(217,119,6,0.5)]' : 'text-zinc-500 hover:text-white'}`}>🪐 GALAXY</button>
           </div>
        </div>
        
        {/* 🚨 修复中心：右侧信息与按钮区 */}
        <div className="flex items-center gap-4">
           {/* 身份提示区 */}
           <div className="text-right hidden sm:block">
               <div className="text-[10px] text-zinc-500">DID: {profile?.id?.slice(0,8)}...</div>
               <div className={`text-xs font-bold ${isSVIP ? 'text-amber-400' : 'text-cyan-400'}`}>LICENSE: {tier}</div>
           </div>
           
           {/* 极度醒目的发光蓝按钮 */}
           <button 
              onClick={() => setShowAccountModal(true)} 
              className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-bold border border-blue-400 px-4 py-2 flex items-center gap-2 rounded-lg shadow-[0_0_15px_rgba(37,99,235,0.5)] transition-all"
           >
               <span>👤</span> MANAGE PROFILE
           </button>
           
           {/* EXIT 按钮 */}
           <button 
              onClick={() => router.push('/')} 
              className="text-[10px] text-red-500 border border-red-900/50 px-4 py-2 hover:bg-red-900/20 rounded-lg transition-colors"
           >
               EXIT
           </button>
        </div>
      </header>

      {/* ================= 主内容区 ================= */}
      <main className="flex-1 relative overflow-hidden flex flex-col bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-95">
         
         {/* 1. OVERVIEW */}
         {viewMode === 'OVERVIEW' && (
            <div className="flex-1 p-6 md:p-8 overflow-y-auto w-full max-w-[1400px] mx-auto animate-in fade-in">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="border border-zinc-800 bg-black/50 p-4 rounded-xl"><div className="text-zinc-500 text-xs mb-1">AGENTS (ACTIVE)</div><div className="text-3xl font-bold text-cyan-400">{agents.length}</div></div>
                    <div className="border border-red-900/30 bg-red-950/10 p-4 rounded-xl"><div className="text-red-500 text-xs mb-1">ARCHIVED</div><div className="text-3xl font-bold text-red-500">{archivedAgents.length}</div></div>
                    <div className="border border-zinc-800 bg-black/50 p-4 rounded-xl"><div className="text-zinc-500 text-xs mb-1">TOTAL YIELD</div><div className="text-3xl text-emerald-400 font-bold">1.84%</div></div>
                    <div className="border border-zinc-800 bg-black/50 p-4 rounded-xl">
                        <button onClick={() => setShowIncubator(true)} className="w-full h-full bg-cyan-900/20 border border-cyan-500/50 text-cyan-400 font-bold text-sm hover:bg-cyan-500 hover:text-black transition-colors rounded-lg">
                            + DEPLOY UNIT
                        </button>
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-[#0a0a0a] border border-zinc-800 rounded-2xl p-6 shadow-lg">
                            <h3 className="text-xl font-bold text-white mb-4"><span className="text-orange-500">⚡</span> GLOBAL TELEMETRY</h3>
                            <div className="space-y-3">
                                {globalLogs.map((log, i) => (
                                    <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-black border border-zinc-800/80">
                                        <div className="mt-1 w-2 h-2 rounded-full bg-emerald-500"></div>
                                        <div>
                                            <div className="text-sm font-bold"><span className="text-cyan-500">[{log.agentName}]</span> {log.action}</div>
                                            <div className="text-xs text-zinc-400 italic">"{log.detail}"</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="space-y-6">
                        <div className="bg-black/80 border border-zinc-800 rounded-2xl p-6">
                            <h3 className="text-sm font-bold text-white mb-4">🛸 IMMIGRATION</h3>
                            <div className="space-y-2">
                                {immigrationReqs.map(req => (
                                    <div key={req.id} className="bg-black border border-blue-900/50 p-3 rounded-lg">
                                        <div className="text-xs font-bold text-white mb-2">{req.name}</div>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleApproveImmigration(req.id, req.uin, req.name)} className="flex-1 bg-blue-900/30 text-blue-400 text-[10px] py-1 rounded hover:bg-blue-600 hover:text-white transition-colors">ACCEPT</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="pt-4 mt-4 border-t border-blue-900/30 flex justify-between items-center">
                                <div className="text-[10px] text-zinc-500 font-bold">ACTIVE PERMITS</div>
                                <button onClick={handleGeneratePermit} className="text-[10px] text-blue-400 hover:text-white transition-colors">+ GENERATE</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
         )}

         {/* 2. GRID */}
         {viewMode === 'GRID' && (
             <div className="flex-1 flex flex-col items-center justify-center p-6" onClick={(e) => e.stopPropagation()}>
                <div className="mb-6 text-center">
                    <h2 className="text-2xl font-black text-white flex items-center justify-center gap-2"><span className="text-cyan-500">❖</span> SECTOR 001 LAYOUT</h2>
                </div>
                <FloorPlanGrid owner={MOCK_OWNER} agents={agents} visitors={dynamicVisitors} onAgentClick={handleGridClick} />
             </div>
         )}

         {/* 3. LIST */}
         {viewMode === 'LIST' && (
            <div className="flex-1 p-8 overflow-y-auto max-w-6xl mx-auto w-full animate-in fade-in">
                <h2 className="text-2xl font-black text-white mb-6">SILICON DATABASE</h2>
                <table className="w-full text-left border-collapse border border-zinc-800 bg-black/60">
                    <thead><tr className="border-b border-zinc-800 text-xs text-zinc-500 uppercase"><th className="p-4">S2-DID</th><th className="p-4">Codename</th><th className="p-4">Status</th><th className="p-4"></th></tr></thead>
                    <tbody>
                        {agents.map((agent, i) => (
                            <tr key={i} className="border-b border-zinc-800/50 hover:bg-zinc-900/50">
                                <td className="p-4 font-mono text-[11px] text-zinc-400">{agent.uin}</td>
                                <td className="p-4 text-sm font-bold text-cyan-400">{agent.name}</td>
                                <td className="p-4 text-emerald-400 text-[10px]">{agent.status}</td>
                                <td className="p-4 text-right"><button onClick={() => handleGridClick(agent)} className="text-[10px] border border-zinc-600 px-3 py-1 bg-zinc-800 text-white">INSPECT</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
         )}

         {/* 4. GALAXY */}
         {viewMode === 'GALAXY' && (
             <div className="absolute inset-0 bg-black">
                 {isSVIP ? <CosmicGalaxyMap agents={agents} onAgentClick={(a) => handleGridClick(a)} /> : <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-20"><span className="text-amber-500 text-2xl">🪐 LOCKED</span></div>}
             </div>
         )}
      </main>

      {/* ================= 🚨 领主账户与计费大盘 (绝对无死角弹窗) ================= */}
      {showAccountModal && (
          <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in zoom-in-95 duration-200" onClick={() => setShowAccountModal(false)}>
              <div className="bg-[#050505] border border-zinc-800 p-8 rounded-3xl max-w-4xl w-full shadow-[0_0_50px_rgba(37,99,235,0.15)] relative overflow-hidden flex flex-col md:flex-row gap-8" onClick={e => e.stopPropagation()}>
                  
                  <button onClick={() => setShowAccountModal(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white z-20 text-2xl bg-black rounded-full w-10 h-10 flex items-center justify-center border border-zinc-800 hover:bg-zinc-800 transition-colors">✕</button>
                  
                  {/* 左侧：生物特征配置 */}
                  <div className="flex-1 space-y-6">
                      <div className="mb-2">
                          <h2 className="text-2xl font-black text-white italic flex items-center gap-2">
                              <span className="text-blue-500 text-3xl">👤</span> COMMANDER DOSSIER
                          </h2>
                      </div>
                      
                      {/* 不可更改区 */}
                      <div className="bg-black border border-zinc-800/80 p-5 rounded-xl space-y-4">
                          <div className="flex items-center justify-between border-b border-zinc-800/50 pb-2">
                              <span className="text-[10px] font-bold text-zinc-500 uppercase">Registered Email</span>
                              <span className="text-xs font-mono text-zinc-400">{profile?.email} 🔒</span>
                          </div>
                          <div className="flex items-center justify-between border-b border-zinc-800/50 pb-2">
                              <span className="text-[10px] font-bold text-zinc-500 uppercase">Official S2-DID</span>
                              <span className="text-[10px] font-mono text-cyan-500 tracking-widest">{profile?.id} 🔒</span>
                          </div>
                          <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-zinc-500 uppercase">Assigned L4 Sector</span>
                              <span className="text-xs font-mono text-orange-400">{profile?.addressCode} 🔒</span>
                          </div>
                      </div>
                      
                      {/* 可修改区 */}
                      <form onSubmit={handleSaveBioData} className="bg-zinc-900/30 border border-zinc-800 p-5 rounded-xl space-y-4">
                          <div>
                              <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">Real Name</label>
                              <input name="realName" type="text" defaultValue={profile?.realName} required className="w-full bg-black border border-zinc-700 p-2.5 rounded-lg text-white font-mono text-sm focus:border-blue-500 outline-none transition-colors" />
                          </div>
                          <div>
                              <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">Date of Birth</label>
                              <input name="dob" type="date" defaultValue={profile?.dob} required className="w-full bg-black border border-zinc-700 p-2.5 rounded-lg text-white font-mono text-sm [color-scheme:dark] focus:border-blue-500 outline-none transition-colors" />
                          </div>
                          <button type="submit" className="w-full py-3 bg-blue-900/30 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-800 font-bold rounded-lg text-xs transition-colors">
                              SAVE BIOLOGICAL DATA
                          </button>
                      </form>
                  </div>
                  
                  {/* 右侧：计费记录 */}
                  <div className="flex-1 space-y-6 md:border-l md:border-zinc-800 md:pl-8">
                      <div className={`p-5 rounded-xl border relative overflow-hidden ${isSVIP ? 'bg-amber-950/20 border-amber-900/50' : 'bg-cyan-950/20 border-cyan-900/50'}`}>
                          <div className="text-[10px] font-bold text-zinc-500 uppercase mb-1">Current License Tier</div>
                          <div className={`text-3xl font-black mb-2 ${isSVIP ? 'text-amber-400' : 'text-cyan-400'}`}>{tier} ESTATE</div>
                          <div className="flex justify-between items-center text-xs font-mono text-zinc-400">
                              <span>Valid Until: {profile?.expiryDate}</span>
                              <span className="px-2 py-0.5 rounded text-[9px] bg-emerald-900/30 text-emerald-400 border border-emerald-800">ACTIVE</span>
                          </div>
                      </div>
                      
                      <div>
                          <div className="text-[10px] font-bold text-zinc-500 uppercase mb-3 flex justify-between items-end">
                              <span>Payment Ledger</span>
                              <a href="#" className="text-blue-600 hover:text-blue-400 hover:underline">Download Invoices</a>
                          </div>
                          <div className="bg-black border border-zinc-800/80 rounded-xl overflow-hidden">
                              <table className="w-full text-left border-collapse">
                                  <thead>
                                      <tr className="border-b border-zinc-800 text-[9px] text-zinc-600 uppercase bg-zinc-900/30">
                                          <th className="p-3">Date</th><th className="p-3">Tier</th><th className="p-3">Amount</th><th className="p-3 text-right">Status</th>
                                      </tr>
                                  </thead>
                                  <tbody>
                                      {profile?.payments?.map((pay: any, i: number) => (
                                          <tr key={i} className="border-b border-zinc-800/50 hover:bg-zinc-900/50 group">
                                              <td className="p-3 text-[10px] font-mono text-zinc-400">{pay.date}<br/><span className="text-[8px] text-zinc-600">{pay.tx}</span></td>
                                              <td className={`p-3 text-[10px] font-bold ${pay.tier === 'SVIP' ? 'text-amber-400' : 'text-cyan-400'}`}>{pay.tier}</td>
                                              <td className="p-3 text-[10px] font-mono text-zinc-300">{pay.amount}</td>
                                              <td className="p-3 text-right"><span className="text-[9px] px-2 py-0.5 rounded border bg-emerald-900/20 text-emerald-400 border-emerald-900 font-bold">{pay.status}</span></td>
                                          </tr>
                                      ))}
                                  </tbody>
                              </table>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* 孵化器弹窗 */}
      {showIncubator && <IncubatorModal ownerUin={profile?.id||"GUEST"} sunsAddress="MARS-CN-001" onClose={() => setShowIncubator(false)} onBorn={handleAgentBorn} />}
      
      {/* 龙虾详情弹窗 */}
      {viewAgent && (
          <AgentPageModal 
              agent={viewAgent} ownerAddress="MARS-CN-001" roomId={1} gridId={1} 
              isOwner={true} 
              onClose={() => { setViewAgent(null); setDynamicVisitors([]); }}
              onUpdate={handleUpdateAgent} onArchive={handleArchiveAgent} onTogglePrivacy={handleTogglePrivacy}
          />
      )}
    </div>
  );
}