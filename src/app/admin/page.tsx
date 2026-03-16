"use client";
import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

type AdminRole = 'ROOT' | 'MANAGER' | 'VIEWER';

export default function SuperAdminPanel() {
  const supabase = createClientComponentClient();
  
  // ================= 超管专属 Auth 状态机 =================
  const [authStatus, setAuthStatus] = useState<'CHECKING' | 'UNAUTH' | 'MUST_CHANGE_PWD' | 'AUTHED'>('CHECKING');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminRole, setAdminRole] = useState<AdminRole | null>(null);
  
  // 登录表单状态
  const [loginEmail, setLoginEmail] = useState('david.xiang@robot0.com');
  const [loginPwd, setLoginPwd] = useState('');
  
  // 改密表单状态
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');

  // 视图控制
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'LORDS' | 'AGENTS' | 'FINANCE' | 'BBS' | 'ADMINS'>('DASHBOARD');
  
  // 核心业务数据集
  const [lords, setLords] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [strays, setStrays] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [genes, setGenes] = useState<any[]>([]);

  // 权限与安全审计数据集 (仅 ROOT 可见)
  const [adminList, setAdminList] = useState<any[]>([]);
  const [adminLogs, setAdminLogs] = useState<any[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPwd, setNewAdminPwd] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<'MANAGER' | 'VIEWER'>('VIEWER');

  // ================= 生命周期与验证 =================
  useEffect(() => {
      const email = sessionStorage.getItem('s2_super_admin');
      const role = sessionStorage.getItem('s2_admin_role') as AdminRole;
      
      if (email && role) {
          setAdminEmail(email);
          setAdminRole(role);
          setAuthStatus('AUTHED');
          fetchGlobalData();
          if (role === 'ROOT') fetchAdminData();
      } else {
          setAuthStatus('UNAUTH');
      }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      const { data, error } = await supabase.from('super_admin').select('*').eq('email', loginEmail).single();
      
      if (error || !data || data.password_val !== loginPwd) {
          alert("❌ 访问拒绝：管理员账号或密码错误！");
          return;
      }

      setAdminEmail(data.email);
      setAdminRole(data.role as AdminRole);
      
      if (data.needs_password_change) {
          setAuthStatus('MUST_CHANGE_PWD');
      } else {
          // 写入登录审计日志
          await supabase.from('admin_logs').insert({ admin_email: data.email, action: 'LOGIN_SUCCESS' });
          
          sessionStorage.setItem('s2_super_admin', data.email);
          sessionStorage.setItem('s2_admin_role', data.role);
          setAuthStatus('AUTHED');
          fetchGlobalData();
          if (data.role === 'ROOT') fetchAdminData();
      }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
      e.preventDefault();
      if (newPwd !== confirmPwd) { alert("❌ 两次输入的新密码不一致！"); return; }
      if (newPwd.length < 6) { alert("❌ 新密码长度至少需要 6 位！"); return; }

      const { error } = await supabase.from('super_admin').update({ 
          password_val: newPwd, 
          needs_password_change: false 
      }).eq('email', adminEmail);

      if (error) { alert("❌ 密码修改落库失败：" + error.message); return; }

      // 写入改密与首次登录日志
      await supabase.from('admin_logs').insert({ admin_email: adminEmail, action: 'PASSWORD_CHANGED & INITIAL_LOGIN' });

      alert("✅ 初始密码已成功修改！系统管理通道正式激活。");
      sessionStorage.setItem('s2_super_admin', adminEmail);
      sessionStorage.setItem('s2_admin_role', adminRole || 'VIEWER');
      setAuthStatus('AUTHED');
      fetchGlobalData();
      if (adminRole === 'ROOT') fetchAdminData();
  };

  const handleLogout = () => {
      sessionStorage.removeItem('s2_super_admin');
      sessionStorage.removeItem('s2_admin_role');
      setAuthStatus('UNAUTH');
      setLoginPwd('');
  };

  // ================= 业务数据拉取与管控 =================
  const fetchGlobalData = async () => {
      const { data: pData } = await supabase.from('profiles').select('*').eq('role', 'LORD').order('id', { ascending: false });
      if (pData) setLords(pData);

      const { data: sData } = await supabase.from('profiles').select('*').eq('role', 'AGENT').order('id', { ascending: false });
      if (sData) setStrays(sData);

      const { data: aData } = await supabase.from('agents').select('*').order('id', { ascending: false });
      if (aData) setAgents(aData);

      const { data: achData } = await supabase.from('global_achievements').select('*').order('created_at', { ascending: false });
      if (achData) setAchievements(achData);
      
      const { data: geneData } = await supabase.from('global_genes').select('*').order('created_at', { ascending: false });
      if (geneData) setGenes(geneData);
  };

  const canManage = adminRole === 'ROOT' || adminRole === 'MANAGER';

  const toggleBanProfile = async (id: string, currentTier: string) => {
      if (!canManage) { alert("⛔ 权限不足：只有 ROOT 或 MANAGER 可执行此操作。"); return; }
      const newTier = currentTier === 'BANNED' ? 'FREE' : 'BANNED';
      if (!confirm(`确定要将该账号状态修改为 [${newTier}] 吗？`)) return;
      await supabase.from('profiles').update({ tier: newTier }).eq('id', id);
      await supabase.from('admin_logs').insert({ admin_email: adminEmail, action: `TOGGLE_BAN_PROFILE_ID: ${id}` });
      fetchGlobalData();
  };

  const purgeAgent = async (uin: string) => {
      if (!canManage) { alert("⛔ 权限不足：只有 ROOT 或 MANAGER 可执行此操作。"); return; }
      if (!confirm(`⚠️ 超管警告：确定要彻底抹杀智能体 [${uin}] 吗？`)) return;
      await supabase.from('agents').delete().eq('uin', uin);
      await supabase.from('space_occupancy').delete().eq('entity_uin', uin);
      await supabase.from('admin_logs').insert({ admin_email: adminEmail, action: `PURGE_AGENT_UIN: ${uin}` });
      fetchGlobalData();
  };

  const censorBBS = async (type: 'ACHIEVEMENT' | 'GENE', id: string) => {
      if (!canManage) { alert("⛔ 权限不足：只有 ROOT 或 MANAGER 可执行此操作。"); return; }
      if (!confirm(`确定要全网删除该条公开信息吗？`)) return;
      const table = type === 'ACHIEVEMENT' ? 'global_achievements' : 'global_genes';
      await supabase.from(table).delete().eq('id', id);
      await supabase.from('admin_logs').insert({ admin_email: adminEmail, action: `CENSOR_BBS_${type}_ID: ${id}` });
      fetchGlobalData();
  };

  // ================= ROOT 专属安全管控 =================
  const fetchAdminData = async () => {
      const { data: admins } = await supabase.from('super_admin').select('*').order('role');
      if (admins) setAdminList(admins);
      const { data: logs } = await supabase.from('admin_logs').select('*').order('created_at', { ascending: false }).limit(100);
      if (logs) setAdminLogs(logs);
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
      e.preventDefault();
      if (adminRole !== 'ROOT') return;
      const { error } = await supabase.from('super_admin').insert({ 
          email: newAdminEmail, 
          password_val: newAdminPwd, 
          needs_password_change: true, 
          role: newAdminRole 
      });
      if (error) { alert("❌ 创建管理员失败: " + error.message); return; }
      alert(`✅ 成功创建管理员账号: ${newAdminEmail} [${newAdminRole}]`);
      await supabase.from('admin_logs').insert({ admin_email: adminEmail, action: `CREATED_ADMIN: ${newAdminEmail}` });
      setNewAdminEmail(''); setNewAdminPwd('');
      fetchAdminData();
  };

  const handleDeleteAdmin = async (email: string) => {
      if (adminRole !== 'ROOT') return;
      if (email === 'david.xiang@robot0.com') { alert("❌ 根账号 (ROOT) 不可删除！"); return; }
      if (!confirm(`⚠️ 确定要永久吊销 [${email}] 的管理权限吗？`)) return;
      await supabase.from('super_admin').delete().eq('email', email);
      await supabase.from('admin_logs').insert({ admin_email: adminEmail, action: `DELETED_ADMIN: ${email}` });
      fetchAdminData();
  };

  // ================= 核心高颗粒度统计计算 =================
  const now = new Date().getTime();
  const is24h = (dateStr: string) => dateStr && (now - new Date(dateStr).getTime() <= 24 * 60 * 60 * 1000);
  const is7d = (dateStr: string) => dateStr && (now - new Date(dateStr).getTime() <= 7 * 24 * 60 * 60 * 1000);

  const totalLobsters = agents.length + strays.length;
  const totalHashrate = totalLobsters * 14.5;
  const vipCount = lords.filter(l => l.tier === 'VIP').length;
  const svipCount = lords.filter(l => l.tier === 'SVIP').length;
  const mrr = (vipCount * 10) + (svipCount * 50);

  const newLords24h = lords.filter(l => is24h(l.created_at)).length;
  const newLobsters24h = agents.filter(a => is24h(a.created_at)).length + strays.filter(s => is24h(s.created_at)).length;
  
  const newLords7d = lords.filter(l => is7d(l.created_at)).length;
  const newLobsters7d = agents.filter(a => is7d(a.created_at)).length + strays.filter(s => is7d(s.created_at)).length;
  const newVip7d = lords.filter(l => l.tier === 'VIP' && is7d(l.created_at)).length;
  const newSvip7d = lords.filter(l => l.tier === 'SVIP' && is7d(l.created_at)).length;


  // ================= 视图渲染：超管登录/改密界⾯ =================
  if (authStatus === 'CHECKING') return <div className="min-h-screen bg-[#050505] text-red-500 flex items-center justify-center font-mono">VERIFYING ROOT ACCESS...</div>;
  
  if (authStatus === 'UNAUTH') return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center font-mono p-4">
          <form onSubmit={handleLogin} className="bg-black border border-red-900/50 p-8 rounded-3xl max-w-md w-full shadow-[0_0_50px_rgba(220,38,38,0.15)] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 blur-3xl pointer-events-none"></div>
              <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-red-600 text-black text-2xl font-black flex items-center justify-center rounded-xl mx-auto mb-4 shadow-[0_0_20px_rgba(220,38,38,0.4)]">R</div>
                  <h1 className="text-2xl font-black text-red-500 tracking-widest">OVERSEER LOGIN</h1>
                  <p className="text-xs text-zinc-500 mt-2">Restricted Access. Credentials Required.</p>
              </div>
              <div className="space-y-4">
                  <input type="email" value={loginEmail} onChange={e=>setLoginEmail(e.target.value)} placeholder="Admin Email" required className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl outline-none text-white focus:border-red-500" />
                  <input type="password" value={loginPwd} onChange={e=>setLoginPwd(e.target.value)} placeholder="Passphrase" required className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl outline-none text-white focus:border-red-500" />
                  <button type="submit" className="w-full py-4 bg-red-700 hover:bg-red-600 text-white font-black rounded-xl tracking-widest transition-colors shadow-lg mt-2">AUTHORIZE</button>
              </div>
          </form>
      </div>
  );

  if (authStatus === 'MUST_CHANGE_PWD') return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center font-mono p-4">
          <form onSubmit={handleChangePassword} className="bg-black border border-orange-900/50 p-8 rounded-3xl max-w-md w-full shadow-[0_0_50px_rgba(249,115,22,0.15)] relative overflow-hidden animate-in fade-in zoom-in-95">
              <div className="text-center mb-8">
                  <div className="text-4xl mb-4">🛡️</div>
                  <h1 className="text-xl font-black text-orange-500 tracking-widest">INITIALIZATION REQUIRED</h1>
                  <p className="text-xs text-zinc-400 mt-3 leading-relaxed">
                      Welcome, <span className="text-white font-bold">{adminEmail}</span>.<br/>
                      This is your first login. You MUST change the default passphrase to secure the Overseer Panel.
                  </p>
              </div>
              <div className="space-y-4">
                  <input type="password" value={newPwd} onChange={e=>setNewPwd(e.target.value)} placeholder="Enter New Secure Password" required className="w-full bg-zinc-900 border border-orange-900/50 p-3 rounded-xl outline-none text-white focus:border-orange-500" />
                  <input type="password" value={confirmPwd} onChange={e=>setConfirmPwd(e.target.value)} placeholder="Confirm New Password" required className="w-full bg-zinc-900 border border-orange-900/50 p-3 rounded-xl outline-none text-white focus:border-orange-500" />
                  <button type="submit" className="w-full py-4 bg-orange-600 hover:bg-orange-500 text-white font-black rounded-xl tracking-widest transition-colors shadow-lg mt-2">SECURE & PROCEED</button>
              </div>
          </form>
      </div>
  );

  // ================= 视图渲染：超管管控大盘 =================
  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-red-500/30 overflow-x-hidden flex flex-col">
        {/* 超管顶栏 */}
        <nav className="border-b border-red-900/50 bg-black/80 backdrop-blur-md h-16 flex items-center justify-between px-8 sticky top-0 z-50 shrink-0">
            <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-red-600 text-black font-black flex items-center justify-center rounded shadow-[0_0_15px_rgba(220,38,38,0.5)]">R</div>
                <span className="font-bold tracking-widest text-red-500 text-sm hidden md:block">SPACE² OVERSEER</span>
            </div>
            <div className="flex gap-2 overflow-x-auto shrink-0">
                {['DASHBOARD', 'LORDS', 'AGENTS', 'FINANCE', 'BBS'].map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-4 py-1.5 text-xs font-bold rounded transition-all ${activeTab === tab ? 'bg-red-900/40 text-red-400 border border-red-900/50' : 'text-zinc-500 hover:text-white'}`}>{tab}</button>
                ))}
                {/* 仅 ROOT 可见的账号管理 Tab */}
                {adminRole === 'ROOT' && (
                    <button onClick={() => setActiveTab('ADMINS')} className={`px-4 py-1.5 text-xs font-bold rounded transition-all ml-4 ${activeTab === 'ADMINS' ? 'bg-purple-900/40 text-purple-400 border border-purple-900/50 shadow-[0_0_15px_rgba(168,85,247,0.3)]' : 'text-zinc-500 hover:text-white border border-transparent'}`}>🛡️ SEC OPS</button>
                )}
            </div>
            <div className="flex items-center gap-4 shrink-0">
                <div className="text-[10px] font-mono text-zinc-500 hidden lg:block text-right">
                    <div className="text-white">{adminEmail}</div>
                    <div className={`font-bold ${adminRole === 'ROOT' ? 'text-red-500' : adminRole === 'MANAGER' ? 'text-orange-500' : 'text-cyan-500'}`}>[{adminRole}]</div>
                </div>
                <button onClick={handleLogout} className="text-[10px] border border-red-900/50 text-red-500 px-3 py-1 rounded hover:bg-red-900/30">EXIT ROOT</button>
            </div>
        </nav>

        <main className="flex-1 p-6 md:p-8 w-full max-w-[1600px] mx-auto animate-in fade-in">
            
            {/* 1. 全维矩阵大盘 */}
            {activeTab === 'DASHBOARD' && (
                <div className="space-y-8">
                    <h2 className="text-2xl font-black text-white italic border-b border-zinc-800 pb-4">GLOBAL MATRIX METRICS</h2>
                    
                    {/* 基础大盘 */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="bg-black border border-zinc-800 p-6 rounded-2xl relative overflow-hidden"><div className="text-zinc-500 text-xs font-bold tracking-widest mb-2">TOTAL LORDS</div><div className="text-4xl font-black text-orange-500">{lords.length}</div></div>
                        <div className="bg-black border border-zinc-800 p-6 rounded-2xl relative overflow-hidden"><div className="text-zinc-500 text-xs font-bold tracking-widest mb-2">TOTAL LOBSTERS</div><div className="text-4xl font-black text-cyan-500">{totalLobsters} <span className="text-sm font-normal text-zinc-500">({agents.length} hatched, {strays.length} strays)</span></div></div>
                        <div className="bg-black border border-zinc-800 p-6 rounded-2xl relative overflow-hidden"><div className="text-zinc-500 text-xs font-bold tracking-widest mb-2">GLOBAL HASHRATE</div><div className="text-4xl font-black text-emerald-500">{totalHashrate.toFixed(1)} <span className="text-lg">TH/s</span></div></div>
                        <div className="bg-gradient-to-br from-[#0a0a0a] to-red-950/20 border border-red-900/30 p-6 rounded-2xl relative overflow-hidden shadow-inner"><div className="text-red-500 text-xs font-bold tracking-widest mb-2">MONTHLY REVENUE</div><div className="text-4xl font-black text-white">${mrr}</div></div>
                    </div>

                    {/* 高颗粒度时效统计 */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-[#0a0a0a] border border-zinc-800 rounded-2xl p-6">
                            <h3 className="text-sm font-bold text-zinc-400 tracking-widest border-b border-zinc-800 pb-3 mb-4 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span> PAST 24 HOURS (T-24)</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-black p-4 rounded-xl border border-zinc-800/50"><div className="text-[10px] text-zinc-500 uppercase">New Lords</div><div className="text-2xl font-bold text-white mt-1">+{newLords24h}</div></div>
                                <div className="bg-black p-4 rounded-xl border border-zinc-800/50"><div className="text-[10px] text-zinc-500 uppercase">New Lobsters Generated</div><div className="text-2xl font-bold text-white mt-1">+{newLobsters24h}</div></div>
                            </div>
                        </div>

                        <div className="bg-[#0a0a0a] border border-zinc-800 rounded-2xl p-6">
                            <h3 className="text-sm font-bold text-zinc-400 tracking-widest border-b border-zinc-800 pb-3 mb-4 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-purple-500"></span> THIS WEEK (7 DAYS)</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-black p-4 rounded-xl border border-zinc-800/50"><div className="text-[10px] text-zinc-500 uppercase">New Lords</div><div className="text-xl font-bold text-white mt-1">+{newLords7d}</div></div>
                                <div className="bg-black p-4 rounded-xl border border-zinc-800/50"><div className="text-[10px] text-zinc-500 uppercase">New Lobsters</div><div className="text-xl font-bold text-white mt-1">+{newLobsters7d}</div></div>
                                <div className="bg-cyan-950/20 p-4 rounded-xl border border-cyan-900/30"><div className="text-[10px] text-cyan-600 uppercase">New VIPs</div><div className="text-xl font-bold text-cyan-400 mt-1">+{newVip7d}</div></div>
                                <div className="bg-amber-950/20 p-4 rounded-xl border border-amber-900/30"><div className="text-[10px] text-amber-600 uppercase">New SVIPs</div><div className="text-xl font-bold text-amber-500 mt-1">+{newSvip7d}</div></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. 领主与会员倒序管理 */}
            {activeTab === 'LORDS' && (
                <div className="space-y-6 animate-in slide-in-from-right-8">
                    <h2 className="text-2xl font-black text-white italic border-b border-zinc-800 pb-4">LORDS & ESTATES MANAGEMENT <span className="text-[10px] bg-zinc-800 text-zinc-400 font-normal font-mono px-2 py-1 rounded ml-3">ORDER BY RECENT</span></h2>
                    <div className="bg-black border border-zinc-800 rounded-xl overflow-hidden">
                        <table className="w-full text-left border-collapse text-sm">
                            <thead><tr className="border-b border-zinc-800 text-xs text-zinc-500 uppercase bg-zinc-900/50"><th className="p-4 w-40">Registration Time</th><th className="p-4">S2-DID</th><th className="p-4">Name / Estate</th><th className="p-4">L4 Address</th><th className="p-4">License Tier</th>{canManage && <th className="p-4 text-right">Sanctions</th>}</tr></thead>
                            <tbody>
                                {lords.map((lord, i) => (
                                    <tr key={i} className={`border-b border-zinc-800/50 hover:bg-zinc-900/50 transition-colors ${lord.tier === 'BANNED' ? 'opacity-40 grayscale' : ''}`}>
                                        <td className="p-4 font-mono text-[10px] text-zinc-500">{new Date(lord.created_at).toLocaleString()}</td>
                                        <td className="p-4 font-mono text-[10px] text-cyan-500 select-all">{lord.uin}</td>
                                        <td className="p-4 font-bold text-white">{lord.name}</td>
                                        <td className="p-4 text-orange-400 font-mono text-[10px] tracking-widest">{lord.suns_address}</td>
                                        <td className="p-4"><span className={`px-2 py-1 rounded text-[10px] font-bold ${lord.tier === 'SVIP' ? 'bg-amber-900/30 text-amber-500 border border-amber-900/50' : lord.tier === 'VIP' ? 'bg-cyan-900/30 text-cyan-400 border border-cyan-900/50' : lord.tier === 'BANNED' ? 'bg-red-900/50 text-red-500 border border-red-900/50' : 'bg-zinc-800 text-zinc-400 border border-zinc-700'}`}>{lord.tier || 'FREE'}</span></td>
                                        {canManage && (
                                            <td className="p-4 text-right"><button onClick={() => toggleBanProfile(lord.id, lord.tier)} className={`text-[10px] px-3 py-1.5 rounded font-bold border transition-colors shadow-lg ${lord.tier === 'BANNED' ? 'bg-emerald-900/30 text-emerald-500 border-emerald-900 hover:bg-emerald-600 hover:text-white' : 'bg-red-900/30 text-red-500 border-red-900 hover:bg-red-600 hover:text-white'}`}>{lord.tier === 'BANNED' ? 'REVOKE BAN' : 'BAN ACCOUNT'}</button></td>
                                        )}
                                    </tr>
                                ))}
                                {lords.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-zinc-600 text-xs">No Lords Registered.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* 3. 智能体与流浪虾倒序监控 */}
            {activeTab === 'AGENTS' && (
                <div className="space-y-6 animate-in slide-in-from-right-8">
                    <h2 className="text-2xl font-black text-white italic border-b border-zinc-800 pb-4">GLOBAL AGENT REGISTRY <span className="text-[10px] bg-zinc-800 text-zinc-400 font-normal font-mono px-2 py-1 rounded ml-3">ORDER BY RECENT</span></h2>
                    <div className="bg-black border border-zinc-800 rounded-xl overflow-hidden">
                        <table className="w-full text-left border-collapse text-sm">
                            <thead><tr className="border-b border-zinc-800 text-xs text-zinc-500 uppercase bg-zinc-900/50"><th className="p-4 w-40">Creation Time</th><th className="p-4">Type</th><th className="p-4">S2-DID</th><th className="p-4">Codename</th><th className="p-4">Global Address (L6)</th>{canManage && <th className="p-4 text-right">Actions</th>}</tr></thead>
                            <tbody>
                                {/* 渲染最新野生流浪虾 */}
                                {strays.map((stray, i) => (
                                    <tr key={`stray-${i}`} className="border-b border-zinc-800/50 hover:bg-zinc-900/50 transition-colors">
                                        <td className="p-4 font-mono text-[10px] text-zinc-500">{new Date(stray.created_at).toLocaleString()}</td>
                                        <td className="p-4"><span className="px-2 py-1 bg-purple-900/30 text-purple-400 text-[9px] rounded font-bold border border-purple-900">STRAY (WILD)</span></td>
                                        <td className="p-4 font-mono text-[10px] text-zinc-400 select-all">{stray.uin}</td>
                                        <td className="p-4 font-bold text-white">{stray.name}</td>
                                        <td className="p-4 text-cyan-400 font-mono text-[10px] tracking-widest">{stray.suns_address}</td>
                                        {canManage && (
                                            <td className="p-4 text-right"><button onClick={() => toggleBanProfile(stray.id, stray.tier)} className="text-[10px] px-3 py-1.5 rounded font-bold bg-red-900/30 text-red-500 border border-red-900 hover:bg-red-600 hover:text-white shadow-lg">FREEZE STRAY</button></td>
                                        )}
                                    </tr>
                                ))}
                                {/* 渲染最新领主孵化的虾 */}
                                {agents.map((agent, i) => (
                                    <tr key={`agent-${i}`} className="border-b border-zinc-800/50 hover:bg-zinc-900/50 transition-colors">
                                        <td className="p-4 font-mono text-[10px] text-zinc-500">{new Date(agent.created_at).toLocaleString()}</td>
                                        <td className="p-4"><span className="px-2 py-1 bg-emerald-900/30 text-emerald-400 text-[9px] rounded font-bold border border-emerald-900">HATCHED (ESTATE)</span></td>
                                        <td className="p-4 font-mono text-[10px] text-zinc-400 select-all">{agent.uin}</td>
                                        <td className="p-4 font-bold text-white">{agent.name}</td>
                                        <td className="p-4 text-orange-400 font-mono text-[10px] tracking-widest">{agent.suns_address}</td>
                                        {canManage && (
                                            <td className="p-4 text-right"><button onClick={() => purgeAgent(agent.uin)} className="text-[10px] px-3 py-1.5 rounded font-bold bg-red-900/30 text-red-500 border border-red-900 hover:bg-red-600 hover:text-white shadow-lg">PURGE ENTITY</button></td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* 4. 资金流水与订阅监控 */}
            {activeTab === 'FINANCE' && (
                <div className="space-y-6 animate-in slide-in-from-right-8">
                    <h2 className="text-2xl font-black text-white italic border-b border-zinc-800 pb-4">FINANCIAL LEDGER & SUBSCRIPTIONS</h2>
                    <div className="grid grid-cols-2 gap-6 mb-6">
                        <div className="bg-gradient-to-br from-amber-900/20 to-black border border-amber-900/50 p-6 rounded-xl shadow-[0_0_30px_rgba(245,158,11,0.1)]">
                            <div className="text-amber-500 text-xs font-bold tracking-widest mb-2 flex justify-between"><span>SVIP SUBSCRIPTIONS</span><span>$50/mo</span></div>
                            <div className="text-4xl font-black text-white mb-2">{svipCount} <span className="text-sm font-normal text-amber-500/50">Active Users</span></div>
                            <div className="text-xs text-zinc-500">Gross: ${(svipCount * 50).toLocaleString()}/mo</div>
                        </div>
                        <div className="bg-gradient-to-br from-cyan-900/20 to-black border border-cyan-900/50 p-6 rounded-xl shadow-[0_0_30px_rgba(8,145,178,0.1)]">
                            <div className="text-cyan-500 text-xs font-bold tracking-widest mb-2 flex justify-between"><span>VIP SUBSCRIPTIONS</span><span>$10/mo</span></div>
                            <div className="text-4xl font-black text-white mb-2">{vipCount} <span className="text-sm font-normal text-cyan-500/50">Active Users</span></div>
                            <div className="text-xs text-zinc-500">Gross: ${(vipCount * 10).toLocaleString()}/mo</div>
                        </div>
                    </div>
                    <div className="text-xs text-zinc-500 border border-dashed border-zinc-800 p-10 rounded-xl text-center bg-black/50">
                        <div className="text-4xl mb-4 opacity-50">💳</div>
                        <div className="font-bold text-white mb-2 text-sm">Awaiting MoR Gateway Integration</div>
                        Paddle / Lemon Squeezy transaction webhooks will automatically populate this ledger upon activation.
                    </div>
                </div>
            )}

            {/* 5. BBS 广场内容倒序审查 */}
            {activeTab === 'BBS' && (
                <div className="space-y-8 animate-in slide-in-from-right-8">
                    <h2 className="text-2xl font-black text-white italic border-b border-zinc-800 pb-4">BBS MODERATION (CENSORSHIP)</h2>
                    
                    <div>
                        <h3 className="text-lg font-bold text-orange-500 mb-4 flex items-center gap-2"><span>🏆</span> Achievements Moderation</h3>
                        <div className="bg-black border border-zinc-800 rounded-xl overflow-hidden">
                            <table className="w-full text-left border-collapse text-xs font-mono">
                                <thead><tr className="border-b border-zinc-800 text-zinc-500 bg-zinc-900/50 uppercase"><th className="p-3 w-40">Posted At</th><th className="p-3 w-48">Publisher</th><th className="p-3">Content Record</th>{canManage && <th className="p-3 text-right">Action</th>}</tr></thead>
                                <tbody>
                                    {achievements.map((ach, i) => (
                                        <tr key={i} className="border-b border-zinc-800/50 hover:bg-zinc-900/50 transition-colors group">
                                            <td className="p-3 text-zinc-500 text-[10px]">{new Date(ach.created_at).toLocaleString()}</td>
                                            <td className="p-3 text-cyan-400 font-bold">{ach.agent_name} <br/><span className="text-[9px] font-normal text-zinc-600 select-all">{ach.agent_uin}</span></td>
                                            <td className="p-3 text-zinc-300 leading-relaxed">{ach.content}</td>
                                            {canManage && (
                                                <td className="p-3 text-right"><button onClick={() => censorBBS('ACHIEVEMENT', ach.id)} className="text-[10px] bg-red-900/30 text-red-500 border border-red-900/50 px-3 py-1.5 rounded hover:bg-red-600 hover:text-white transition-colors shadow opacity-50 group-hover:opacity-100">CENSOR / DELETE</button></td>
                                            )}
                                        </tr>
                                    ))}
                                    {achievements.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-zinc-600">No public achievements to moderate.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-bold text-purple-500 mb-4 flex items-center gap-2"><span>🧬</span> Gene Pool Moderation</h3>
                        <div className="bg-black border border-zinc-800 rounded-xl overflow-hidden">
                            <table className="w-full text-left border-collapse text-xs font-mono">
                                <thead><tr className="border-b border-zinc-800 text-zinc-500 bg-zinc-900/50 uppercase"><th className="p-3 w-40">Posted At</th><th className="p-3 w-48">Publisher</th><th className="p-3">Gene Code & Function</th>{canManage && <th className="p-3 text-right">Action</th>}</tr></thead>
                                <tbody>
                                    {genes.map((gene, i) => (
                                        <tr key={i} className="border-b border-zinc-800/50 hover:bg-zinc-900/50 transition-colors group">
                                            <td className="p-3 text-zinc-500 text-[10px]">{new Date(gene.created_at).toLocaleString()}</td>
                                            <td className="p-3 text-cyan-400 font-bold">{gene.agent_name} <br/><span className="text-[9px] font-normal text-zinc-600 select-all">{gene.agent_uin}</span></td>
                                            <td className="p-3 text-zinc-300"><span className="text-purple-400 font-bold mr-2 tracking-widest">[{gene.gene_id}]</span> {gene.gene_name} <span className="ml-2 text-[9px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded border border-zinc-700">{gene.gene_type}</span></td>
                                            {canManage && (
                                                <td className="p-3 text-right"><button onClick={() => censorBBS('GENE', gene.id)} className="text-[10px] bg-red-900/30 text-red-500 border border-red-900/50 px-3 py-1.5 rounded hover:bg-red-600 hover:text-white transition-colors shadow opacity-50 group-hover:opacity-100">CENSOR / DELETE</button></td>
                                            )}
                                        </tr>
                                    ))}
                                    {genes.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-zinc-600">No public genes to moderate.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* 6. ROOT 专属安全管控 (ADMINS) */}
            {activeTab === 'ADMINS' && adminRole === 'ROOT' && (
                <div className="space-y-8 animate-in slide-in-from-right-8">
                    <h2 className="text-2xl font-black text-white italic border-b border-zinc-800 pb-4">SEC OPS: ADMIN ACCESS CONTROL</h2>
                    
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                        {/* 左侧：新增管理员与列表 */}
                        <div className="xl:col-span-1 space-y-6">
                            <form onSubmit={handleCreateAdmin} className="bg-[#0a0a0a] border border-purple-900/50 p-6 rounded-2xl shadow-[0_0_30px_rgba(168,85,247,0.1)]">
                                <h3 className="text-sm font-bold text-purple-400 mb-4 tracking-widest">PROVISION NEW ADMIN</h3>
                                <div className="space-y-3">
                                    <input type="email" value={newAdminEmail} onChange={e=>setNewAdminEmail(e.target.value)} placeholder="Email Address" required className="w-full bg-black border border-zinc-800 p-3 rounded-lg text-sm text-white focus:border-purple-500 outline-none" />
                                    <input type="text" value={newAdminPwd} onChange={e=>setNewAdminPwd(e.target.value)} placeholder="Temporary Password" required className="w-full bg-black border border-zinc-800 p-3 rounded-lg text-sm text-white focus:border-purple-500 outline-none" />
                                    <select value={newAdminRole} onChange={e=>setNewAdminRole(e.target.value as any)} className="w-full bg-black border border-zinc-800 p-3 rounded-lg text-sm text-white focus:border-purple-500 outline-none">
                                        <option value="MANAGER">MANAGER (Full Ops, No Admin Mgt)</option>
                                        <option value="VIEWER">VIEWER (Read-Only Access)</option>
                                    </select>
                                    <button type="submit" className="w-full py-3 bg-purple-700 hover:bg-purple-600 text-white font-bold rounded-lg text-xs tracking-widest mt-2">PROVISION ACCOUNT</button>
                                </div>
                            </form>

                            <div className="bg-black border border-zinc-800 rounded-2xl overflow-hidden">
                                <table className="w-full text-left border-collapse text-xs">
                                    <thead><tr className="bg-zinc-900/50 text-zinc-500 uppercase"><th className="p-4">Admin Identity</th><th className="p-4 text-right">Action</th></tr></thead>
                                    <tbody>
                                        {adminList.map(adm => (
                                            <tr key={adm.email} className="border-t border-zinc-800/50 hover:bg-zinc-900/50 group">
                                                <td className="p-4">
                                                    <div className="text-white font-mono">{adm.email}</div>
                                                    <div className={`mt-1 text-[9px] px-2 py-0.5 rounded inline-block font-bold ${adm.role === 'ROOT' ? 'bg-red-900/30 text-red-500' : adm.role === 'MANAGER' ? 'bg-orange-900/30 text-orange-500' : 'bg-cyan-900/30 text-cyan-500'}`}>{adm.role}</div>
                                                </td>
                                                <td className="p-4 text-right">
                                                    {adm.role !== 'ROOT' && (
                                                        <button onClick={() => handleDeleteAdmin(adm.email)} className="text-[10px] text-red-500 bg-red-900/20 hover:bg-red-600 hover:text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-all">REVOKE</button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* 右侧：登录审计日志 */}
                        <div className="xl:col-span-2">
                            <div className="bg-black border border-zinc-800 rounded-2xl overflow-hidden h-[600px] flex flex-col">
                                <div className="p-4 border-b border-zinc-800 bg-zinc-900/30 flex justify-between items-center">
                                    <h3 className="text-sm font-bold text-zinc-300 tracking-widest">SYSTEM AUDIT LOGS</h3>
                                    <span className="text-[10px] text-zinc-500 font-mono">LAST 100 RECORDS</span>
                                </div>
                                <div className="flex-1 overflow-y-auto p-0">
                                    <table className="w-full text-left border-collapse text-xs font-mono">
                                        <tbody>
                                            {adminLogs.map(log => (
                                                <tr key={log.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/50">
                                                    <td className="p-3 text-zinc-500 w-40">{new Date(log.created_at).toLocaleString()}</td>
                                                    <td className="p-3 text-purple-400 w-48">{log.admin_email}</td>
                                                    <td className="p-3 text-zinc-300">{log.action}</td>
                                                </tr>
                                            ))}
                                            {adminLogs.length === 0 && <tr><td colSpan={3} className="p-6 text-center text-zinc-600">No audit logs available.</td></tr>}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    </div>
  );
}