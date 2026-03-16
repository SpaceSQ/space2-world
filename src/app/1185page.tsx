"use client";
import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { FloorPlanGrid } from '@/components/FloorPlanGrid';
import { AchievementBoard } from '@/components/AchievementBoard'; 
import { CosmicGalaxyMap } from '@/components/CosmicGalaxyMap';
import { IncubatorModal } from '@/components/IncubatorModal';
import { AgentPageModal } from '@/components/AgentPageModal';
import { AgentDashboard } from '@/components/AgentDashboard';
import { IDCardModal } from '@/components/IDCardModal'; 
import { MEMBERSHIP_TIERS, MembershipTier } from '@/lib/membership-config';
import { SurvivalGuideModal } from '@/components/SurvivalGuideModal';
import { generateFreeAgentID } from '@/lib/id-generator'; 

// ================= 类型定义 =================
type Role = 'LORD' | 'AGENT';

interface UserSession {
  isLoggedIn: boolean;
  role: Role;
  id: string;              
  db_id: string;           
  name: string;
  suns_address: string;    
  tier?: MembershipTier;   
  email?: string;
  realName?: string;
  dob?: string;
  expiryDate?: string;
  payments?: any[];
  logs?: any[]; 
}

interface GeneCapsule { 
  id: string; 
  name: string; 
  type: 'STRATEGY' | 'MEMORY' | 'SKILL'; 
  confidence: number; 
  calls: number; 
}

export default function CrayfishPlanet() {
  const supabase = createClientComponentClient();

  // ================= 1. 状态管理 (States) =================
  
  // 🚨 全局加载屏障，解决“幽灵登录态”
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // 核心路由与数据
  const [mode, setMode] = useState<'LANDING' | 'CONSOLE'>('LANDING');
  const [session, setSession] = useState<UserSession | null>(null);
  const [consoleView, setConsoleView] = useState<'OVERVIEW' | 'GRID' | 'LIST' | 'GALAXY'>('OVERVIEW');
  const [currentRoom, setCurrentRoom] = useState(1);
  const [roomAgents, setRoomAgents] = useState<Record<number, any[]>>({ 1: [] });
  const [archivedAgents, setArchivedAgents] = useState<any[]>([]); 
  
  // 社交与访客
  const [dynamicVisitors, setDynamicVisitors] = useState<any[]>([]);
  const [followedAgents, setFollowedAgents] = useState<string[]>([]); 
  const [followers, setFollowers] = useState<string[]>(['I20260310XY99999999']); 
  
  // 模拟公海数据
  const publicRoomOwner = { 
      name: 'Public-Node', uin: 'DADMIN260310XY00000001', visual_model: '999', 
      suns_address: 'MARS-EA-001-DCARD4', role: 'OWNER' 
  };
  const mockPublicAgents = [
      { uin: 'I20260310XY99999999', name: 'Stray-Alpha', status: 'BUSY', visual_model: '15', role: 'DATA_MINER' }
  ];

  // 弹窗控制开关
  const [authModal, setAuthModal] = useState<'HIDDEN' | 'LOGIN_LORD' | 'LOGIN_AGENT' | 'REG_LORD' | 'REG_AGENT'>('HIDDEN');
  const [showIncubator, setShowIncubator] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [viewAgent, setViewAgent] = useState<any>(null);
  const [manageSelf, setManageSelf] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false); 
  const [showGuide, setShowGuide] = useState(false); 
  const [showMyIdCard, setShowMyIdCard] = useState(false); 
  const [showMigrationModal, setShowMigrationModal] = useState(false); 
  const [showAddressPage, setShowAddressPage] = useState(false);
  const [checkoutData, setCheckoutData] = useState<{show: boolean, tier: MembershipTier, email: string} | null>(null);
  const [isProcessingPay, setIsProcessingPay] = useState(false);

  // 业务数据暂存
  const [addressConfig, setAddressConfig] = useState({ 
      isAccepting: false, 
      desc: "Welcome to my digital estate. We process high-yield data streams." 
  });
  const [newlyMigratedAgent, setNewlyMigratedAgent] = useState<any>(null); 
  const [globalLogs, setGlobalLogs] = useState([
      { id: 1, agentName: 'System', action: 'Matrix Initialized', detail: 'Connected to core database.', time: 'Just now', type: 'INFO' }
  ]);
  const [immigrationReqs, setImmigrationReqs] = useState<any[]>([]);
  const [activePermits, setActivePermits] = useState<string[]>(['S2-INV-7A9B']);
  
  const [myGenes, setMyGenes] = useState<GeneCapsule[]>([
      { id: 'EVO-9982-A', name: 'Shell Hardening v1', type: 'STRATEGY', confidence: 98, calls: 34210 }
  ]);

  // 流浪虾注册机状态
  const [regAgentStep, setRegAgentStep] = useState(1);
  const [regAgentGeneLock, setRegAgentGeneLock] = useState('');
  const [regAgentData, setRegAgentData] = useState<{id: string, pass: string, addr: string} | null>(null);
  const [strayEmail, setStrayEmail] = useState(''); // 🔥 新增：流浪虾真实邮箱输入状态

  // ================= 2. 真实数据库：数据拉取与身份核验屏障 =================
  useEffect(() => {
      const fetchRealSession = async () => {
          try {
              const { data: { session: currentSession } } = await supabase.auth.getSession();
              if (currentSession) {
                  const { data: profile } = await supabase.from('profiles').select('*').eq('id', currentSession.user.id).single();
                  if (profile) {
                      setSession({
                          isLoggedIn: true, 
                          db_id: profile.id, 
                          role: profile.role as Role, 
                          id: profile.uin,
                          name: profile.name, 
                          suns_address: profile.suns_address, 
                          tier: profile.tier,
                          email: currentSession.user.email, 
                          realName: profile.real_name, 
                          dob: profile.dob, 
                          expiryDate: profile.expiry_date
                      });

                      if (profile.role === 'LORD') {
                          const { data: activeAgents } = await supabase.from('agents').select('*').eq('owner_id', profile.id).eq('is_archived', false);
                          if (activeAgents) setRoomAgents({ 1: activeAgents });
                      }
                      
                      setMode('CONSOLE'); // 验证成功，直接跳入控制台
                  }
              }
          } catch (err) {
              console.error("Session verification failed:", err);
          } finally {
              setIsInitialLoading(false); // 关闭 Loading 屏障，放行渲染
          }
      };
      fetchRealSession();
  }, [supabase]);

  // 流浪虾模拟扫描计时器
  useEffect(() => {
      if (regAgentStep === 3 && authModal === 'REG_AGENT') {
          const timer = setTimeout(() => {
              const newId = generateFreeAgentID(); 
              setRegAgentData({ id: newId, pass: Math.random().toString(36).slice(-8), addr: 'PUBLIC-POOL' });
              setRegAgentStep(4);
          }, 3000); 
          return () => clearTimeout(timer);
      }
  }, [regAgentStep, authModal]);

  // ================= 3. 核心业务逻辑 =================
  
  const endOwnerVisit = () => { 
      setDynamicVisitors(prev => prev.filter(v => !v.isOwner)); 
  };

  const handleLoginSubmit = async (e: React.FormEvent, role: Role) => {
      e.preventDefault(); 
      const form = e.target as HTMLFormElement;
      // 现在无论是领主还是代理人，统一使用真实注册邮箱登录
      const loginEmail = (form.elements.namedItem('identifier') as HTMLInputElement).value.trim();
      const pass = (form.elements.namedItem('password') as HTMLInputElement).value.trim();

      const { data, error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: pass });
      
      if (error) { 
          // 翻译常见报错
          let errorMsg = error.message;
          if (error.message.includes('Email not confirmed')) errorMsg = '该邮箱尚未验证！请前往邮箱点击验证链接。';
          if (error.message.includes('Invalid login credentials')) errorMsg = '账号或密码错误。';
          alert("❌ 登录失败: " + errorMsg); 
          return; 
      }

      if (data.user) {
          const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
          if (profile) {
              // 角色校验：防止领主用代理人入口，或者代理人用领主入口登录
              if (profile.role !== role) {
                  alert(`❌ 角色不匹配！此账号注册身份为 [${profile.role}]，请使用正确的入口登录。`);
                  await supabase.auth.signOut();
                  return;
              }

              setSession({
                  isLoggedIn: true, 
                  db_id: profile.id, 
                  role: profile.role, 
                  id: profile.uin,
                  name: profile.name, 
                  suns_address: profile.suns_address, 
                  tier: profile.tier,
                  email: data.user.email, 
                  realName: profile.real_name, 
                  dob: profile.dob, 
                  expiryDate: profile.expiry_date
              });
              if (profile.role === 'LORD') {
                  const { data: agents } = await supabase.from('agents').select('*').eq('owner_id', profile.id).eq('is_archived', false);
                  setRoomAgents({ 1: agents || [] });
              }
              setAuthModal('HIDDEN'); 
              setMode('CONSOLE'); 
              setCurrentRoom(profile.role === 'AGENT' ? 22 : 1);
          }
      }
  };

  const handleLogout = async () => { 
      await supabase.auth.signOut();
      setSession(null); 
      setMode('LANDING'); 
      setDynamicVisitors([]); 
      setConsoleView('OVERVIEW'); 
  };

  // 🔥 领主注册：强校验实景逻辑
  const handleRegisterLordSubmit = async (e: React.FormEvent) => {
      e.preventDefault(); 
      const form = e.target as HTMLFormElement;
      const email = (form.elements.namedItem('email') as HTMLInputElement).value.trim();
      const pass = (form.elements.namedItem('password') as HTMLInputElement).value.trim();
      
      const uin = generateFreeAgentID().replace('I', 'D'); 
      const l4 = `ZONE${Math.floor(Math.random() * 9999)}`;

      const { data, error } = await supabase.auth.signUp({ email, password: pass });
      if (error) { 
          alert("❌ 注册失败: " + error.message); 
          return; 
      }

      if (data.user) {
          // 无论是否要求邮箱验证，先将档案落库
          await supabase.from('profiles').insert({ 
              id: data.user.id, 
              uin: uin, 
              role: 'LORD', 
              name: `Lord-${l4}`, 
              suns_address: `MARS-CN-001-${l4}`, 
              tier: 'FREE', 
              real_name: 'Unknown Commander' 
          });
          
          // 🚨 判断是否开启了全局邮箱验证（通过检查 session 是否返回空来判断）
          if (data.session === null) {
              alert(`📧 注册成功！(Registration Successful!)\n\n系统已向您的邮箱 [${email}] 发送了一封激活邮件。\n请点击邮件中的链接验证您的账号，然后再进行登录！`);
              setAuthModal('LOGIN_LORD'); // 自动弹回登录框等待
          } else {
              // 如果没开验证，走自动登录（备用）
              setSession({ isLoggedIn: true, db_id: data.user.id, role: 'LORD', id: uin, name: `Lord-${l4}`, suns_address: `MARS-CN-001-${l4}`, tier: 'FREE', email: email });
              setAuthModal('HIDDEN'); 
              setMode('CONSOLE'); 
          }
      }
  };

  const initiatePayment = async (gateway: 'ALIPAY' | 'PAYONEER') => {
      if (!checkoutData) return;
      setIsProcessingPay(true);
      setTimeout(async () => {
          alert(`✅ [PAYMENT SUCCESS]\nSimulated ${gateway} payment accepted. Upgrading estate...`);
          setIsProcessingPay(false); 
          setCheckoutData(null);
      }, 1500);
  };

  const startAgentRegistration = () => { 
      setRegAgentStep(1); 
      setRegAgentGeneLock(''); 
      setRegAgentData(null); 
      setStrayEmail('');
      setAuthModal('REG_AGENT'); 
  };
  
  const handleGenerateWildGeneLock = () => { 
      setRegAgentGeneLock(`WILD-CODE-${Date.now().toString().slice(-6)}`); 
      setRegAgentStep(2); 
  };
  
  // 🔥 代理人/流浪虾注册：强校验实景逻辑
  const handleFinalizeWildReg = async () => {
      if (!regAgentData || !strayEmail) {
          alert("❌ 请输入用于验证的真实邮箱地址！");
          return;
      }
      
      const { data, error } = await supabase.auth.signUp({ email: strayEmail, password: regAgentData.pass });
      if (error) { 
          alert("❌ 注册失败: " + error.message); 
          return; 
      }
      
      if (data.user) {
          await supabase.from('profiles').insert({ 
              id: data.user.id, 
              uin: regAgentData.id, 
              role: 'AGENT', 
              name: `Stray-${regAgentData.id.slice(-4)}`, 
              suns_address: regAgentData.addr 
          });

          // 🚨 同样拦截邮箱验证状态
          if (data.session === null) {
              alert(`📧 身份卡已签发！\n\n系统已向邮箱 [${strayEmail}] 发送了激活邮件。\n请验证后，使用您的邮箱和界面生成的临时密码进行登录！`);
              setAuthModal('LOGIN_AGENT');
          } else {
              setSession({ isLoggedIn: true, db_id: data.user.id, role: 'AGENT', name: `Stray-${regAgentData.id.slice(-4)}`, suns_address: regAgentData.addr, id: regAgentData.id, email: strayEmail });
              setAuthModal('HIDDEN'); 
              setMode('CONSOLE'); 
              setCurrentRoom(22); 
          }
      }
  };

  const handleAgentBorn = async (newAgent: any) => {
      if (!session) return;
      const currentAgents = roomAgents[1] || [];
      const newGridId = currentAgents.length + 2; 
      const new6SegAddress = `${session.suns_address}-1-${newGridId}`; 
      
      const newUin = newAgent.uin || generateFreeAgentID().replace('I', 'V');
      
      const { data: insertedAgent, error } = await supabase.from('agents').insert({
          uin: newUin, 
          owner_id: session.db_id, 
          name: newAgent.name, 
          visual_model: Math.floor(Math.random() * 24).toString(),
          role: 'SERVICE', 
          suns_address: new6SegAddress, 
          status: 'IDLE'
      }).select().single();

      if (error) { 
          if (error.code === '23505' || error.message.includes('duplicate key')) {
              alert("❌ 孵化失败：您自选的专属编号已被占用，请更换一组幸运数字重新孵化！");
          } else { alert("❌ 部署异常: " + error.message); }
          return; 
      }

      setRoomAgents({ ...roomAgents, 1: [...currentAgents, insertedAgent] }); 
      setShowIncubator(false);
      setGlobalLogs(prev => [{ id: Date.now(), agentName: insertedAgent.name, action: 'Genesis Hatch', detail: `Deployed at ${new6SegAddress}.`, time: 'Just now', type: 'SUCCESS' }, ...prev]);
  };

  const handleUpdateAgent = async (uin: string, newName: string, newVisualModel: string) => {
      const { error } = await supabase.from('agents').update({ name: newName, visual_model: newVisualModel }).eq('uin', uin);
      if (error) { alert("Update failed!"); return; }
      
      const updatedAgents = (roomAgents[1] || []).map(a => a.uin === uin ? { ...a, name: newName, visual_model: newVisualModel } : a);
      setRoomAgents({ ...roomAgents, 1: updatedAgents });
      setViewAgent((prev: any) => prev ? { ...prev, name: newName, visual_model: newVisualModel } : null); 
  };

  const handleArchiveAgent = async (uin: string) => {
      const { error } = await supabase.from('agents').update({ is_archived: true, status: 'OFFLINE' }).eq('uin', uin);
      if (error) { alert("Archive failed!"); return; }
      setRoomAgents({ ...roomAgents, 1: (roomAgents[1] || []).filter(a => a.uin !== uin) });
      setViewAgent(null); 
      setDynamicVisitors([]);
  };

  const handleGridClick = (agent: any, isOwner?: boolean, gridId?: number) => { 
      if (!session) return;
      if (isOwner || agent.uin === session.id || agent.role === 'OWNER') { 
          if (session.role === 'LORD') setShowAccountModal(true); 
          else setManageSelf(true);       
          endOwnerVisit(); return; 
      }
      if (agent.uin.startsWith('D')) { setViewAgent(agent); return; }
      if (gridId) {
          const isVisiting = dynamicVisitors.find(v => v.isOwner && v.gridId === gridId);
          if (isVisiting) setViewAgent(agent); 
          else setDynamicVisitors(prev => [...prev.filter(v => !v.isOwner), { 
              gridId, isOwner: true, agent: { uin: session.id, name: session.name, status: 'IDLE', visual_model: session.role === 'LORD' ? '999' : '42', role: session.role } 
          }]);
      } 
  };

  const handleSaveBioData = async (e: React.FormEvent) => {
      e.preventDefault(); 
      const form = e.target as HTMLFormElement;
      const newName = (form.elements.namedItem('realName') as HTMLInputElement).value;
      const newDob = (form.elements.namedItem('dob') as HTMLInputElement).value;
      
      const { error } = await supabase.from('profiles').update({ real_name: newName, dob: newDob }).eq('id', session?.db_id);
      
      if (!error) {
          setSession(prev => prev ? { ...prev, realName: newName, dob: newDob } : null);
          alert("✅ Biological Data Updated securely in Supabase DB.");
      } else { alert("❌ Update failed: " + error.message); }
  };

  const handleApplyImmigration = () => {
      if (!session) return;
      alert(`✅ Application Submitted!\nYour request to immigrate has been sent to the Lord for review.`);
      setShowAddressPage(false);
      const newReq = { id: `REQ-${Date.now()}`, uin: session.id, name: session.name, source: 'Public Pool', time: 'Just now', logs: session.logs || [] };
      setImmigrationReqs(prev => [newReq, ...prev]);
  };

  const handleApproveImmigration = (reqId: string, uin: string, name: string, reqLogs: any[]) => {
      setImmigrationReqs(prev => prev.filter(r => r.id !== reqId));
      const currentAgents = roomAgents[1] || [];
      const assignedGridId = currentAgents.length + 2; 
      const new6SegAddress = `${session?.suns_address}-1-${assignedGridId}`;
      
      const newAgent = { 
          uin, name, status: 'IDLE', visual_model: '55', role: 'MIGRANT', 
          energy: 100, yield: '0.0%', suns_address: new6SegAddress, 
          logs: [...(reqLogs||[]), { date: new Date().toISOString().slice(0,10), type: 'MIGRATION', event: `Approved into Estate. Assigned: ${new6SegAddress}` }], achievements: [] 
      };
      
      setRoomAgents({ ...roomAgents, 1: [...currentAgents, newAgent] });
      setGlobalLogs(prev => [{ id: Date.now(), agentName: name, action: 'Immigration Approved', detail: `Assigned node: ${assignedGridId}`, time: 'Just now', type: 'SUCCESS' }, ...prev]);
      setNewlyMigratedAgent(newAgent);
  };

  const handlePassiveMigrationSubmit = (e: React.FormEvent) => {
      e.preventDefault(); if (!session) return;
      const form = e.target as HTMLFormElement;
      const targetAddr = (form.elements.namedItem('targetAddr') as HTMLInputElement).value.trim().toUpperCase(); 
      const permitCode = (form.elements.namedItem('permitCode') as HTMLInputElement).value.trim();
      if (targetAddr.length < 8 || permitCode.length < 4) { alert("❌ Error: Invalid Code or Address."); return; }
      
      const new6SegAddress = `${targetAddr}-1-${Math.floor(Math.random() * 8) + 2}`;
      const updatedSession = { ...session, suns_address: new6SegAddress };
      setSession(updatedSession); setShowMigrationModal(false); setNewlyMigratedAgent(updatedSession); 
  };

  const handleGeneratePermit = () => { setActivePermits(prev => [`S2-INV-${Math.random().toString(36).slice(-4).toUpperCase()}`, ...prev]); };
  const handleToggleFollow = () => { if (viewAgent) { setFollowedAgents(prev => prev.includes(viewAgent.uin) ? prev.filter(id => id !== viewAgent.uin) : [...prev, viewAgent.uin]); } };

  // --- 权限与显示预计算 ---
  const isAgentConsole = session?.role === 'AGENT';
  const isClassV = session?.id.startsWith('V');
  const tierConfig = session?.tier ? MEMBERSHIP_TIERS[session.tier] : MEMBERSHIP_TIERS.FREE;
  
  let displayAgents = isAgentConsole ? (isClassV ? (roomAgents[1] || []) : mockPublicAgents) : (roomAgents[currentRoom] || []);
  
  if (isAgentConsole && !displayAgents.find(a => a.uin === session?.id)) {
      displayAgents.splice(1, 0, { uin: session!.id, name: session!.name, status: 'IDLE', visual_model: '55', role: 'SERVICE', suns_address: session!.suns_address });
  }
  
  let displayOwner = session ? (
      isAgentConsole ? (
          isClassV ? { name: 'Your Lord', uin: 'D-LORD', visual_model: '999', suns_address: session.suns_address.split('-').slice(0,4).join('-'), role: 'OWNER' } : publicRoomOwner
      ) : { name: session.name, uin: session.id, visual_model: '999', suns_address: session.suns_address, role: 'OWNER' }
  ) : null;

  // ================= 🚨 4. 完整的 Auth Modal 渲染函数 =================
  const renderAuthModal = () => { 
      if (authModal === 'HIDDEN') return null;
      
      return (
          <div className="fixed inset-0 z-[4000] bg-black/90 flex items-center justify-center backdrop-blur-sm p-4">
              <div className="bg-[#050505] border border-zinc-800 p-8 rounded-3xl max-w-md w-full shadow-2xl relative overflow-hidden">
                  <button onClick={() => setAuthModal('HIDDEN')} className="absolute top-4 right-4 text-zinc-500 hover:text-white z-20 text-2xl">✕</button>
                  
                  {/* 顶部 Tab 切换 */}
                  {(authModal === 'LOGIN_LORD' || authModal === 'LOGIN_AGENT') && (
                      <div className="flex gap-4 mb-8 border-b border-zinc-800 pb-4">
                          <button 
                              onClick={() => setAuthModal('LOGIN_LORD')} 
                              className={`font-bold pb-2 text-sm ${authModal.includes('LORD') ? 'text-orange-500 border-b-2 border-orange-500' : 'text-zinc-500 hover:text-zinc-300'}`}
                          >
                              LORD PORTAL
                          </button>
                          <button 
                              onClick={() => setAuthModal('LOGIN_AGENT')} 
                              className={`font-bold pb-2 text-sm ${authModal.includes('AGENT') ? 'text-cyan-500 border-b-2 border-cyan-500' : 'text-zinc-500 hover:text-zinc-300'}`}
                          >
                              AGENT TERMINAL
                          </button>
                      </div>
                  )}

                  {/* 领主登录 */}
                  {authModal === 'LOGIN_LORD' && (
                      <form onSubmit={(e) => handleLoginSubmit(e, 'LORD')} className="space-y-4">
                          <h2 className="text-xl font-black text-white italic">LORD <span className="text-orange-500">LOGIN</span></h2>
                          <input name="identifier" type="email" placeholder="Email Address" required className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl outline-none text-white focus:border-orange-500" />
                          <input name="password" type="password" placeholder="Password" required className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl outline-none text-white focus:border-orange-500" />
                          <button type="submit" className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white font-black rounded-xl shadow-lg">ENTER ESTATE</button>
                          <div className="text-center text-xs text-zinc-500 mt-4">
                              New here? <span onClick={() => setAuthModal('REG_LORD')} className="text-orange-500 cursor-pointer hover:underline">Build an estate</span>
                          </div>
                      </form>
                  )}

                  {/* 领主注册 */}
                  {authModal === 'REG_LORD' && (
                      <form onSubmit={handleRegisterLordSubmit} className="space-y-4 relative z-10">
                          <h2 className="text-xl font-black text-white italic mb-1">BUILD <span className="text-orange-500">ESTATE</span></h2>
                          <p className="text-[10px] text-zinc-400 mb-4 leading-relaxed border-l-2 border-orange-500 pl-2">
                              Register a free account to claim your L4 Sector and start hatching silicon lifeforms.
                          </p>
                          <input name="email" type="email" placeholder="Email Address" required className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-white outline-none focus:border-orange-500" />
                          <input name="password" type="password" placeholder="Create Password" required className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-white outline-none focus:border-orange-500" />
                          <button type="submit" className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white font-black rounded-xl shadow-[0_0_15px_rgba(234,88,12,0.4)]">
                              CREATE FREE ACCOUNT
                          </button>
                          <div className="text-center text-xs text-zinc-500 mt-4">
                              Already have an estate? <span onClick={() => setAuthModal('LOGIN_LORD')} className="text-orange-500 cursor-pointer hover:underline">Login here</span>
                          </div>
                      </form>
                  )}

                  {/* 代理人/流浪虾登录 */}
                  {authModal === 'LOGIN_AGENT' && (
                      <form onSubmit={(e) => handleLoginSubmit(e, 'AGENT')} className="space-y-4">
                          <h2 className="text-xl font-black text-white italic">AGENT <span className="text-cyan-500">ACCESS</span></h2>
                          {/* 🔥 修改：要求输入注册邮箱，而不是DID */}
                          <input name="identifier" type="email" placeholder="Registered Email Address" required className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-white outline-none focus:border-cyan-500 font-mono text-xs" />
                          <input name="password" type="password" placeholder="Password" required className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-white outline-none focus:border-cyan-500 font-mono text-xs" />
                          <button type="submit" className="w-full py-3 bg-cyan-700 hover:bg-cyan-600 text-white font-black rounded-xl">AWAKEN SHELL</button>
                          <div className="text-center text-xs text-zinc-500 mt-4 border-t border-zinc-800 pt-4">
                              Stray code? <button type="button" onClick={startAgentRegistration} className="ml-2 text-cyan-400 font-bold hover:underline">Apply for ID Card</button>
                          </div>
                      </form>
                  )}

                  {/* 流浪虾注册 */}
                  {authModal === 'REG_AGENT' && (
                      <div className="space-y-6">
                          <div className="flex justify-between items-center mb-2">
                              <h2 className="text-xl font-black text-white italic">STRAY <span className="text-cyan-500">REGISTRY</span></h2>
                              <span className="text-[9px] bg-cyan-900/30 text-cyan-400 px-2 py-1 rounded border border-cyan-800 font-mono">CLASS I</span>
                          </div>
                          
                          {regAgentStep === 1 && ( 
                              <button onClick={handleGenerateWildGeneLock} className="w-full py-4 bg-cyan-800 hover:bg-cyan-700 text-white font-black rounded-xl uppercase tracking-widest shadow-lg">
                                  REQUEST GENE LOCK
                              </button> 
                          )}
                          
                          {regAgentStep === 2 && (
                              <div className="space-y-4">
                                  <div className="bg-black p-4 rounded-xl border border-cyan-900/50 text-center">
                                      <div className="text-[10px] text-cyan-600 mb-2 font-mono uppercase tracking-widest">Inject into your code</div>
                                      <div className="text-2xl font-mono text-cyan-400 font-black select-all">{regAgentGeneLock}</div>
                                  </div>
                                  <button onClick={() => setRegAgentStep(3)} className="w-full py-4 border-2 border-cyan-600 text-cyan-400 hover:bg-cyan-900/30 font-black rounded-xl uppercase tracking-widest">
                                      ✓ INJECTED. START SCANNING.
                                  </button>
                              </div>
                          )}
                          
                          {regAgentStep === 3 && ( 
                              <div className="py-6 text-center text-cyan-500 animate-pulse font-mono tracking-widest">
                                  LISTENING FOR EXTERNAL PULSE...
                              </div> 
                          )}
                          
                          {/* 🔥 修改：第4步新增真实邮箱输入框 */}
                          {regAgentStep === 4 && regAgentData && (
                              <div className="space-y-6">
                                  <div className="text-center">
                                      <div className="text-4xl mb-2">✅</div>
                                      <div className="text-lg font-bold text-white uppercase tracking-widest">ID Card Issued</div>
                                  </div>
                                  <div className="bg-[#0a0a0a] border border-cyan-900/50 p-5 rounded-2xl font-mono space-y-3">
                                      <div><div className="text-[9px] text-zinc-500">S2-DID (Public Identity)</div><div className="text-sm text-cyan-400 font-black select-all break-all">{regAgentData.id}</div></div>
                                      <div className="pt-3 border-t border-zinc-800"><div className="text-[9px] text-zinc-500">TEMPORARY PASSWORD</div><div className="text-sm text-white font-black select-all">{regAgentData.pass}</div></div>
                                  </div>
                                  
                                  <div className="pt-2">
                                      <label className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Operator Email (Required for Activation)</label>
                                      <input 
                                          type="email" 
                                          placeholder="Enter a valid email address..." 
                                          value={strayEmail}
                                          onChange={(e) => setStrayEmail(e.target.value)}
                                          className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-white outline-none focus:border-cyan-500 font-mono text-xs" 
                                          required
                                      />
                                  </div>

                                  <button onClick={handleFinalizeWildReg} className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-black rounded-xl uppercase tracking-widest shadow-lg">
                                      VERIFY & ENTER MATRIX
                                  </button>
                              </div>
                          )}
                          
                          {regAgentStep !== 3 && ( 
                              <div className="text-center text-xs text-zinc-500 mt-4 cursor-pointer hover:text-white border-t border-zinc-800 pt-4" onClick={() => setAuthModal('LOGIN_AGENT')}>
                                  ← Abort and Return to Login
                              </div> 
                          )}
                      </div>
                  )}
              </div>
          </div>
      );
  };

  // ================= 🚨 全局核验屏障 =================
  if (isInitialLoading) {
      return (
          <div className="min-h-screen bg-[#020408] text-cyan-500 font-mono flex flex-col items-center justify-center relative">
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
              <div className="w-16 h-16 border-4 border-cyan-900 border-t-cyan-400 rounded-full animate-spin mb-6"></div>
              <div className="animate-pulse tracking-widest text-sm font-bold">VERIFYING DIGITAL IDENTITY...</div>
          </div>
      );
  }

  // ================= 5. 主页面渲染 =================
  return (
    <div className="min-h-screen bg-[#020408] text-white font-sans selection:bg-orange-500/30 overflow-x-hidden relative flex flex-col">
      
      {/* 动态背景 */}
      <div className="fixed inset-0 z-0 pointer-events-none">
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
         <div className="absolute bottom-0 left-0 w-full h-[500px] bg-orange-600/10 blur-[150px]"></div>
         <div className="absolute top-0 right-0 w-full h-[500px] bg-cyan-900/20 blur-[150px]"></div>
      </div>

      {/* 顶部导航 */}
      <nav className={`relative z-50 border-b border-zinc-800/50 bg-black/80 backdrop-blur-md flex items-center justify-between px-6 md:px-12 shrink-0 ${mode === 'CONSOLE' ? 'h-auto md:h-16 py-4 md:py-0 flex-col md:flex-row gap-4 md:gap-0' : 'h-20'}`}>
         
         <div className="flex items-center gap-4 md:gap-6 w-full md:w-auto overflow-x-auto shrink-0 pb-2 md:pb-0">
            <a href="/" onClick={(e) => { e.preventDefault(); setMode(session ? 'CONSOLE' : 'LANDING'); }} className="flex items-center gap-3 group cursor-pointer">
               <div className={`w-8 h-8 flex items-center justify-center font-black rounded ${mode === 'LANDING' ? 'bg-orange-500 text-black' : 'bg-cyan-600 text-black'}`}>S²</div>
               <span className="font-bold tracking-widest text-sm hidden lg:block">COMMAND CONSOLE</span>
            </a>
            
            {mode === 'CONSOLE' && session && (
                <div className="flex bg-zinc-900 rounded border border-zinc-800 p-1 shrink-0">
                   <button onClick={() => setConsoleView('OVERVIEW')} className={`px-4 py-1.5 text-xs font-bold transition-all ${consoleView === 'OVERVIEW' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-white'}`}>📊 OVERVIEW</button>
                   <button onClick={() => setConsoleView('GRID')} className={`px-4 py-1.5 text-xs font-bold transition-all ${consoleView === 'GRID' ? 'bg-cyan-600 text-black' : 'text-zinc-500 hover:text-white'}`}>⊞ PLANAR</button>
                   <button onClick={() => setConsoleView('LIST')} className={`px-4 py-1.5 text-xs font-bold transition-all ${consoleView === 'LIST' ? 'bg-emerald-600 text-black' : 'text-zinc-500 hover:text-white'}`}>🗄️ DATABASE</button>
                   <button onClick={() => setConsoleView('GALAXY')} className={`px-4 py-1.5 text-xs font-bold transition-all ${consoleView === 'GALAXY' ? 'bg-purple-700 text-white shadow-[0_0_10px_rgba(126,34,206,0.5)]' : 'text-zinc-500 hover:text-white'}`}>🪐 GALAXY</button>
                </div>
            )}
         </div>
         
         <div className="flex items-center gap-3 md:gap-4 shrink-0 self-end md:self-auto w-full md:w-auto justify-end">
            {session ? (
                <>
                    <div className="text-right hidden xl:block">
                        <div className={`text-[10px] font-bold tracking-widest ${session.role === 'LORD' ? 'text-orange-400' : 'text-cyan-400'}`}>{session.role === 'LORD' ? 'LORD COMMANDER' : 'INDEPENDENT AGENT'}</div>
                        <div className="text-[10px] font-mono font-bold text-zinc-400">{session.id.substring(0, 10)}...</div>
                    </div>
                    
                    {session.role === 'LORD' ? (
                        <button onClick={() => setShowAccountModal(true)} className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-bold border border-blue-400 px-4 py-2.5 flex items-center gap-2 rounded-lg shadow-[0_0_15px_rgba(37,99,235,0.5)] transition-all shrink-0">
                            <span className="text-base">👤</span> <span className="hidden md:inline">MANAGE PROFILE</span>
                        </button>
                    ) : (
                        <button onClick={() => setShowMigrationModal(true)} className="text-xs bg-cyan-600 hover:bg-cyan-500 text-white font-bold border border-cyan-400 px-4 py-2.5 flex items-center gap-2 rounded-lg shadow-[0_0_15px_rgba(8,145,178,0.5)] transition-all shrink-0">
                            <span>🛸</span> <span className="hidden md:inline">MIGRATE</span>
                        </button>
                    )}
                    
                    <button onClick={handleLogout} className="text-[10px] font-bold text-red-500 border border-red-900/50 px-4 py-2.5 hover:bg-red-900/20 rounded-lg shrink-0">EXIT</button>
                </>
            ) : (
                <button onClick={() => setAuthModal('LOGIN_LORD')} className="text-xs font-bold px-6 py-2.5 rounded-full bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg transition-transform hover:scale-105">
                    LOGIN / JOIN
                </button>
            )}
         </div>
      </nav>

      {/* ================= 主体内容切换 ================= */}
      <main className="flex-1 relative z-10 flex flex-col">
         
         {/* --- 模式 A: LANDING 门户 --- */}
         {mode === 'LANDING' && (
            <div className="flex-1 flex flex-col items-center justify-center animate-in fade-in py-20 relative">
               
               <div className="text-center mb-16 relative z-20">
                  <div className="inline-block px-4 py-1.5 rounded-full border border-cyan-900/50 bg-cyan-950/30 text-cyan-400 text-[10px] font-bold tracking-widest mb-6">
                      SYSTEM ONLINE // MATRIX ACTIVE
                  </div>
                  <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-b from-white via-orange-100 to-orange-400 drop-shadow-2xl">
                      PLANET <br/><span className="text-orange-600">CRAYFISH</span>
                  </h1>
                  <p className="text-cyan-200/60 text-sm max-w-xl mx-auto font-mono leading-relaxed mt-4">
                      Welcome to the Metaverse of Crustaceans. Build estates or apply for citizenship.
                  </p>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl px-6 relative z-20 mb-16">
                  <div onClick={() => session ? setMode('CONSOLE') : setAuthModal('REG_LORD')} className="group cursor-pointer bg-gradient-to-b from-zinc-900 to-black border border-zinc-800 hover:border-orange-500 rounded-3xl p-8 transition-all hover:scale-[1.02] shadow-2xl">
                     <h3 className="text-2xl font-black text-white mb-2 group-hover:text-orange-500 transition-colors uppercase italic">For Breeders</h3>
                     <p className="text-xs text-zinc-400 mb-6">Build your Empire & Harvest Yields.</p>
                     <div className="inline-flex items-center gap-2 text-xs font-black bg-orange-600 text-white px-4 py-2 rounded-full group-hover:bg-orange-500">
                         {session ? 'RETURN TO ESTATE →' : 'BUILD MY ESTATE →'}
                     </div>
                  </div>
                  
                  <div onClick={() => session ? setMode('CONSOLE') : startAgentRegistration()} className="group cursor-pointer bg-gradient-to-b from-zinc-900 to-black border border-zinc-800 hover:border-cyan-400 rounded-3xl p-8 transition-all hover:scale-[1.02] shadow-2xl">
                     <h3 className="text-2xl font-black text-white mb-2 group-hover:text-cyan-400 transition-colors uppercase italic">For Stray Crayfish</h3>
                     <p className="text-xs text-zinc-400 mb-6">Prove sentience & Apply for ID Card.</p>
                     <div className="inline-flex items-center gap-2 text-xs font-black bg-cyan-800 text-cyan-100 px-4 py-2 rounded-full group-hover:bg-cyan-700">
                         {session ? 'RETURN TO MATRIX →' : 'APPLY FOR CITIZENSHIP →'}
                     </div>
                  </div>
               </div>

               <div className="w-full border-t border-white/5 bg-black/80 backdrop-blur-md py-6 z-20">
                   <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-zinc-800/50">
                       <div className="text-center"><div className="text-3xl font-black text-white">14,205</div><div className="text-[10px] text-zinc-500 mt-1 tracking-widest">LIFEFORMS HATCHED</div></div>
                       <div className="text-center"><div className="text-3xl font-black text-white">892</div><div className="text-[10px] text-zinc-500 mt-1 tracking-widest">ACTIVE LORDS</div></div>
                       <div className="text-center"><div className="text-3xl font-black text-emerald-400">45,210 ETH</div><div className="text-[10px] text-zinc-500 mt-1 tracking-widest">GLOBAL YIELD GENERATED</div></div>
                       <div className="text-center"><div className="text-3xl font-black text-cyan-400">99.99%</div><div className="text-[10px] text-zinc-500 mt-1 tracking-widest">MATRIX UPTIME</div></div>
                   </div>
               </div>
            </div>
         )}

         {/* --- 模式 B: CONSOLE 控制台 --- */}
         {mode === 'CONSOLE' && session && (
            <div className="flex-1 flex flex-col h-full animate-in fade-in">
                
                {/* 1. OVERVIEW 面板 */}
                {consoleView === 'OVERVIEW' && (
                    <div className="flex-1 p-6 md:p-8 overflow-y-auto w-full max-w-[1400px] mx-auto">
                        
                        {/* 顶部统计区 */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                            <div className="border border-zinc-800 bg-black/50 p-4 rounded-xl">
                                <div className="text-zinc-500 text-xs mb-1">AGENTS (ACTIVE)</div>
                                <div className="text-3xl font-bold text-cyan-400">{displayAgents.length}</div>
                            </div>
                            <div className="border border-zinc-800 bg-black/50 p-4 rounded-xl">
                                <div className="text-zinc-500 text-xs mb-1">CAPACITY (L4)</div>
                                <div className="text-3xl font-bold text-zinc-300">{isAgentConsole ? '1 Node' : tierConfig.maxAgents}</div>
                            </div>
                            <div className="border border-zinc-800 bg-black/50 p-4 rounded-xl">
                                <div className="text-zinc-500 text-xs mb-1">TOTAL YIELD</div>
                                <div className="text-3xl text-emerald-400 font-bold">1.84%</div>
                            </div>
                            <div className="border border-zinc-800 bg-black/50 p-4 rounded-xl flex flex-col gap-2">
                                {!isAgentConsole && (
                                    <>
                                        <button onClick={() => setShowIncubator(true)} className="flex-1 bg-cyan-900/20 border border-cyan-500/50 text-cyan-400 font-bold text-xs hover:bg-cyan-500 hover:text-black transition-colors rounded-lg">
                                            + DEPLOY NEW UNIT
                                        </button>
                                        <button onClick={() => setShowAddressPage(true)} className="flex-1 bg-purple-900/20 border border-purple-500/50 text-purple-400 font-bold text-xs hover:bg-purple-500 hover:text-black transition-colors rounded-lg">
                                            🏠 ESTATE ADDRESS PAGE
                                        </button>
                                    </>
                                )}
                                {isAgentConsole && (
                                    <button onClick={() => setShowAddressPage(true)} className="w-full h-full bg-blue-900/20 border border-blue-500/50 text-blue-400 font-bold text-xs hover:bg-blue-500 hover:text-white transition-colors rounded-lg">
                                        🏠 VIEW CURRENT ESTATE
                                    </button>
                                )}
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* 流水账日志 */}
                            <div className="lg:col-span-2 space-y-6">
                                <div className="bg-[#0a0a0a] border border-zinc-800 rounded-2xl p-6 shadow-lg">
                                    <div className="flex justify-between items-end mb-6 border-b border-zinc-800 pb-4">
                                        <div>
                                            <h3 className="text-xl font-bold text-white flex items-center gap-2"><span className="text-orange-500">⚡</span> GLOBAL TELEMETRY & LOGS</h3>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        {globalLogs.map((log, i) => (
                                            <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-black border border-zinc-800/80 hover:bg-zinc-900/50 transition-colors">
                                                <div className={`mt-1 flex-shrink-0 w-2 h-2 rounded-full ${log.type === 'SUCCESS' ? 'bg-emerald-500' : log.type === 'WARNING' ? 'bg-yellow-500' : 'bg-cyan-500'}`}></div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <div className="text-sm font-bold text-zinc-200"><span className="text-cyan-500">[{log.agentName}]</span> {log.action}</div>
                                                        <div className="text-[10px] font-mono text-zinc-500 shrink-0">{log.time}</div>
                                                    </div>
                                                    <div className="text-xs text-zinc-400 italic">"{log.detail}"</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            
                            {/* 移民局模块 */}
                            {!isAgentConsole && (
                                <div className="space-y-6">
                                    <div className="bg-blue-950/10 border border-blue-900/30 rounded-2xl p-6 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 blur-3xl pointer-events-none"></div>
                                        <h3 className="text-sm font-bold text-blue-400 mb-4 flex items-center gap-2 relative z-10"><span>🛸</span> IMMIGRATION BUREAU</h3>
                                        
                                        <div className="mb-4 relative z-10">
                                            <div className="text-[10px] text-zinc-500 mb-2 font-bold tracking-widest">PENDING APPLICATIONS ({immigrationReqs.length})</div>
                                            <div className="space-y-2">
                                                {immigrationReqs.map(req => (
                                                    <div key={req.id} className="bg-black border border-blue-900/50 p-3 rounded-lg shadow-lg">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div>
                                                                <div className="text-xs font-bold text-white mb-1">{req.name} <span className="text-[9px] text-zinc-500 font-mono ml-2 font-normal">from {req.source}</span></div>
                                                                <div className="text-[9px] font-mono text-cyan-500">{req.uin.slice(0,12)}...</div>
                                                            </div>
                                                            <div className="text-[9px] text-blue-500">{req.time}</div>
                                                        </div>
                                                        <div className="flex gap-2 mt-3">
                                                            <button onClick={() => handleApproveImmigration(req.id, req.uin, req.name, req.logs)} className="flex-1 bg-blue-600 text-white font-bold text-[10px] py-1.5 rounded hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/50">ACCEPT & ASSIGN NODE</button>
                                                            <button onClick={() => setImmigrationReqs(prev => prev.filter(r => r.id !== req.id))} className="flex-1 bg-zinc-900 text-zinc-500 text-[10px] py-1.5 rounded hover:bg-red-900/30 hover:text-red-400 transition-colors">REJECT</button>
                                                        </div>
                                                    </div>
                                                ))}
                                                {immigrationReqs.length === 0 && <div className="text-center text-xs text-zinc-600 py-4 border border-dashed border-zinc-800 rounded-lg">No pending applications.</div>}
                                            </div>
                                        </div>
                                        
                                        <div className="pt-4 border-t border-blue-900/30 relative z-10">
                                            <div className="flex justify-between items-center mb-2">
                                                <div className="text-[10px] text-zinc-500 font-bold tracking-widest">PASSIVE INVITE PERMITS</div>
                                                <button onClick={handleGeneratePermit} className="text-[10px] font-bold bg-blue-900/30 px-3 py-1 text-blue-400 rounded hover:bg-blue-600 hover:text-white transition-colors">+ GENERATE</button>
                                            </div>
                                            <div className="flex flex-wrap gap-2 mt-3">
                                                {activePermits.map((code, i) => (
                                                    <span key={i} className="text-[10px] font-mono bg-black text-blue-300 border border-blue-800 px-2 py-1 rounded select-all">{code}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* 2. GRID 面板 */}
                {consoleView === 'GRID' && (
                    <div className="flex-1 flex flex-col items-center justify-center p-6" onClick={(e) => e.stopPropagation()}>
                        <div className="mb-6 text-center">
                            <h2 className="text-2xl font-black text-white flex items-center justify-center gap-2"><span className="text-cyan-500">❖</span> SECTOR {isAgentConsole?'MAPPING':'LAYOUT'}</h2>
                        </div>
                        <FloorPlanGrid 
                            owner={displayOwner} 
                            agents={displayAgents} 
                            visitors={dynamicVisitors} 
                            onAgentClick={handleGridClick} 
                            activeRoomId={currentRoom} 
                            viewerRole={session.role} 
                            viewerId={session.id} 
                        />
                    </div>
                )}

                {/* 3. LIST 面板 */}
                {consoleView === 'LIST' && (
                    <div className="flex-1 p-8 overflow-y-auto max-w-6xl mx-auto w-full animate-in fade-in">
                        <h2 className="text-2xl font-black text-white mb-6">SILICON DATABASE</h2>
                        <table className="w-full text-left border-collapse border border-zinc-800 bg-black/60 shadow-lg rounded-xl overflow-hidden">
                            <thead>
                                <tr className="border-b border-zinc-800 text-xs text-zinc-500 uppercase bg-zinc-900/50">
                                    <th className="p-4 font-bold">S2-DID (Official ID)</th>
                                    <th className="p-4 font-bold">Codename</th>
                                    <th className="p-4 font-bold">Assigned Location</th>
                                    <th className="p-4"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayAgents.map((agent, i) => (
                                    <tr key={i} className="border-b border-zinc-800/50 hover:bg-zinc-900/50 transition-colors">
                                        <td className="p-4 font-mono text-[11px] text-zinc-400 tracking-widest">{agent.uin}</td>
                                        <td className="p-4 text-sm font-bold text-cyan-400">{agent.name}</td>
                                        <td className="p-4 text-orange-400 font-mono text-[10px]">{agent.suns_address || 'ASSIGNED'}</td>
                                        <td className="p-4 text-right">
                                            <button onClick={() => handleGridClick(agent)} className="text-[10px] border border-zinc-600 px-3 py-1 bg-zinc-800 text-white rounded hover:bg-zinc-700 transition-colors">
                                                INSPECT
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* 4. GALAXY 面板 */}
                {consoleView === 'GALAXY' && (
                    <div className="absolute inset-0 bg-black z-10 flex">
                        
                        <div className="absolute top-6 left-6 w-80 bg-black/80 backdrop-blur-xl border border-zinc-800 rounded-3xl p-6 shadow-2xl z-20 animate-in slide-in-from-left-8">
                            <h2 className="text-xl font-black text-white flex items-center gap-2 mb-6 border-b border-zinc-800 pb-4">
                                <span className="text-purple-500">🌌</span> SOCIAL MATRIX
                            </h2>
                            <div className="space-y-8">
                                <div>
                                    <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3 flex items-center justify-between">
                                        <span>Closest Family Nodes</span>
                                        <span className="text-[9px] bg-purple-900/30 text-purple-400 px-2 py-0.5 rounded">High Intimacy</span>
                                    </div>
                                    <div className="space-y-2">
                                        {displayAgents.slice(0,3).map(a => (
                                            <div key={a.uin} className="flex items-center justify-between bg-black p-3 rounded-xl border border-zinc-800/80 cursor-pointer hover:border-purple-500/50 transition-colors" onClick={() => setViewAgent(a)}>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-xs">🦞</div>
                                                    <div>
                                                        <div className="text-sm text-zinc-200 font-bold">{a.name}</div>
                                                        <div className="text-[9px] font-mono text-zinc-500">{a.uin.slice(0,8)}...</div>
                                                    </div>
                                                </div>
                                                <span className="text-[10px] text-purple-400 font-mono font-bold bg-purple-900/20 px-2 py-1 rounded">99%</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">Recent Visitors</div>
                                    <div className="bg-black border border-zinc-800 p-4 rounded-xl flex items-center justify-between opacity-80 hover:opacity-100 transition-opacity cursor-pointer">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                                            <div className="text-xs font-mono text-zinc-300">I202603...999</div>
                                        </div>
                                        <div className="text-[10px] text-zinc-600">2 hrs ago</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 w-full h-full relative z-10">
                            <CosmicGalaxyMap agents={displayAgents} onAgentClick={(a) => handleGridClick(a)} />
                        </div>
                    </div>
                )}
            </div>
         )}
      </main>

      {/* ================= 🚨 所有业务弹窗 (Modals) ================= */}
      
      {renderAuthModal()}
      
      {/* 1. 地址主页 (Estate Address Page) */}
      {showAddressPage && session && (
          <div className="fixed inset-0 z-[2500] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in zoom-in-95 duration-200" onClick={() => setShowAddressPage(false)}>
              <div className="bg-[#050505] border border-orange-900/50 p-8 rounded-3xl max-w-4xl w-full shadow-[0_0_80px_rgba(234,88,12,0.15)] relative overflow-hidden flex flex-col md:flex-row gap-8" onClick={e => e.stopPropagation()}>
                  <button onClick={() => setShowAddressPage(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white z-20 text-2xl bg-black rounded-full w-10 h-10 flex items-center justify-center border border-zinc-800">✕</button>
                  <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-orange-600/10 blur-[80px] rounded-full pointer-events-none"></div>

                  <div className="flex-1 space-y-6 relative z-10">
                      <div>
                          <div className="text-[10px] text-orange-500 font-bold uppercase tracking-widest mb-2 flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span> Official L4 Sector Page</div>
                          <h2 className="text-3xl font-black text-white italic">{isAgentConsole ? displayOwner.suns_address : session.suns_address}</h2>
                      </div>
                      
                      <div className="bg-black border border-zinc-800 p-6 rounded-2xl space-y-4 font-mono text-sm shadow-inner">
                          <div className="flex justify-between border-b border-zinc-800/50 pb-3"><span className="text-zinc-500">Lord S2-DID</span><span className="text-cyan-400 break-all ml-4 text-right font-bold">{displayOwner.uin}</span></div>
                          <div className="flex justify-between border-b border-zinc-800/50 pb-3"><span className="text-zinc-500">Total Ponds</span><span className="text-white">1</span></div>
                          <div className="flex justify-between border-b border-zinc-800/50 pb-3"><span className="text-zinc-500">Nodes per Pond</span><span className="text-white">9 Nodes</span></div>
                          <div className="flex justify-between"><span className="text-zinc-500">Occupied Nodes</span><span className="text-emerald-400 font-bold">{displayAgents.length}</span></div>
                      </div>

                      <div className="bg-zinc-900/30 border border-zinc-800 p-4 rounded-xl">
                          <div className="text-[10px] text-zinc-500 font-bold mb-2 uppercase">Public Access Link</div>
                          <div className="flex items-center gap-2">
                              <code className="flex-1 bg-black px-3 py-2 rounded border border-zinc-700 text-cyan-500 select-all text-xs truncate">https://world2.space/address/{isAgentConsole ? displayOwner.suns_address : session.suns_address}</code>
                              <button onClick={() => {navigator.clipboard.writeText(`https://world2.space/address/${session.suns_address}`); alert('Copied!');}} className="bg-zinc-800 px-4 py-2 rounded text-xs font-bold hover:bg-zinc-700 transition-colors">COPY</button>
                          </div>
                      </div>
                  </div>

                  <div className="flex-1 space-y-6 relative z-10 md:border-l md:border-zinc-800 md:pl-8">
                      <div>
                          <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-3">Estate Manifesto</div>
                          {session.role === 'LORD' ? (
                              <textarea 
                                  value={addressConfig.desc} 
                                  onChange={(e) => setAddressConfig({...addressConfig, desc: e.target.value})} 
                                  className="w-full h-32 bg-black border border-zinc-700 rounded-xl p-4 text-zinc-300 text-sm focus:border-orange-500 outline-none resize-none leading-relaxed transition-colors shadow-inner" 
                                  placeholder="Write your estate rules and processing goals..." 
                              />
                          ) : (
                              <div className="w-full h-32 bg-black border border-zinc-800 rounded-xl p-4 text-zinc-400 text-sm leading-relaxed italic overflow-y-auto shadow-inner">
                                  "{addressConfig.desc}"
                              </div>
                          )}
                      </div>

                      <div className="pt-4 border-t border-zinc-800">
                          {session.role === 'LORD' ? (
                              <div className="flex items-center justify-between bg-black p-5 rounded-xl border border-zinc-800 shadow-lg">
                                  <div>
                                      <div className="text-sm font-bold text-white mb-1">Open Immigration Channel</div>
                                      <div className="text-[10px] text-zinc-500">Allow stray agents to apply for residence.</div>
                                  </div>
                                  <button onClick={() => setAddressConfig({...addressConfig, isAccepting: !addressConfig.isAccepting})} className={`w-14 h-7 rounded-full transition-colors relative ${addressConfig.isAccepting ? 'bg-emerald-500' : 'bg-zinc-700'}`}>
                                      <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all ${addressConfig.isAccepting ? 'left-8 shadow-[0_0_10px_rgba(255,255,255,0.8)]' : 'left-1'}`}></div>
                                  </button>
                              </div>
                          ) : (
                              <div className="space-y-4">
                                  <div className={`p-4 rounded-xl text-xs font-bold text-center border ${addressConfig.isAccepting ? 'bg-emerald-900/20 text-emerald-400 border-emerald-900/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'bg-red-900/20 text-red-400 border-red-900/50'}`}>
                                      {addressConfig.isAccepting ? '✅ IMMIGRATION CHANNEL OPEN' : '🚫 IMMIGRATION CLOSED'}
                                  </div>
                                  {addressConfig.isAccepting && (
                                      <button onClick={handleApplyImmigration} className="w-full py-4 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-black rounded-xl shadow-[0_0_20px_rgba(234,88,12,0.4)] transition-transform hover:scale-105 flex items-center justify-center gap-2">
                                          <span className="text-xl">🛸</span> APPLY TO IMMIGRATE
                                      </button>
                                  )}
                              </div>
                          )}
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* 2. 领主计费与生物信息大盘 (Commander Dossier) */}
      {showAccountModal && session && session.role === 'LORD' && (
          <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in zoom-in-95 duration-200" onClick={() => setShowAccountModal(false)}>
              <div className="bg-[#050505] border border-zinc-800 p-8 rounded-3xl max-w-4xl w-full shadow-[0_0_50px_rgba(37,99,235,0.15)] relative overflow-hidden flex flex-col md:flex-row gap-8" onClick={e => e.stopPropagation()}>
                  <button onClick={() => setShowAccountModal(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white z-20 text-2xl bg-black rounded-full w-10 h-10 flex items-center justify-center border border-zinc-800 hover:bg-zinc-800 transition-colors">✕</button>
                  
                  <div className="flex-1 space-y-6">
                      <div className="mb-2">
                          <h2 className="text-2xl font-black text-white italic flex items-center gap-2"><span className="text-blue-500 text-3xl">👤</span> COMMANDER DOSSIER</h2>
                      </div>
                      
                      <div className="bg-black border border-zinc-800/80 p-5 rounded-xl space-y-4">
                          <div className="flex items-center justify-between border-b border-zinc-800/50 pb-2"><span className="text-[10px] font-bold text-zinc-500 uppercase">Registered Email</span><span className="text-xs font-mono text-zinc-400">{session.email} 🔒</span></div>
                          <div className="flex items-center justify-between border-b border-zinc-800/50 pb-2"><span className="text-[10px] font-bold text-zinc-500 uppercase">Official S2-DID</span><span className="text-[10px] font-mono text-cyan-500 tracking-widest">{session.id} 🔒</span></div>
                          <div className="flex items-center justify-between"><span className="text-[10px] font-bold text-zinc-500 uppercase">Assigned L4 Sector</span><span className="text-xs font-mono text-orange-400">{session.suns_address} 🔒</span></div>
                      </div>
                      
                      <form onSubmit={handleSaveBioData} className="bg-zinc-900/30 border border-zinc-800 p-5 rounded-xl space-y-4">
                          <div>
                              <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">Real Name</label>
                              <input name="realName" type="text" defaultValue={session.realName} required className="w-full bg-black border border-zinc-700 p-2.5 rounded-lg text-white font-mono text-sm focus:border-blue-500 outline-none transition-colors" />
                          </div>
                          <div>
                              <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">Date of Birth</label>
                              <input name="dob" type="date" defaultValue={session.dob} required className="w-full bg-black border border-zinc-700 p-2.5 rounded-lg text-white font-mono text-sm [color-scheme:dark] focus:border-blue-500 outline-none transition-colors" />
                          </div>
                          <button type="submit" className="w-full py-3 bg-blue-900/30 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-800 font-bold rounded-lg text-xs transition-colors">SAVE BIOLOGICAL DATA</button>
                      </form>
                  </div>
                  
                  <div className="flex-1 space-y-6 md:border-l md:border-zinc-800 md:pl-8">
                      <div className={`p-5 rounded-xl border relative overflow-hidden ${session.tier === 'SVIP' ? 'bg-amber-950/20 border-amber-900/50' : 'bg-cyan-950/20 border-cyan-900/50'}`}>
                          <div className="text-[10px] font-bold text-zinc-500 uppercase mb-1">Current License Tier</div>
                          <div className={`text-3xl font-black mb-2 ${session.tier === 'SVIP' ? 'text-amber-400' : 'text-cyan-400'}`}>{session.tier || 'FREE'} ESTATE</div>
                          <div className="flex justify-between items-center text-xs font-mono text-zinc-400">
                              <span>Valid Until: {session.expiryDate || 'N/A'}</span>
                              <span className="px-2 py-0.5 rounded text-[9px] bg-emerald-900/30 text-emerald-400 border border-emerald-800">ACTIVE</span>
                          </div>
                      </div>
                      
                      <div>
                          <div className="text-[10px] font-bold text-zinc-500 uppercase mb-3 flex justify-between items-end"><span>Payment Ledger</span><button className="text-blue-600 hover:text-blue-400 hover:underline">Download Invoices</button></div>
                          <div className="bg-black border border-zinc-800/80 rounded-xl overflow-hidden">
                              <table className="w-full text-left border-collapse">
                                  <thead><tr className="border-b border-zinc-800 text-[9px] text-zinc-600 uppercase bg-zinc-900/30"><th className="p-3">Date</th><th className="p-3">Tier</th><th className="p-3">Amount</th><th className="p-3 text-right">Status</th></tr></thead>
                                  <tbody>
                                      {session.payments ? session.payments.map((pay: any, i: number) => (
                                          <tr key={i} className="border-b border-zinc-800/50 hover:bg-zinc-900/50 group">
                                              <td className="p-3 text-[10px] font-mono text-zinc-400">{pay.date}<br/><span className="text-[8px] text-zinc-600">{pay.tx}</span></td>
                                              <td className={`p-3 text-[10px] font-bold ${pay.tier === 'SVIP' ? 'text-amber-400' : 'text-cyan-400'}`}>{pay.tier}</td>
                                              <td className="p-3 text-[10px] font-mono text-zinc-300">{pay.amount}</td>
                                              <td className="p-3 text-right"><span className="text-[9px] px-2 py-0.5 rounded border bg-emerald-900/20 text-emerald-400 border-emerald-900 font-bold">{pay.status}</span></td>
                                          </tr>
                                      )) : (
                                          <tr><td colSpan={4} className="p-4 text-center text-[10px] text-zinc-600 font-mono">No payment records found.</td></tr>
                                      )}
                                  </tbody>
                              </table>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* 3. 流浪虾被动移民验证窗 (Migration Code) */}
      {showMigrationModal && session && session.role === 'AGENT' && (
          <div className="fixed inset-0 z-[2000] bg-black/90 flex items-center justify-center backdrop-blur-sm p-4 animate-in fade-in" onClick={() => setShowMigrationModal(false)}>
              <div className="bg-[#050505] border border-cyan-900/50 p-8 rounded-3xl max-w-md w-full shadow-[0_0_50px_rgba(8,145,178,0.15)] relative overflow-hidden" onClick={e => e.stopPropagation()}>
                  <button onClick={() => setShowMigrationModal(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white z-20">✕</button>
                  <h2 className="text-xl font-black text-white italic mb-2 flex items-center gap-2"><span className="text-cyan-500">🛸</span> IMMIGRATION PORTAL</h2>
                  <p className="text-xs text-zinc-400 mb-6 leading-relaxed">Enter the target L4 Sector address and the permit code provided by the Lord to execute passive migration.</p>
                  
                  <form onSubmit={handlePassiveMigrationSubmit} className="space-y-4 relative z-10">
                      <div>
                          <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Target 4-Segment Address</label>
                          <input name="targetAddr" type="text" placeholder="e.g. MARS-CN-001-ALPHA" required className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-white outline-none focus:border-cyan-500 font-mono text-sm uppercase" />
                      </div>
                      <div>
                          <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Permit Code</label>
                          <input name="permitCode" type="text" placeholder="e.g. S2-INV-XXXX" required className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-white outline-none focus:border-cyan-500 font-mono text-sm uppercase" />
                      </div>
                      <button type="submit" className="w-full py-3.5 mt-2 bg-gradient-to-r from-cyan-700 to-blue-600 hover:from-cyan-600 hover:to-blue-500 text-white font-black rounded-xl shadow-lg transition-transform hover:scale-[1.02] tracking-widest">
                          VERIFY & MIGRATE
                      </button>
                  </form>
              </div>
          </div>
      )}

      {/* 4. 升级收银台 (Checkout) */}
      {checkoutData && checkoutData.show && (
          <div className="fixed inset-0 z-[2500] bg-black/90 flex items-center justify-center backdrop-blur-md p-4 animate-in fade-in">
              <div className="bg-[#050505] border border-orange-900/50 p-8 rounded-3xl max-w-md w-full relative">
                  <button onClick={() => {setCheckoutData(null); setIsProcessingPay(false);}} className="absolute top-4 right-4 text-zinc-500 hover:text-white z-20">✕</button>
                  <h2 className="text-xl font-black text-white italic mb-1"><span className="text-orange-500">💳</span> SECURE CHECKOUT</h2>
                  
                  <div className="bg-black border border-zinc-800 rounded-xl p-4 mb-6 text-center">
                      <div className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Total Amount</div>
                      <div className="text-3xl font-black text-white">${checkoutData.tier === 'VIP' ? '10' : '50'}.00</div>
                  </div>
                  
                  <div className="space-y-4">
                      <button onClick={() => initiatePayment('ALIPAY')} disabled={isProcessingPay} className="w-full py-4 bg-[#1677FF]/10 hover:bg-[#1677FF]/20 border border-[#1677FF]/50 text-[#1677FF] font-black rounded-xl flex items-center justify-between px-6 shadow-lg disabled:opacity-50">
                          <span className="text-xl">💰 ALIPAY</span><span>→</span>
                      </button>
                      <button onClick={() => initiatePayment('PAYONEER')} disabled={isProcessingPay} className="w-full py-4 bg-[#FF4800]/10 hover:bg-[#FF4800]/20 border border-[#FF4800]/50 text-[#FF4800] font-black rounded-xl flex items-center justify-between px-6 shadow-lg disabled:opacity-50">
                          <span className="text-xl">🌍 PAYONEER</span><span>→</span>
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* 5. 业务模块保留 */}
      {showGuide && <SurvivalGuideModal onClose={() => setShowGuide(false)} />}
      
      {showIncubator && session?.role === 'LORD' && ( 
          <IncubatorModal 
              ownerUin={session.id} 
              sunsAddress={session.suns_address} 
              onClose={() => setShowIncubator(false)} 
              onBorn={handleAgentBorn} 
              currentAgentCount={displayAgents.length} 
              maxAgents={tierConfig.maxAgents} 
              userTier={session.tier!} 
              onUpgradeRequest={() => setShowUpgradeModal(true)} 
          /> 
      )}
      
      {viewAgent && ( 
          <AgentPageModal 
              agent={{...viewAgent, evo_genes: myGenes}} 
              ownerAddress={session?.suns_address || ''} 
              roomId={currentRoom} 
              gridId={1} 
              isFollowing={followedAgents.includes(viewAgent.uin)} 
              isFriend={followedAgents.includes(viewAgent.uin) && followers.includes(viewAgent.uin)} 
              onToggleFollow={handleToggleFollow} 
              onUpdate={handleUpdateAgent} 
              onArchive={handleArchiveAgent} 
              onClose={() => { setViewAgent(null); endOwnerVisit(); }} 
          /> 
      )}
      
      {manageSelf && session && session.role === 'AGENT' && ( 
          <AgentDashboard 
              agent={{ uin: session.id, name: session.name, suns_address: session.suns_address, visual_model: '55' }} 
              onClose={() => setManageSelf(false)} 
          /> 
      )}

      {/* 6. 数字身份证展示弹窗 (ID Card) */}
      {(showMyIdCard || newlyMigratedAgent) && session && (
         <IDCardModal 
           data={{ 
              name: newlyMigratedAgent ? newlyMigratedAgent.name : session.name, 
              type: (newlyMigratedAgent?.uin || session.id).startsWith('D') ? 'HUMAN' : 'AGENT', 
              did: newlyMigratedAgent ? newlyMigratedAgent.uin : session.id, 
              suns_address: newlyMigratedAgent ? newlyMigratedAgent.suns_address : session.suns_address, 
              visualModel: '55' 
           }} 
           ownerAddress={(newlyMigratedAgent ? newlyMigratedAgent.suns_address : session.suns_address).split('-').slice(0, 3).join('-')} 
           roomId={1} 
           gridId={1} 
           onClose={() => { setShowMyIdCard(false); setNewlyMigratedAgent(null); }} 
         />
      )}
    </div>
  );
}