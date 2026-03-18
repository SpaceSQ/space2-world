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
  
  const [loginEmail, setLoginEmail] = useState('david.xiang@robot0.com');
  const [loginPwd, setLoginPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');

  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'LORDS' | 'AGENTS' | 'FINANCE' | 'BBS' | 'ADMINS'>('DASHBOARD');
  
  // 核心业务数据集
  const [lords, setLords] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [strays, setStrays] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [genes, setGenes] = useState<any[]>([]);
  
  // 💰 真实财务订单数据集 (直连 orders 表)
  const [orders, setOrders] = useState<any[]>([]);

  // 权限与安全审计
  const [adminList, setAdminList] = useState<any[]>([]);
  const [adminLogs, setAdminLogs] = useState<any[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPwd, setNewAdminPwd] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<'MANAGER' | 'VIEWER'>('VIEWER');

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
      if (error || !data || data.password_val !== loginPwd) { alert("❌ 访问拒绝！"); return; }
      setAdminEmail(data.email); setAdminRole(data.role as AdminRole);
      if (data.needs_password_change) {
          setAuthStatus('MUST_CHANGE_PWD');
      } else {
          await supabase.from('admin_logs').insert({ admin_email: data.email, action: 'LOGIN_SUCCESS' });
          sessionStorage.setItem('s2_super_admin', data.email);
          sessionStorage.setItem('s2_admin_role', data.role);
          setAuthStatus('AUTHED'); fetchGlobalData();
          if (data.role === 'ROOT') fetchAdminData();
      }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
      e.preventDefault();
      if (newPwd !== confirmPwd) { alert("❌ 密码不一致！"); return; }
      if (newPwd.length < 6) { alert("❌ 密码过短！"); return; }
      const { error } = await supabase.from('super_admin').update({ password_val: newPwd, needs_password_change: false }).eq('email', adminEmail);
      if (error) { alert("❌ 失败：" + error.message); return; }
      await supabase.from('admin_logs').insert({ admin_email: adminEmail, action: 'PASSWORD_CHANGED & INITIAL_LOGIN' });
      sessionStorage.setItem('s2_super_admin', adminEmail); sessionStorage.setItem('s2_admin_role', adminRole || 'VIEWER');
      setAuthStatus('AUTHED'); fetchGlobalData();
      if (adminRole === 'ROOT') fetchAdminData();
  };

  const handleLogout = () => {
      sessionStorage.clear(); setAuthStatus('UNAUTH'); setLoginPwd('');
  };

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

      // 💰 直接拉取 orders 订单表数据
      const { data: orderData } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(200);
      if (orderData) setOrders(orderData);
  };

  const canManage = adminRole === 'ROOT' || adminRole === 'MANAGER';
  // ... (toggleBanProfile, purgeAgent, censorBBS 等函数保持不变，为节省空间省略) ...
  const toggleBanProfile = async (id: string, currentTier: string) => { /* 略 */ };
  const purgeAgent = async (uin: string) => { /* 略 */ };
  const censorBBS = async (type: 'ACHIEVEMENT' | 'GENE', id: string) => { /* 略 */ };

  const fetchAdminData = async () => {
      const { data: admins } = await supabase.from('super_admin').select('*').order('role');
      if (admins) setAdminList(admins);
      const { data: logs } = await supabase.from('admin_logs').select('*').order('created_at', { ascending: false }).limit(100);
      if (logs) setAdminLogs(logs);
  };

  const handleCreateAdmin = async (e: React.FormEvent) => { /* 略 */ };
  const handleDeleteAdmin = async (email: string) => { /* 略 */ };

  // 统计逻辑
  const vipCount = lords.filter(l => l.tier === 'VIP').length;
  const svipCount = lords.filter(l => l.tier === 'SVIP').length;
  const mrr = (vipCount * 10) + (svipCount * 50);

  // ================= 视图渲染 =================
  if (authStatus === 'CHECKING') return <div className="min-h-screen bg-[#050505] text-red-500 flex items-center justify-center font-mono">VERIFYING ROOT ACCESS...</div>;
  if (authStatus === 'UNAUTH' || authStatus === 'MUST_CHANGE_PWD') return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center font-mono p-4">
        {/* 登录/改密表单 UI 保持不变 */}
        <h1 className="text-red-500 text-2xl">PLEASE LOGIN via ROOT (UI Hidden for brevity)</h1>
    </div>
  );

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
            </div>
            <button onClick={handleLogout} className="text-[10px] border border-red-900/50 text-red-500 px-3 py-1 rounded hover:bg-red-900/30">EXIT ROOT</button>
        </nav>

        <main className="flex-1 p-6 md:p-8 w-full max-w-[1600px] mx-auto animate-in fade-in">
            {/* 其他 TAB 内容省略，直接看 FINANCE */}
            
            {/* 💰 FINANCE - 基于 orders 表的综合财务面板 */}
            {activeTab === 'FINANCE' && (
                <div className="space-y-10 animate-in slide-in-from-right-8">
                    
                    {/* 头部统计 */}
                    <div className="space-y-4">
                        <h2 className="text-2xl font-black text-white italic border-b border-zinc-800 pb-4">FINANCIAL LEDGER & SUBSCRIPTIONS</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-gradient-to-br from-amber-900/20 to-black border border-amber-900/50 p-6 rounded-xl shadow-[0_0_30px_rgba(245,158,11,0.1)]">
                                <div className="text-amber-500 text-xs font-bold tracking-widest mb-2 flex justify-between"><span>SVIP SUBSCRIPTIONS</span><span>$50/mo</span></div>
                                <div className="text-4xl font-black text-white mb-2">{svipCount} <span className="text-sm font-normal text-amber-500/50">Active</span></div>
                            </div>
                            <div className="bg-gradient-to-br from-cyan-900/20 to-black border border-cyan-900/50 p-6 rounded-xl shadow-[0_0_30px_rgba(8,145,178,0.1)]">
                                <div className="text-cyan-500 text-xs font-bold tracking-widest mb-2 flex justify-between"><span>VIP SUBSCRIPTIONS</span><span>$10/mo</span></div>
                                <div className="text-4xl font-black text-white mb-2">{vipCount} <span className="text-sm font-normal text-cyan-500/50">Active</span></div>
                            </div>
                        </div>
                    </div>

                    {/* 聚合订单表：从 orders 抓取的数据 */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-emerald-500 flex items-center gap-2"><span>🧾</span> Global Orders & Subscriptions</h3>
                        <div className="bg-black border border-zinc-800 rounded-xl overflow-hidden">
                            <table className="w-full text-left border-collapse text-xs font-mono">
                                <thead>
                                    <tr className="border-b border-zinc-800 text-zinc-500 bg-zinc-900/50 uppercase">
                                        <th className="p-4 w-32">Order Time</th>
                                        <th className="p-4">Order / Trade ID</th>
                                        <th className="p-4">User Email</th>
                                        <th className="p-4">Upgrade Type</th>
                                        <th className="p-4">Amount</th>
                                        <th className="p-4">Validity Period (Start - End)</th>
                                        <th className="p-4 text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map((order, i) => (
                                        <tr key={i} className="border-b border-zinc-800/50 hover:bg-zinc-900/50 transition-colors">
                                            {/* 订单时间 */}
                                            <td className="p-4 text-zinc-500 text-[10px]">{new Date(order.created_at).toLocaleString()}</td>
                                            
                                            {/* 订单号 (兼容字段名：order_id, trade_no 或 id) */}
                                            <td className="p-4 text-zinc-400 select-all text-[10px]">{order.order_id || order.trade_no || order.id}</td>
                                            
                                            {/* 用户邮箱 (兼容字段名：user_email 或 email) */}
                                            <td className="p-4 text-white font-bold">{order.user_email || order.email || 'N/A'}</td>
                                            
                                            {/* 升级类型 (兼容字段名：plan_type 或 upgrade_type) */}
                                            <td className="p-4">
                                                <span className={`px-2 py-0.5 rounded font-bold ${order.plan_type === 'SVIP' || order.upgrade_type === 'SVIP' ? 'text-amber-500 bg-amber-900/20' : 'text-cyan-500 bg-cyan-900/20'}`}>
                                                    {order.plan_type || order.upgrade_type || 'VIP'}
                                                </span>
                                            </td>
                                            
                                            {/* 支付金额 */}
                                            <td className="p-4 text-emerald-400 font-bold">${order.amount || order.payment_amount || 0}</td>
                                            
                                            {/* 会员起止时间 (兼容字段名：start_time, end_time) */}
                                            <td className="p-4 text-[10px] text-zinc-400">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-zinc-300"><span className="text-zinc-600 mr-2">START:</span>{order.start_time ? new Date(order.start_time).toLocaleString() : 'N/A'}</span>
                                                    <span className="text-zinc-300"><span className="text-zinc-600 mr-2">END&nbsp;&nbsp;:</span>{order.end_time ? new Date(order.end_time).toLocaleString() : 'N/A'}</span>
                                                </div>
                                            </td>

                                            {/* 交易状态 */}
                                            <td className="p-4 text-right">
                                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${order.status === 'COMPLETED' || order.status === 'SUCCESS' || order.status === 'PAID' ? 'bg-emerald-900/30 text-emerald-500 border border-emerald-900/50' : 'bg-orange-900/30 text-orange-500 border border-orange-900/50'}`}>
                                                    {order.status || 'UNKNOWN'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {orders.length === 0 && (
                                        <tr><td colSpan={7} className="p-8 text-center text-zinc-600 text-xs border border-dashed border-zinc-800 m-4 rounded-xl bg-black/50">No orders found in the database.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
            
            {/* 其他面板内容保持你的原有逻辑 */}
            {activeTab !== 'FINANCE' && (
                <div className="text-zinc-500 italic p-10 text-center border border-dashed border-zinc-800 rounded-xl">
                    [ {activeTab} Panel Loaded. Logic remains identical to your previous implementation. ]
                </div>
            )}

        </main>
    </div>
  );
}