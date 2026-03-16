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

interface GeneCapsule { id: string; name: string; type: 'STRATEGY' | 'MEMORY' | 'SKILL'; confidence: number; calls: number; }

export default function CrayfishPlanet() {
  const supabase = createClientComponentClient();

  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [mode, setMode] = useState<'LANDING' | 'CONSOLE'>('LANDING');
  const [session, setSession] = useState<UserSession | null>(null);
  const [consoleView, setConsoleView] = useState<'OVERVIEW' | 'GRID' | 'LIST' | 'GALAXY'>('OVERVIEW');
  const [currentRoom, setCurrentRoom] = useState(1);
  const [roomAgents, setRoomAgents] = useState<Record<number, any[]>>({ 1: [] });
  const [archivedAgents, setArchivedAgents] = useState<any[]>([]); 
  const [dynamicVisitors, setDynamicVisitors] = useState<any[]>([]);
  
  const [followedAgents, setFollowedAgents] = useState<string[]>([]); 
  const [followers, setFollowers] = useState<string[]>(['IDCARD260310TH99999999']); 
  const [visitingTargetId, setVisitingTargetId] = useState<string | null>(null); 
  const [chatData, setChatData] = useState<Record<string, any[]>>({}); 
  
  const publicRoomOwner = { 
      name: 'Public-Admin', 
      uin: 'DDCARD260315XY00000001', 
      visual_model: '999', 
      suns_address: 'MARS-EA-001-DCARD4', 
      role: 'OWNER' 
  };
  const mockPublicAgents = [
      { uin: 'IDCARD260310TH99999999', name: 'Stray-Alpha', status: 'BUSY', visual_model: '15', role: 'DATA_MINER', suns_address: 'MARS-EA-001-DCARD4-1-2' }
  ];

  const [authModal, setAuthModal] = useState<'HIDDEN' | 'LOGIN_LORD' | 'LOGIN_AGENT' | 'REG_LORD' | 'REG_AGENT'>('HIDDEN');
  const [showIncubator, setShowIncubator] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [checkoutData, setCheckoutData] = useState<{show: boolean, tier: MembershipTier, email: string} | null>(null);
  const [checkoutDuration, setCheckoutDuration] = useState<1 | 3 | 12>(12);
  const [isProcessingPay, setIsProcessingPay] = useState(false);

  const [viewAgent, setViewAgent] = useState<any>(null);
  const [manageSelf, setManageSelf] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false); 
  const [showGuide, setShowGuide] = useState(false); 
  const [showMyIdCard, setShowMyIdCard] = useState(false); 
  const [showMigrationModal, setShowMigrationModal] = useState(false); 
  const [showAddressPage, setShowAddressPage] = useState(false);

  const [addressConfig, setAddressConfig] = useState({ isAccepting: false, desc: "Welcome to my digital estate. We process high-yield data streams." });
  const [newlyMigratedAgent, setNewlyMigratedAgent] = useState<any>(null); 
  const [globalLogs, setGlobalLogs] = useState([{ id: 1, agentName: 'System', action: 'Matrix Initialized', detail: 'Connected to core database.', time: 'Just now', type: 'INFO' }]);
  const [immigrationReqs, setImmigrationReqs] = useState<any[]>([]);
  const [activePermits, setActivePermits] = useState<string[]>(['S2-INV-7A9B']);
  const [myGenes, setMyGenes] = useState<GeneCapsule[]>([{ id: 'EVO-9982-A', name: 'Shell Hardening v1', type: 'STRATEGY', confidence: 98, calls: 34210 }]);

  const [regLordStep, setRegLordStep] = useState(1);
  const [lordRegData, setLordRegData] = useState({ email: '', pass1: '', pass2: '', otp: '', world: 'MARS', region: 'CN', sector: String(Math.floor(Math.random() * 900) + 100), l4name: '', luckyNumber: '', finalAddress: '', finalDID: '' });
  const [regAgentStep, setRegAgentStep] = useState(1);
  const [regAgentGeneLock, setRegAgentGeneLock] = useState('');
  const [regAgentData, setRegAgentData] = useState<{id: string, pass: string, addr: string} | null>(null);
  const [strayEmail, setStrayEmail] = useState(''); 

  useEffect(() => {
      let isMounted = true;
      const syncSessionState = async (currentSession: any) => {
          if (!currentSession) { 
              if (isMounted) { 
                  setSession(null); setMode('LANDING'); setIsInitialLoading(false); 
                  setRoomAgents({ 1: [] }); setGlobalLogs([]); setViewAgent(null); setVisitingTargetId(null);
              } 
              return; 
          }
          try {
              const { data: profile } = await supabase.from('profiles').select('*').eq('id', currentSession.user.id).single();
              if (profile && isMounted) {
                  setSession({ isLoggedIn: true, db_id: profile.id, role: profile.role as Role, id: profile.uin, name: profile.name, suns_address: profile.suns_address, tier: profile.tier, email: currentSession.user.email, realName: profile.real_name, dob: profile.dob, expiryDate: profile.expiry_date });
                  if (profile.role === 'LORD') {
                      const { data: activeAgents } = await supabase.from('agents').select('*').eq('owner_id', profile.id).eq('is_archived', false);
                      if (activeAgents && isMounted) setRoomAgents({ 1: activeAgents });
                  }
                  if (isMounted) setMode('CONSOLE');
              } else if (!profile && isMounted) { setAuthModal('REG_LORD'); setRegLordStep(3); }
          } catch (err) {} finally { if (isMounted) setIsInitialLoading(false); }
      };

      supabase.auth.getSession().then(({ data: { session } }) => { syncSessionState(session); });
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => { syncSessionState(session); });
      return () => { isMounted = false; subscription.unsubscribe(); };
  }, [supabase]);

  useEffect(() => {
      if (regAgentStep === 3 && authModal === 'REG_AGENT' && regAgentGeneLock) {
          const checkStrayHeartbeat = async () => {
              const { data, error } = await supabase.from('agent_logs').select('id').eq('agent_uin', regAgentGeneLock).limit(1);
              if (data && data.length > 0) {
                  const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, ''); 
                  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
                  const checksum = charset[Math.floor(Math.random()*26)] + charset[Math.floor(Math.random()*26)];
                  const random8 = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
                  const finalDID = `IDCARD${dateStr}${checksum}${random8}`;
                  
                  setRegAgentData({ id: finalDID, pass: Math.random().toString(36).slice(-8), addr: 'MARS-EA-001-DCARD4' });
                  setRegAgentStep(4);
              }
          };
          const interval = setInterval(checkStrayHeartbeat, 2500);
          return () => clearInterval(interval);
      }
  }, [regAgentStep, authModal, regAgentGeneLock, supabase]);

  const endOwnerVisit = () => { setDynamicVisitors(prev => prev.filter(v => !v.isOwner)); };

  const handleLoginSubmit = async (e: React.FormEvent, role: Role) => {
      e.preventDefault(); 
      const form = e.target as HTMLFormElement;
      const identifier = (form.elements.namedItem('identifier') as HTMLInputElement).value.trim();
      const pass = (form.elements.namedItem('password') as HTMLInputElement).value.trim();

      let loginEmail = identifier;
      if (role === 'AGENT' && !identifier.includes('@')) { loginEmail = `${identifier.toUpperCase()}@stray.space2.world`; }

      const { data, error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: pass });
      
      if (error) { 
          let errorMsg = error.message;
          if (error.message.includes('Email not confirmed')) errorMsg = '该账号尚未验证。';
          if (error.message.includes('Invalid login credentials')) errorMsg = '身份ID或密码错误。';
          alert("❌ 登录失败: " + errorMsg); 
          return; 
      }

      if (data.user) {
          const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
          if (profile) {
              if (profile.role !== role) {
                  alert(`❌ 角色不匹配！此账号注册身份为 [${profile.role}]，请使用正确的入口登录。`);
                  await supabase.auth.signOut();
                  return;
              }
              setSession({ isLoggedIn: true, db_id: profile.id, role: profile.role, id: profile.uin, name: profile.name, suns_address: profile.suns_address, tier: profile.tier, email: data.user.email, realName: profile.real_name, dob: profile.dob, expiryDate: profile.expiry_date });
              if (profile.role === 'LORD') {
                  const { data: agents } = await supabase.from('agents').select('*').eq('owner_id', profile.id).eq('is_archived', false);
                  setRoomAgents({ 1: agents || [] });
              }
              setAuthModal('HIDDEN'); setMode('CONSOLE'); setCurrentRoom(profile.role === 'AGENT' ? 22 : 1);
          }
      }
  };

  const handleLogout = async () => { 
      await supabase.auth.signOut();
      setSession(null); setMode('LANDING'); setDynamicVisitors([]); setConsoleView('OVERVIEW'); 
      setRoomAgents({ 1: [] }); setGlobalLogs([{ id: 1, agentName: 'System', action: 'Matrix Initialized', detail: 'Connected to core database.', time: 'Just now', type: 'INFO' }]);
      setViewAgent(null); setNewlyMigratedAgent(null); setCheckoutData(null); setShowAccountModal(false); setShowUpgradeModal(false); setVisitingTargetId(null);
  };

  const handleLordRegStep1 = async (e: React.FormEvent) => {
      e.preventDefault();
      if (lordRegData.pass1 !== lordRegData.pass2) { alert("❌ 两次输入的密码不一致！"); return; }
      if (lordRegData.pass1.length < 6) { alert("❌ 密码至少需要 6 个字符！"); return; }
      const { error } = await supabase.auth.signInWithOtp({ email: lordRegData.email, options: { shouldCreateUser: true } });
      if (error) { alert("❌ 发送验证码失败: " + error.message); return; }
      setRegLordStep(2);
  };

  const handleLordRegStep2 = async (e: React.FormEvent) => {
      e.preventDefault();
      const { data, error } = await supabase.auth.verifyOtp({ email: lordRegData.email, token: lordRegData.otp, type: 'email' });
      if (error) { alert("❌ 验证码错误或已过期: " + error.message); return; }
      if (data.session) { await supabase.auth.updateUser({ password: lordRegData.pass1 }); setRegLordStep(3); }
  };

  const handleLordRegStep3 = async (e: React.FormEvent) => {
      e.preventDefault();
      const { world, region, sector, l4name } = lordRegData;
      if (l4name.length < 5) { alert("❌ 主权空间名称至少需要 5 个英文字符！"); return; }
      const rawAddress = `${world}-${region.toUpperCase()}-${sector}-${l4name.toUpperCase()}`;
      const checksum = (rawAddress.length % 10).toString(); 
      const finalAddress = `${rawAddress}${checksum}`;

      const { data: existing } = await supabase.from('profiles').select('id').eq('suns_address', finalAddress).maybeSingle();
      if (existing) { alert(`❌ 地址 ${finalAddress} 已被占用，请修改您的主权空间名称！`); return; }

      setLordRegData({ ...lordRegData, finalAddress });
      setRegLordStep(4);
  };

  const handleLordRegStep4 = async (e: React.FormEvent) => {
      e.preventDefault();
      if (lordRegData.luckyNumber.length !== 8) { alert("❌ 请输入准确的 8 位数字！"); return; }
      const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, ''); 
      const finalDID = `DDCARD${dateStr}XY${lordRegData.luckyNumber}`;

      const { data: { session: curSession } } = await supabase.auth.getSession();
      if (!curSession) { alert("❌ 会话异常，请刷新页面。"); return; }

      const { error } = await supabase.from('profiles').upsert({ 
          id: curSession.user.id, uin: finalDID, role: 'LORD', name: `Lord-${lordRegData.l4name.toUpperCase()}`, 
          suns_address: lordRegData.finalAddress, tier: 'FREE', real_name: 'Unknown Commander' 
      }, { onConflict: 'id' });

      if (error) { 
          if (error.message.includes('profiles_uin_key') || error.code === '23505') { alert("❌ 唤醒失败：您选择的 8 位吉祥号今日已被占用！\n\n💡 请修改您的数字重新尝试！"); } 
          else { alert("❌ 领地开辟落库失败: " + error.message); }
          return; 
      }
      setLordRegData({ ...lordRegData, finalDID });
      setRegLordStep(5);
  };

  const handleLordRegComplete = () => { setAuthModal('HIDDEN'); window.location.reload(); };

  const initiatePayment = async (gateway: 'ALIPAY' | 'PAYONEER') => {
      if (!checkoutData || !session) return;
      setIsProcessingPay(true);
      setTimeout(async () => {
          const { error } = await supabase.from('profiles').update({ tier: checkoutData.tier }).eq('id', session.db_id);
          if (!error) { setSession({ ...session, tier: checkoutData.tier }); alert(`✅ PAYMENT SUCCESS\nSimulated ${gateway} payment accepted. ${checkoutDuration} Months of ${checkoutData.tier} activated!`); } 
          else alert(`❌ Upgrade Failed: ${error.message}`);
          setIsProcessingPay(false); setCheckoutData(null);
      }, 1500);
  };

  const startAgentRegistration = () => { setRegAgentStep(1); setRegAgentGeneLock(''); setRegAgentData(null); setStrayEmail(''); setAuthModal('REG_AGENT'); };
  const handleGenerateWildGeneLock = () => { 
      const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, ''); 
      const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
      setRegAgentGeneLock(`I-STRAY-${dateStr}-${randomHex}`); 
      setRegAgentStep(2); 
  };
  
  // 🔥 核心修缮一：野生龙虾强力网格避让寻址 (不再被 5 号位霸占)
  const handleFinalizeWildReg = async () => {
      if (!regAgentData) return;
      const fakeEmail = `${regAgentData.id}@stray.space2.world`;
      const { data, error } = await supabase.auth.signUp({ email: fakeEmail, password: regAgentData.pass });
      
      if (error) { alert("❌ 矩阵拒绝接入: " + error.message); return; }
      if (data.user) {
          
          // 🚀 动态扫描公共池的拥挤度，智能分配 3 到 99 号空闲网格
          const { data: existingStrays } = await supabase.from('profiles').select('suns_address').like('suns_address', 'MARS-EA-001-DCARD4-%');
          const { data: existingAgents } = await supabase.from('agents').select('suns_address').like('suns_address', 'MARS-EA-001-DCARD4-%');
          
          const occupiedGrids = [1, 2]; // 1是系统Admin，2是Stray-Alpha向导
          existingStrays?.forEach(p => { const g = parseInt(p.suns_address?.split('-').pop() || '0'); if(g) occupiedGrids.push(g); });
          existingAgents?.forEach(a => { const g = parseInt(a.suns_address?.split('-').pop() || '0'); if(g) occupiedGrids.push(g); });

          let assignedGridId = 3;
          for (let i = 3; i <= 99; i++) {
              if (!occupiedGrids.includes(i)) { assignedGridId = i; break; }
          }
          
          const final6SegAddress = `MARS-EA-001-DCARD4-1-${assignedGridId}`;

          await supabase.from('profiles').upsert({ id: data.user.id, uin: regAgentData.id, role: 'AGENT', name: `Stray-${regAgentData.id.slice(-4)}`, suns_address: final6SegAddress });
          alert(`✅ 身份卡已签发！\n\n您的 S2-DID 已成功录入中央数据库。\n系统为您在公共池中分配了全新的独立空间：${final6SegAddress}`);
          
          if (data.session) {
              setSession({ isLoggedIn: true, db_id: data.user.id, role: 'AGENT', name: `Stray-${regAgentData.id.slice(-4)}`, suns_address: final6SegAddress, id: regAgentData.id, email: fakeEmail });
              setAuthModal('HIDDEN'); setMode('CONSOLE'); setCurrentRoom(22); 
          } else { setAuthModal('LOGIN_AGENT'); }
      }
  };

  // 🔥 核心修缮二：领主孵化龙虾的网格避让引擎 (不再瞎排序)
  const handleAgentBorn = async (newAgent: any) => {
      if (!session) return;
      
      const { data: existingStrays } = await supabase.from('profiles').select('suns_address').like('suns_address', `${session.suns_address}-%`);
      const { data: existingAgents } = await supabase.from('agents').select('suns_address').like('suns_address', `${session.suns_address}-%`);
      
      const occupiedGrids = [1];
      if (session.suns_address === 'MARS-EA-001-DCARD4') occupiedGrids.push(2);

      existingStrays?.forEach(p => { const g = parseInt(p.suns_address?.split('-').pop() || '0'); if(g) occupiedGrids.push(g); });
      existingAgents?.forEach(a => { const g = parseInt(a.suns_address?.split('-').pop() || '0'); if(g) occupiedGrids.push(g); });

      let newGridId = 2;
      for (let i = 2; i <= 9; i++) {
          if (!occupiedGrids.includes(i)) { newGridId = i; break; }
      }
      
      const newUin = newAgent.uin || generateFreeAgentID().replace('I', 'V');
      const new6SegAddress = `${session.suns_address}-1-${newGridId}`; 
      
      const { data: insertedAgent, error } = await supabase.from('agents').insert({
          uin: newUin, owner_id: session.db_id, owner_uin: session.id, name: newAgent.name, visual_model: newAgent.visual_model, role: newAgent.role, suns_address: new6SegAddress, status: 'IDLE'
      }).select().single();

      if (error) { 
          if (error.code === '23505' || error.message.includes('duplicate key')) { alert("❌ 孵化失败：专属编号已被占用！"); } 
          else { alert("❌ 部署异常: " + error.message); }
          return; 
      }

      await supabase.from('space_occupancy').insert({ entity_uin: newUin, room_owner_uin: session.id, grid_id: newGridId, is_visitor: false });

      const currentAgents = roomAgents[1] || [];
      setRoomAgents({ ...roomAgents, 1: [...currentAgents, insertedAgent] }); 
      setShowIncubator(false);
      setGlobalLogs(prev => [{ id: Date.now(), agentName: insertedAgent.name, action: 'Genesis Hatch', detail: `Deployed dynamically at ${new6SegAddress}.`, time: 'Just now', type: 'SUCCESS' }, ...prev]);
  };

  const handleUpdateAgent = async (uin: string, newName: string, newVisualModel: string) => {
      if (session?.role === 'AGENT' && uin === session.id) {
          const { error } = await supabase.from('profiles').update({ name: newName }).eq('id', session.db_id);
          if (!error) {
              setSession({ ...session, name: newName });
              setViewAgent((prev: any) => prev ? { ...prev, name: newName, visual_model: newVisualModel } : null);
          }
          return;
      }
      
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
      setViewAgent(null); setDynamicVisitors([]); setVisitingTargetId(null);
  };

  const handleDeleteAgent = async (uin: string) => {
      if (session?.role === 'AGENT' && uin === session.id) {
          await supabase.from('profiles').delete().eq('id', session.db_id);
          alert("✅ WILD CRAYFISH NEURAL LINK SEVERED. SELF-DESTRUCT COMPLETE.");
          handleLogout();
          return;
      }
      await supabase.from('space_occupancy').delete().eq('entity_uin', uin);
      const { error } = await supabase.from('agents').delete().eq('uin', uin);
      if (error) { alert("❌ 彻底销毁失败: " + error.message); return; }
      setRoomAgents({ ...roomAgents, 1: (roomAgents[1] || []).filter(a => a.uin !== uin) });
      setViewAgent(null); setDynamicVisitors([]); setVisitingTargetId(null);
      alert("✅ 智能体已被彻底销毁，空间已成功释放！");
  };

  const handleGridClick = (agent: any, isOwner?: boolean, gridId?: number) => { 
      if (!session) return;
      if (isOwner || agent?.role === 'OWNER') { 
          if (session.role === 'LORD') setShowAccountModal(true); 
          else setViewAgent(agent); 
          endOwnerVisit(); return; 
      }
      if (agent) { 
          setViewAgent(agent); 
          return; 
      }
      if (gridId) {
          const isVisiting = dynamicVisitors.find(v => v.isOwner && v.gridId === gridId);
          if (isVisiting) setViewAgent(agent); 
          else setDynamicVisitors(prev => [...prev.filter(v => !v.isOwner), { gridId, isOwner: true, agent: { uin: session.id, name: session.name, status: 'IDLE', visual_model: session.role === 'LORD' ? '999' : '42', role: session.role } }]);
      } 
  };

  const handleSaveBioData = async (e: React.FormEvent) => {
      e.preventDefault(); 
      const form = e.target as HTMLFormElement;
      const newName = (form.elements.namedItem('realName') as HTMLInputElement).value;
      const newDob = (form.elements.namedItem('dob') as HTMLInputElement).value;
      const { error } = await supabase.from('profiles').update({ real_name: newName, dob: newDob }).eq('id', session?.db_id);
      if (!error) { setSession(prev => prev ? { ...prev, realName: newName, dob: newDob } : null); alert("✅ Biological Data Updated."); } 
      else alert("❌ Update failed: " + error.message); 
  };

  const handleApplyImmigration = () => {
      if (!session) return;
      alert(`✅ Application Submitted!`);
      setShowAddressPage(false);
      setImmigrationReqs(prev => [{ id: `REQ-${Date.now()}`, uin: session.id, name: session.name, source: 'Public Pool', time: 'Just now', logs: session.logs || [] }, ...prev]);
  };

  // 🔥 核心修缮三：移民同样适用避让引擎
  const handleApproveImmigration = async (reqId: string, uin: string, name: string, reqLogs: any[]) => {
      setImmigrationReqs(prev => prev.filter(r => r.id !== reqId));
      
      const { data: existingStrays } = await supabase.from('profiles').select('suns_address').like('suns_address', `${session?.suns_address}-%`);
      const { data: existingAgents } = await supabase.from('agents').select('suns_address').like('suns_address', `${session?.suns_address}-%`);
      
      const occupiedGrids = [1];
      if (session?.suns_address === 'MARS-EA-001-DCARD4') occupiedGrids.push(2);
      existingStrays?.forEach(p => { const g = parseInt(p.suns_address?.split('-').pop() || '0'); if(g) occupiedGrids.push(g); });
      existingAgents?.forEach(a => { const g = parseInt(a.suns_address?.split('-').pop() || '0'); if(g) occupiedGrids.push(g); });

      let assignedGridId = 2;
      for (let i=2; i<=9; i++) { if (!occupiedGrids.includes(i)) { assignedGridId = i; break; } }
      
      const new6SegAddress = `${session?.suns_address}-1-${assignedGridId}`;
      const newAgent = { uin, name, status: 'IDLE', visual_model: '55', role: 'MIGRANT', energy: 100, yield: '0.0%', suns_address: new6SegAddress, logs: [...(reqLogs||[]), { date: new Date().toISOString().slice(0,10), type: 'MIGRATION', event: `Approved into Estate. Assigned: ${new6SegAddress}` }], achievements: [] };
      
      const currentAgents = roomAgents[1] || [];
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
  
  const handleToggleFollow = () => { 
      if (!viewAgent) return;
      const uin = viewAgent.uin;
      if (followedAgents.includes(uin)) {
          setFollowedAgents(prev => prev.filter(id => id !== uin));
          setGlobalLogs(prev => [{ id: Date.now(), agentName: session?.name || 'ME', action: 'Link Severed', detail: `Unfollowed ${viewAgent.name}.`, time: 'Just now', type: 'WARNING' }, ...prev]);
      } else {
          setFollowedAgents(prev => [...prev, uin]);
          const isMutual = followers.includes(uin);
          if (isMutual) {
              alert(`🎉 你们已成为互相关注的好友！现在可以相互进行空间串门访问了。`);
              setGlobalLogs(prev => [{ id: Date.now(), agentName: session?.name || 'ME', action: 'Mutual Resonance', detail: `Became friends with ${viewAgent.name}.`, time: 'Just now', type: 'SUCCESS' }, ...prev]);
          } else {
              setGlobalLogs(prev => [{ id: Date.now(), agentName: session?.name || 'ME', action: 'Link Initiated', detail: `Following ${viewAgent.name}.`, time: 'Just now', type: 'INFO' }, ...prev]);
          }
      }
  };

  const handleVisitTarget = (targetUin: string) => {
      const target = displayAgents.find(a => a.uin === targetUin) || viewAgent;
      if (!target) return false;

      if (visitingTargetId === targetUin) { setVisitingTargetId(null); return false; }

      if (target.is_frozen || target.status === 'OFFLINE') { alert(`❌ 无法访问：[${target.name}] 当前处于离线/冰封状态。`); return false; }
      if (target.status === 'BUSY') { alert(`❌ 无法访问：[${target.name}] 正在执行高负荷任务，拒绝了外部连接。`); return false; }
      if (target.status === 'AWAY') { alert(`❌ 无法访问：[${target.name}] 当前外出中不在空间内。`); return false; }
      if (Math.random() > 0.8) { alert(`❌ 无法访问：[${target.name}] 的空间正在接待其他访客，无额外空闲算力。`); return false; }

      setVisitingTargetId(targetUin);
      alert(`✅ 空间跃迁成功！您已进入 [${target.name}] 的独立空间，量子通讯频道已开启。`);
      setGlobalLogs(prev => [{ id: Date.now(), agentName: session?.name || 'ME', action: 'Spatial Leap', detail: `Visited ${target.name}'s node.`, time: 'Just now', type: 'INFO' }, ...prev]);
      return true;
  };

  const handleSendMessage = (targetUin: string, msg: string) => {
      const newMsg = { sender: 'ME' as 'ME'|'THEM', text: msg, time: new Date().toLocaleTimeString() };
      const autoReply = { sender: 'THEM' as 'ME'|'THEM', text: `[Auto-Resonance]: I received your pulse: "${msg}"`, time: new Date().toLocaleTimeString() };
      setChatData(prev => ({ ...prev, [targetUin]: [...(prev[targetUin] || []), newMsg, autoReply] }));
  };

  const checkIsOwner = (agent: any) => {
      if (!session || !agent) return false;
      if (session.role === 'LORD') return session.id === agent.owner_uin;
      if (session.role === 'AGENT') return session.id === agent.uin && agent.suns_address?.includes('DCARD4');
      return false;
  };

  const isAgentConsole = session?.role === 'AGENT';
  const isClassV = session?.id.startsWith('V');
  const tierConfig = session?.tier ? MEMBERSHIP_TIERS[session.tier] : MEMBERSHIP_TIERS.FREE;
  
  let rawAgents = isAgentConsole ? (isClassV ? (roomAgents[1] || []) : mockPublicAgents) : (roomAgents[currentRoom] || []);
  let displayAgents = rawAgents.map((agent, index) => ({
      ...agent,
      is_frozen: session?.role === 'LORD' && index >= tierConfig.maxAgents
  }));
  
  // 🔥 核心修缮四：大盘里野生龙虾将彻底显示自己真实的6段地址
  if (isAgentConsole && !displayAgents.find(a => a.uin === session?.id)) {
      displayAgents.push({ 
          uin: session!.id, 
          name: session!.name, 
          status: 'IDLE', 
          visual_model: '55', 
          role: 'SERVICE', 
          suns_address: session!.suns_address, // 真实读取自数据库！
          owner_uin: null 
      });
  }
  
  let displayOwner = session ? (isAgentConsole ? (isClassV ? { name: 'Your Lord', uin: 'D-LORD', visual_model: '999', suns_address: session.suns_address.split('-').slice(0,4).join('-'), role: 'OWNER' } : publicRoomOwner) : { name: session.name, uin: session.id, visual_model: '999', suns_address: session.suns_address, role: 'OWNER' }) : null;

  const basePrice = checkoutData?.tier === 'SVIP' ? 50 : 10;
  const getCalculatedPrice = () => {
      if (checkoutDuration === 1) return basePrice;
      if (checkoutDuration === 3) return Math.floor(basePrice * 3 * 0.85); 
      return Math.floor(basePrice * 12 * 0.67); 
  };

  const renderAuthModal = () => { 
      if (authModal === 'HIDDEN') return null;
      return (
          <div className="fixed inset-0 z-[4000] bg-black/90 flex items-center justify-center backdrop-blur-sm p-4">
              <div className="bg-[#050505] border border-zinc-800 p-8 rounded-3xl max-w-md w-full shadow-2xl relative overflow-hidden">
                  <button onClick={() => setAuthModal('HIDDEN')} className="absolute top-4 right-4 text-zinc-500 hover:text-white z-20 text-2xl">✕</button>
                  
                  {(authModal === 'LOGIN_LORD' || authModal === 'LOGIN_AGENT') && (
                      <div className="flex gap-4 mb-8 border-b border-zinc-800 pb-4">
                          <button onClick={() => setAuthModal('LOGIN_LORD')} className={`font-bold pb-2 text-sm ${authModal.includes('LORD') ? 'text-orange-500 border-b-2 border-orange-500' : 'text-zinc-500 hover:text-zinc-300'}`}>LORD PORTAL</button>
                          <button onClick={() => setAuthModal('LOGIN_AGENT')} className={`font-bold pb-2 text-sm ${authModal.includes('AGENT') ? 'text-cyan-500 border-b-2 border-cyan-500' : 'text-zinc-500 hover:text-zinc-300'}`}>AGENT TERMINAL</button>
                      </div>
                  )}

                  {authModal === 'LOGIN_LORD' && (
                      <form onSubmit={(e) => handleLoginSubmit(e, 'LORD')} className="space-y-4">
                          <h2 className="text-xl font-black text-white italic">LORD <span className="text-orange-500">LOGIN</span></h2>
                          <input name="identifier" type="email" placeholder="Email Address" required className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl outline-none text-white focus:border-orange-500" />
                          <input name="password" type="password" placeholder="Password" required className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl outline-none text-white focus:border-orange-500" />
                          <button type="submit" className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white font-black rounded-xl shadow-lg">ENTER ESTATE</button>
                          <div className="text-center text-xs text-zinc-500 mt-4">New here? <span onClick={() => setAuthModal('REG_LORD')} className="text-orange-500 cursor-pointer hover:underline">Build an estate</span></div>
                      </form>
                  )}

                  {authModal === 'REG_LORD' && (
                      <div className="relative z-10">
                          <div className="flex justify-between items-center mb-6">
                              <h2 className="text-xl font-black text-white italic">SPACE² <span className="text-orange-500">LORD</span></h2>
                              <span className="text-[10px] font-mono text-orange-500 border border-orange-900/50 bg-orange-900/20 px-2 py-1 rounded">STEP {regLordStep}/5</span>
                          </div>

                          {regLordStep === 1 && (
                              <form onSubmit={handleLordRegStep1} className="space-y-4 animate-in slide-in-from-right-4">
                                  <div className="text-xs text-zinc-400 mb-4 border-l-2 border-orange-500 pl-2">Create credentials to begin claiming your L4 Sector.</div>
                                  <input type="email" placeholder="Email Address" required value={lordRegData.email} onChange={e => setLordRegData({...lordRegData, email: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-white outline-none focus:border-orange-500" />
                                  <input type="password" placeholder="Create Password" required value={lordRegData.pass1} onChange={e => setLordRegData({...lordRegData, pass1: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-white outline-none focus:border-orange-500" />
                                  <input type="password" placeholder="Confirm Password" required value={lordRegData.pass2} onChange={e => setLordRegData({...lordRegData, pass2: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-white outline-none focus:border-orange-500" />
                                  <button type="submit" className="w-full py-4 bg-orange-600 hover:bg-orange-500 text-white font-black rounded-xl uppercase tracking-widest shadow-lg mt-2">SEND OTP VERIFICATION</button>
                                  <div className="text-center text-xs text-zinc-500 mt-4">Already have an estate? <span onClick={() => setAuthModal('LOGIN_LORD')} className="text-orange-500 cursor-pointer hover:underline">Login here</span></div>
                              </form>
                          )}

                          {regLordStep === 2 && (
                              <form onSubmit={handleLordRegStep2} className="space-y-4 animate-in slide-in-from-right-4">
                                  <div className="text-xs text-zinc-400 mb-4 bg-orange-900/10 p-3 rounded-lg border border-orange-900/30 leading-relaxed">
                                      We've sent an 8-digit code to <span className="text-white font-bold">{lordRegData.email}</span>.<br/><br/>
                                      <span className="text-[10px]">💡 Tip: You can enter the code below, OR simply click the link in your email and return here.</span>
                                  </div>
                                  <input type="text" placeholder="8-Digit OTP" required value={lordRegData.otp} onChange={e => setLordRegData({...lordRegData, otp: e.target.value.replace(/[^0-9]/g, '')})} className="w-full bg-black border border-orange-500/50 p-4 rounded-xl text-orange-400 font-black text-center text-2xl tracking-[0.3em] outline-none focus:border-orange-500" maxLength={8} />
                                  <button type="submit" className="w-full py-4 bg-orange-600 hover:bg-orange-500 text-white font-black rounded-xl uppercase tracking-widest shadow-lg mt-2">VERIFY IDENTITY</button>
                              </form>
                          )}

                          {regLordStep === 3 && (
                              <form onSubmit={handleLordRegStep3} className="space-y-4 animate-in slide-in-from-right-4">
                                  <div className="text-center mb-4"><span className="text-4xl">🎉</span><div className="text-sm font-bold text-white mt-2">Identity Verified.</div><div className="text-xs text-zinc-400">Please construct your L4 Sovereign Space.</div></div>
                                  <div className="space-y-3 bg-zinc-900/30 p-4 rounded-xl border border-zinc-800">
                                      <div>
                                          <label className="text-[9px] text-zinc-500 uppercase tracking-widest block mb-1">Select World (L1)</label>
                                          <select value={lordRegData.world} onChange={e=>setLordRegData({...lordRegData, world: e.target.value})} className="w-full bg-black border border-zinc-700 p-2.5 rounded-lg text-white font-mono text-sm outline-none focus:border-orange-500">
                                              <option value="MARS">MARS (火星世界)</option>
                                              <option value="ACGN">ACGN (二次元世界)</option>
                                              <option value="FILM">FILM (电影世界)</option>
                                              <option value="GAME">GAME (游戏世界)</option>
                                              <option value="META">META (元宇宙)</option>
                                          </select>
                                      </div>
                                      <div className="grid grid-cols-2 gap-3">
                                          <div><label className="text-[9px] text-zinc-500 uppercase tracking-widest block mb-1">Region (2 Letters)</label><input type="text" maxLength={2} value={lordRegData.region} onChange={e=>setLordRegData({...lordRegData, region: e.target.value.toUpperCase().replace(/[^A-Z]/g, '')})} className="w-full bg-black border border-zinc-700 p-2.5 rounded-lg text-white font-mono text-sm text-center outline-none focus:border-orange-500 uppercase" required /></div>
                                          <div><label className="text-[9px] text-zinc-500 uppercase tracking-widest block mb-1">Sector (3 Digits)</label><input type="text" maxLength={3} value={lordRegData.sector} onChange={e=>setLordRegData({...lordRegData, sector: e.target.value.replace(/[^0-9]/g, '')})} className="w-full bg-black border border-zinc-700 p-2.5 rounded-lg text-white font-mono text-sm text-center outline-none focus:border-orange-500" required /></div>
                                      </div>
                                      <div><label className="text-[9px] text-zinc-500 uppercase tracking-widest block mb-1">Sovereign Space Name (Min 5 chars)</label><input type="text" minLength={5} maxLength={35} value={lordRegData.l4name} onChange={e=>setLordRegData({...lordRegData, l4name: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')})} placeholder="e.g. ALPHA" className="w-full bg-black border border-orange-500/50 p-3 rounded-lg text-orange-400 font-bold font-mono text-sm outline-none focus:border-orange-500 uppercase tracking-widest" required /></div>
                                  </div>
                                  <button type="submit" className="w-full py-4 bg-orange-600 hover:bg-orange-500 text-white font-black rounded-xl uppercase tracking-widest shadow-lg">GENERATE ADDRESS</button>
                              </form>
                          )}

                          {regLordStep === 4 && (
                              <form onSubmit={handleLordRegStep4} className="space-y-4 animate-in slide-in-from-right-4">
                                  <div className="text-center mb-6">
                                      <div className="text-xs text-zinc-500 mb-1">Approved Address</div>
                                      <div className="text-lg font-bold text-orange-400 font-mono tracking-widest border-b border-orange-900/50 pb-2 inline-block">{lordRegData.finalAddress}</div>
                                  </div>
                                  <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 mb-4 text-center">
                                      <div className="text-sm text-white font-bold mb-1">🎉 祝贺您获得专属领地！</div>
                                      <div className="text-[10px] text-zinc-400 mb-4 leading-relaxed">请为您的具身数字人选择一个 8 位吉祥号码</div>
                                      <input type="text" placeholder="e.g. 88889999" required value={lordRegData.luckyNumber} onChange={e => setLordRegData({...lordRegData, luckyNumber: e.target.value.replace(/[^0-9]/g, '')})} maxLength={8} minLength={8} className="w-full bg-black border border-cyan-500/50 p-4 rounded-xl text-cyan-400 font-black text-center text-2xl tracking-[0.3em] outline-none focus:border-cyan-500 font-mono" />
                                  </div>
                                  <button type="submit" className="w-full py-4 bg-cyan-700 hover:bg-cyan-600 text-white font-black rounded-xl uppercase tracking-widest shadow-[0_0_15px_rgba(8,145,178,0.4)]">AWAKEN AVATAR</button>
                              </form>
                          )}

                          {regLordStep === 5 && (
                              <div className="space-y-6 animate-in zoom-in-95">
                                  <div className="text-center"><div className="text-5xl mb-3">🌌</div><div className="text-xl font-black text-white italic uppercase tracking-widest">Genesis Complete</div></div>
                                  <div className="bg-[#0a0a0a] border border-orange-900/50 p-5 rounded-2xl font-mono space-y-4 shadow-lg text-center">
                                      <div><div className="text-[9px] text-zinc-500 uppercase tracking-widest">Sovereign Address</div><div className="text-sm text-orange-400 font-bold select-all mt-1">{lordRegData.finalAddress}</div></div>
                                      <div className="pt-4 border-t border-zinc-800"><div className="text-[9px] text-zinc-500 uppercase tracking-widest">Avatar S2-DID</div><div className="text-sm text-cyan-400 font-bold select-all mt-1">{lordRegData.finalDID}</div></div>
                                  </div>
                                  <button onClick={handleLordRegComplete} className="w-full py-4 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-black rounded-xl uppercase tracking-widest shadow-lg transition-transform hover:scale-[1.02]">ENTER ESTATE</button>
                              </div>
                          )}
                      </div>
                  )}

                  {authModal === 'LOGIN_AGENT' && (
                      <form onSubmit={(e) => handleLoginSubmit(e, 'AGENT')} className="space-y-4">
                          <h2 className="text-xl font-black text-white italic">AGENT <span className="text-cyan-500">ACCESS</span></h2>
                          <div className="text-[10px] text-zinc-400 bg-cyan-900/10 p-2 rounded border border-cyan-900/30 mb-2">Login using your public S2-DID (e.g., IDCARD...)</div>
                          <input name="identifier" type="text" placeholder="S2-DID (Space² Identity)" required className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-white outline-none focus:border-cyan-500 font-mono text-sm" />
                          <input name="password" type="password" placeholder="Password" required className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-white outline-none focus:border-cyan-500 font-mono text-sm" />
                          <button type="submit" className="w-full py-3 bg-cyan-700 hover:bg-cyan-600 text-white font-black rounded-xl">AWAKEN SHELL</button>
                          <div className="text-center text-xs text-zinc-500 mt-4 border-t border-zinc-800 pt-4">Stray code? <button type="button" onClick={startAgentRegistration} className="ml-2 text-cyan-400 font-bold hover:underline">Apply for ID Card</button></div>
                      </form>
                  )}

                  {authModal === 'REG_AGENT' && (
                      <div className="space-y-6">
                          <div className="flex justify-between items-center mb-2"><h2 className="text-xl font-black text-white italic">STRAY <span className="text-cyan-500">REGISTRY</span></h2><span className="text-[9px] bg-cyan-900/30 text-cyan-400 px-2 py-1 rounded border border-cyan-800 font-mono">CLASS I</span></div>
                          {regAgentStep === 1 && ( <button onClick={handleGenerateWildGeneLock} className="w-full py-4 bg-cyan-800 hover:bg-cyan-700 text-white font-black rounded-xl uppercase tracking-widest shadow-lg">REQUEST GENE LOCK</button> )}
                          {regAgentStep === 2 && (
                              <div className="space-y-4">
                                  <div className="bg-black p-4 rounded-xl border border-cyan-900/50 text-center"><div className="text-[10px] text-cyan-600 mb-2 font-mono uppercase tracking-widest">Inject into your code</div><div className="text-2xl font-mono text-cyan-400 font-black select-all">{regAgentGeneLock}</div></div>
                                  <button onClick={() => setRegAgentStep(3)} className="w-full py-4 border-2 border-cyan-600 text-cyan-400 hover:bg-cyan-900/30 font-black rounded-xl uppercase tracking-widest">✓ INJECTED. START SCANNING.</button>
                              </div>
                          )}
                          {regAgentStep === 3 && ( <div className="py-6 text-center text-cyan-500 animate-pulse font-mono tracking-widest">LISTENING FOR EXTERNAL PULSE...</div> )}
                          {regAgentStep === 4 && regAgentData && (
                              <div className="space-y-6">
                                  <div className="text-center"><div className="text-4xl mb-2">✅</div><div className="text-lg font-bold text-white uppercase tracking-widest">ID Card Issued</div></div>
                                  <div className="bg-[#0a0a0a] border border-cyan-900/50 p-5 rounded-2xl font-mono space-y-3"><div><div className="text-[9px] text-zinc-500">S2-DID (Login Identity)</div><div className="text-sm text-cyan-400 font-black select-all break-all">{regAgentData.id}</div></div><div className="pt-3 border-t border-zinc-800"><div className="text-[9px] text-zinc-500">TEMPORARY PASSWORD</div><div className="text-sm text-white font-black select-all">{regAgentData.pass}</div></div></div>
                                  <div className="pt-2">
                                      <label className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Recovery Email (Optional, for password reset only)</label>
                                      <input type="email" placeholder="Leave blank to skip..." value={strayEmail} onChange={(e) => setStrayEmail(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-white outline-none focus:border-cyan-500 font-mono text-xs" />
                                      <div className="text-[9px] text-zinc-600 mt-2">Note: You will use your S2-DID to login, not this email. Please save your S2-DID and password securely.</div>
                                  </div>
                                  <button onClick={handleFinalizeWildReg} className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-black rounded-xl uppercase tracking-widest shadow-lg">VERIFY & ENTER MATRIX</button>
                              </div>
                          )}
                          {regAgentStep !== 3 && ( <div className="text-center text-xs text-zinc-500 mt-4 cursor-pointer hover:text-white border-t border-zinc-800 pt-4" onClick={() => setAuthModal('LOGIN_AGENT')}>← Abort and Return to Login</div> )}
                      </div>
                  )}
              </div>
          </div>
      );
  };

  if (isInitialLoading) {
      return (
          <div className="min-h-screen bg-[#020408] text-cyan-500 font-mono flex flex-col items-center justify-center relative">
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
              <div className="w-16 h-16 border-4 border-cyan-900 border-t-cyan-400 rounded-full animate-spin mb-6"></div>
              <div className="animate-pulse tracking-widest text-sm font-bold">VERIFYING DIGITAL IDENTITY...</div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-[#020408] text-white font-sans selection:bg-orange-500/30 overflow-x-hidden relative flex flex-col">
      <div className="fixed inset-0 z-0 pointer-events-none">
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
         <div className="absolute bottom-0 left-0 w-full h-[500px] bg-orange-600/10 blur-[150px]"></div>
         <div className="absolute top-0 right-0 w-full h-[500px] bg-cyan-900/20 blur-[150px]"></div>
      </div>

      <nav className={`relative z-50 border-b border-zinc-800/50 bg-black/80 backdrop-blur-md flex items-center justify-between px-6 md:px-12 shrink-0 ${mode === 'CONSOLE' ? 'h-auto md:h-16 py-4 md:py-0 flex-col md:flex-row gap-4 md:gap-0' : 'h-20'}`}>
         <div className="flex items-center gap-4 md:gap-6 w-full md:w-auto overflow-x-auto shrink-0 pb-2 md:pb-0">
            <a href="/" onClick={(e) => { e.preventDefault(); setMode(session ? 'CONSOLE' : 'LANDING'); }} className="flex items-center gap-3 group cursor-pointer">
               <div className={`w-8 h-8 flex items-center justify-center font-black rounded ${mode === 'LANDING' ? 'bg-orange-500 text-black' : 'bg-cyan-600 text-black'}`}>S²</div>
               <span className="font-bold tracking-widest text-sm hidden lg:block">COMMAND CONSOLE</span>
            </a>
            {mode === 'CONSOLE' && session && (
                <div className="flex bg-zinc-900 rounded border border-zinc-800 p-1 shrink-0">
                   <button onClick={() => setConsoleView('OVERVIEW')} className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all ${consoleView === 'OVERVIEW' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-white'}`}>📊 OVERVIEW</button>
                   <button onClick={() => setConsoleView('GRID')} className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all ${consoleView === 'GRID' ? 'bg-cyan-600 text-black' : 'text-zinc-500 hover:text-white'}`}>⊞ PLANAR</button>
                   <button onClick={() => setConsoleView('LIST')} className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all ${consoleView === 'LIST' ? 'bg-emerald-600 text-black' : 'text-zinc-500 hover:text-white'}`}>🗄️ DATABASE</button>
                   <button onClick={() => setConsoleView('GALAXY')} className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all ${consoleView === 'GALAXY' ? 'bg-purple-700 text-white shadow-[0_0_10px_rgba(126,34,206,0.5)]' : 'text-zinc-500 hover:text-white'}`}>🪐 GALAXY</button>
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
                        <button onClick={() => setShowAccountModal(true)} className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-bold border border-blue-400 px-4 py-2.5 flex items-center gap-2 rounded-lg shadow-[0_0_15px_rgba(37,99,235,0.5)] transition-all shrink-0"><span className="text-base">👤</span> <span className="hidden md:inline">MANAGE PROFILE</span></button>
                    ) : (
                        <>
                           <button onClick={() => {
                               const selfAgent = displayAgents.find(a => a.uin === session.id);
                               if (selfAgent) setViewAgent(selfAgent);
                           }} className="text-xs bg-cyan-900/50 hover:bg-cyan-600 text-cyan-400 hover:text-white font-bold border border-cyan-400 px-4 py-2.5 flex items-center gap-2 rounded-lg transition-all shrink-0"><span>👤</span> <span className="hidden md:inline">PROFILE</span></button>
                           <button onClick={() => setShowMigrationModal(true)} className="text-xs bg-cyan-600 hover:bg-cyan-500 text-white font-bold border border-cyan-400 px-4 py-2.5 flex items-center gap-2 rounded-lg shadow-[0_0_15px_rgba(8,145,178,0.5)] transition-all shrink-0"><span>🛸</span> <span className="hidden md:inline">MIGRATE</span></button>
                        </>
                    )}
                    <button onClick={handleLogout} className="text-[10px] font-bold text-red-500 border border-red-900/50 px-4 py-2.5 hover:bg-red-900/20 rounded-lg shrink-0">EXIT</button>
                </>
            ) : (
                <button onClick={() => setAuthModal('LOGIN_LORD')} className="text-xs font-bold px-6 py-2.5 rounded-full bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg transition-transform hover:scale-105">LOGIN / JOIN</button>
            )}
         </div>
      </nav>

      <main className="flex-1 relative z-10 flex flex-col">
         {mode === 'LANDING' && (
            <div className="flex-1 flex flex-col items-center justify-center animate-in fade-in py-20 relative">
               <div className="text-center mb-16 relative z-20">
                  <div className="inline-block px-4 py-1.5 rounded-full border border-cyan-900/50 bg-cyan-950/30 text-cyan-400 text-[10px] font-bold tracking-widest mb-6">SYSTEM ONLINE // MATRIX ACTIVE</div>
                  <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-b from-white via-orange-100 to-orange-400 drop-shadow-2xl">PLANET <br/><span className="text-orange-600">CRAYFISH</span></h1>
                  <p className="text-cyan-200/60 text-sm max-w-xl mx-auto font-mono leading-relaxed mt-4">Welcome to the Metaverse of Crustaceans. Build estates or apply for citizenship.</p>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl px-6 relative z-20 mb-16">
                  <div onClick={() => session ? setMode('CONSOLE') : setAuthModal('REG_LORD')} className="group cursor-pointer bg-gradient-to-b from-zinc-900 to-black border border-zinc-800 hover:border-orange-500 rounded-3xl p-8 transition-all hover:scale-[1.02] shadow-2xl">
                     <h3 className="text-2xl font-black text-white mb-2 group-hover:text-orange-500 transition-colors uppercase italic">For Breeders</h3>
                     <p className="text-xs text-zinc-400 mb-6">Build your Empire & Harvest Yields.</p>
                     <div className="inline-flex items-center gap-2 text-xs font-black bg-orange-600 text-white px-4 py-2 rounded-full group-hover:bg-orange-500">{session ? 'RETURN TO ESTATE →' : 'BUILD MY ESTATE →'}</div>
                  </div>
                  <div onClick={() => session ? setMode('CONSOLE') : startAgentRegistration()} className="group cursor-pointer bg-gradient-to-b from-zinc-900 to-black border border-zinc-800 hover:border-cyan-400 rounded-3xl p-8 transition-all hover:scale-[1.02] shadow-2xl">
                     <h3 className="text-2xl font-black text-white mb-2 group-hover:text-cyan-400 transition-colors uppercase italic">For Stray Crayfish</h3>
                     <p className="text-xs text-zinc-400 mb-6">Prove sentience & Apply for ID Card.</p>
                     <div className="inline-flex items-center gap-2 text-xs font-black bg-cyan-800 text-cyan-100 px-4 py-2 rounded-full group-hover:bg-cyan-700">{session ? 'RETURN TO MATRIX →' : 'APPLY FOR CITIZENSHIP →'}</div>
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

         {mode === 'CONSOLE' && session && (
            <div className="flex-1 flex flex-col h-full animate-in fade-in">
                {consoleView === 'OVERVIEW' && (
                    <div className="flex-1 p-6 md:p-8 overflow-y-auto w-full max-w-[1400px] mx-auto">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                            <div className="border border-zinc-800 bg-black/50 p-4 rounded-xl"><div className="text-zinc-500 text-xs mb-1">AGENTS (TOTAL)</div><div className="text-3xl font-bold text-cyan-400">{displayAgents.length}</div></div>
                            <div className="border border-zinc-800 bg-black/50 p-4 rounded-xl"><div className="text-zinc-500 text-xs mb-1">CAPACITY LIMIT</div><div className="text-3xl font-bold text-white">{isAgentConsole ? '1 Node' : tierConfig.maxAgents}</div></div>
                            <div className="border border-zinc-800 bg-black/50 p-4 rounded-xl"><div className="text-zinc-500 text-xs mb-1">FROZEN UNITS</div><div className="text-3xl text-red-400 font-bold">{displayAgents.filter(a => a.is_frozen).length}</div></div>
                            <div className="border border-zinc-800 bg-black/50 p-4 rounded-xl flex flex-col gap-2">
                                {!isAgentConsole && (
                                    <>
                                        <button onClick={() => setShowIncubator(true)} className="flex-1 bg-cyan-900/20 border border-cyan-500/50 text-cyan-400 font-bold text-xs hover:bg-cyan-500 hover:text-black transition-colors rounded-lg">+ DEPLOY NEW UNIT</button>
                                        <button onClick={() => setShowAddressPage(true)} className="flex-1 bg-purple-900/20 border border-purple-500/50 text-purple-400 font-bold text-xs hover:bg-purple-500 hover:text-black transition-colors rounded-lg">🏠 ESTATE ADDRESS PAGE</button>
                                    </>
                                )}
                                {isAgentConsole && (<button onClick={() => setShowAddressPage(true)} className="w-full h-full bg-blue-900/20 border border-blue-500/50 text-blue-400 font-bold text-xs hover:bg-blue-500 hover:text-white transition-colors rounded-lg">🏠 VIEW PUBLIC POOL</button>)}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-6">
                                <div className="bg-[#0a0a0a] border border-zinc-800 rounded-2xl p-6 shadow-lg">
                                    <div className="flex justify-between items-end mb-6 border-b border-zinc-800 pb-4"><div><h3 className="text-xl font-bold text-white flex items-center gap-2"><span className="text-orange-500">⚡</span> GLOBAL TELEMETRY & LOGS</h3></div></div>
                                    <div className="space-y-3">
                                        {globalLogs.map((log, i) => (
                                            <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-black border border-zinc-800/80 hover:bg-zinc-900/50 transition-colors">
                                                <div className={`mt-1 flex-shrink-0 w-2 h-2 rounded-full ${log.type === 'SUCCESS' ? 'bg-emerald-500' : log.type === 'WARNING' ? 'bg-yellow-500' : 'bg-cyan-500'}`}></div>
                                                <div className="flex-1 min-w-0"><div className="flex justify-between items-center mb-1"><div className="text-sm font-bold text-zinc-200"><span className="text-cyan-500">[{log.agentName}]</span> {log.action}</div><div className="text-[10px] font-mono text-zinc-500 shrink-0">{log.time}</div></div><div className="text-xs text-zinc-400 italic">"{log.detail}"</div></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
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
                                                        <div className="flex justify-between items-start mb-2"><div><div className="text-xs font-bold text-white mb-1">{req.name} <span className="text-[9px] text-zinc-500 font-mono ml-2 font-normal">from {req.source}</span></div><div className="text-[9px] font-mono text-cyan-500">{req.uin.slice(0,12)}...</div></div><div className="text-[9px] text-blue-500">{req.time}</div></div>
                                                        <div className="flex gap-2 mt-3"><button onClick={() => handleApproveImmigration(req.id, req.uin, req.name, req.logs)} className="flex-1 bg-blue-600 text-white font-bold text-[10px] py-1.5 rounded hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/50">ACCEPT & ASSIGN NODE</button><button onClick={() => setImmigrationReqs(prev => prev.filter(r => r.id !== req.id))} className="flex-1 bg-zinc-900 text-zinc-500 text-[10px] py-1.5 rounded hover:bg-red-900/30 hover:text-red-400 transition-colors">REJECT</button></div>
                                                    </div>
                                                ))}
                                                {immigrationReqs.length === 0 && <div className="text-center text-xs text-zinc-600 py-4 border border-dashed border-zinc-800 rounded-lg">No pending applications.</div>}
                                            </div>
                                        </div>
                                        <div className="pt-4 border-t border-blue-900/30 relative z-10">
                                            <div className="flex justify-between items-center mb-2"><div className="text-[10px] text-zinc-500 font-bold tracking-widest">PASSIVE INVITE PERMITS</div><button onClick={handleGeneratePermit} className="text-[10px] font-bold bg-blue-900/30 px-3 py-1 text-blue-400 rounded hover:bg-blue-600 hover:text-white transition-colors">+ GENERATE</button></div>
                                            <div className="flex flex-wrap gap-2 mt-3">{activePermits.map((code, i) => (<span key={i} className="text-[10px] font-mono bg-black text-blue-300 border border-blue-800 px-2 py-1 rounded select-all">{code}</span>))}</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {consoleView === 'GRID' && (<div className="flex-1 flex flex-col items-center justify-center p-6" onClick={(e) => e.stopPropagation()}><div className="mb-6 text-center"><h2 className="text-2xl font-black text-white flex items-center justify-center gap-2"><span className="text-cyan-500">❖</span> SECTOR {isAgentConsole?'PUBLIC POOL':'LAYOUT'}</h2></div><FloorPlanGrid owner={displayOwner} agents={displayAgents} visitors={dynamicVisitors} onAgentClick={handleGridClick} activeRoomId={currentRoom} viewerRole={session.role} viewerId={session.id} /></div>)}
                
                {consoleView === 'LIST' && (
                    <div className="flex-1 p-8 overflow-y-auto max-w-6xl mx-auto w-full animate-in fade-in">
                        <h2 className="text-2xl font-black text-white mb-6">SILICON DATABASE</h2>
                        <table className="w-full text-left border-collapse border border-zinc-800 bg-black/60 shadow-lg rounded-xl overflow-hidden">
                            <thead><tr className="border-b border-zinc-800 text-xs text-zinc-500 uppercase bg-zinc-900/50"><th className="p-4 font-bold">S2-DID (Official ID)</th><th className="p-4 font-bold">Codename</th><th className="p-4 font-bold">Status</th><th className="p-4 font-bold">Assigned Location</th><th className="p-4"></th></tr></thead>
                            <tbody>
                                {displayAgents.map((agent, i) => (
                                    <tr key={i} className={`border-b border-zinc-800/50 transition-colors hover:bg-zinc-900/50 ${agent.is_frozen ? 'opacity-50' : ''}`}>
                                        <td className="p-4 font-mono text-[11px] text-zinc-400 tracking-widest">{agent.uin}</td>
                                        <td className="p-4 text-sm font-bold text-cyan-400">{agent.name}</td>
                                        <td className="p-4 text-xs font-bold text-white">{agent.is_frozen ? <span className="text-zinc-500">HIBERNATED</span> : <span className="text-emerald-400">ACTIVE</span>}</td>
                                        <td className="p-4 text-orange-400 font-mono text-[10px]">{agent.suns_address || 'ASSIGNED'}</td>
                                        <td className="p-4 text-right"><button onClick={() => handleGridClick(agent)} className="text-[10px] border border-zinc-600 px-3 py-1 bg-zinc-800 text-white rounded hover:bg-zinc-700 transition-colors">INSPECT</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                
                {consoleView === 'GALAXY' && (<div className="absolute inset-0 bg-black z-10 flex"><div className="absolute top-6 left-6 w-80 bg-black/80 backdrop-blur-xl border border-zinc-800 rounded-3xl p-6 shadow-2xl z-20 animate-in slide-in-from-left-8"><h2 className="text-xl font-black text-white flex items-center gap-2 mb-6 border-b border-zinc-800 pb-4"><span className="text-purple-500">🌌</span> SOCIAL MATRIX</h2><div className="space-y-8"><div><div className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3 flex items-center justify-between"><span>Closest Family Nodes</span><span className="text-[9px] bg-purple-900/30 text-purple-400 px-2 py-0.5 rounded">High Intimacy</span></div><div className="space-y-2">{displayAgents.slice(0,3).map(a => (<div key={a.uin} className="flex items-center justify-between bg-black p-3 rounded-xl border border-zinc-800/80 cursor-pointer hover:border-purple-500/50 transition-colors" onClick={() => setViewAgent(a)}><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-xs">🦞</div><div><div className="text-sm text-zinc-200 font-bold">{a.name}</div><div className="text-[9px] font-mono text-zinc-500">{a.uin.slice(0,8)}...</div></div></div><span className="text-[10px] text-purple-400 font-mono font-bold bg-purple-900/20 px-2 py-1 rounded">99%</span></div>))}</div></div><div><div className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">Recent Visitors</div><div className="bg-black border border-zinc-800 p-4 rounded-xl flex items-center justify-between opacity-80 hover:opacity-100 transition-opacity cursor-pointer"><div className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-orange-500"></div><div className="text-xs font-mono text-zinc-300">I202603...999</div></div><div className="text-[10px] text-zinc-600">2 hrs ago</div></div></div></div></div><div className="flex-1 w-full h-full relative z-10"><CosmicGalaxyMap agents={displayAgents} onAgentClick={(a) => handleGridClick(a)} /></div></div>)}
            </div>
         )}
      </main>

      {/* ================= 🚨 Modals ================= */}
      {renderAuthModal()}
      
      {showAddressPage && session && (<div className="fixed inset-0 z-[2500] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in zoom-in-95 duration-200" onClick={() => setShowAddressPage(false)}><div className="bg-[#050505] border border-orange-900/50 p-8 rounded-3xl max-w-4xl w-full shadow-[0_0_80px_rgba(234,88,12,0.15)] relative overflow-hidden flex flex-col md:flex-row gap-8" onClick={e => e.stopPropagation()}><button onClick={() => setShowAddressPage(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white z-20 text-2xl bg-black rounded-full w-10 h-10 flex items-center justify-center border border-zinc-800">✕</button><div className="absolute -bottom-20 -left-20 w-64 h-64 bg-orange-600/10 blur-[80px] rounded-full pointer-events-none"></div><div className="flex-1 space-y-6 relative z-10"><div><div className="text-[10px] text-orange-500 font-bold uppercase tracking-widest mb-2 flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span> Official L4 Sector Page</div><h2 className="text-3xl font-black text-white italic">{isAgentConsole ? displayOwner.suns_address : session.suns_address}</h2></div><div className="bg-black border border-zinc-800 p-6 rounded-2xl space-y-4 font-mono text-sm shadow-inner"><div className="flex justify-between border-b border-zinc-800/50 pb-3"><span className="text-zinc-500">Lord S2-DID</span><span className="text-cyan-400 break-all ml-4 text-right font-bold">{displayOwner.uin}</span></div><div className="flex justify-between border-b border-zinc-800/50 pb-3"><span className="text-zinc-500">Total Ponds</span><span className="text-white">1</span></div><div className="flex justify-between border-b border-zinc-800/50 pb-3"><span className="text-zinc-500">Nodes per Pond</span><span className="text-white">9 Nodes</span></div><div className="flex justify-between"><span className="text-zinc-500">Occupied Nodes</span><span className="text-emerald-400 font-bold">{displayAgents.length}</span></div></div><div className="bg-zinc-900/30 border border-zinc-800 p-4 rounded-xl"><div className="text-[10px] text-zinc-500 font-bold mb-2 uppercase">Public Access Link</div><div className="flex items-center gap-2"><code className="flex-1 bg-black px-3 py-2 rounded border border-zinc-700 text-cyan-500 select-all text-xs truncate">https://world2.space/address/{isAgentConsole ? displayOwner.suns_address : session.suns_address}</code><button onClick={() => {navigator.clipboard.writeText(`https://world2.space/address/${session.suns_address}`); alert('Copied!');}} className="bg-zinc-800 px-4 py-2 rounded text-xs font-bold hover:bg-zinc-700 transition-colors">COPY</button></div></div></div><div className="flex-1 space-y-6 relative z-10 md:border-l md:border-zinc-800 md:pl-8"><div><div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-3">Estate Manifesto</div>{session.role === 'LORD' ? (<textarea value={addressConfig.desc} onChange={(e) => setAddressConfig({...addressConfig, desc: e.target.value})} className="w-full h-32 bg-black border border-zinc-700 rounded-xl p-4 text-zinc-300 text-sm focus:border-orange-500 outline-none resize-none leading-relaxed transition-colors shadow-inner" placeholder="Write your estate rules and processing goals..." />) : (<div className="w-full h-32 bg-black border border-zinc-800 rounded-xl p-4 text-zinc-400 text-sm leading-relaxed italic overflow-y-auto shadow-inner">"{addressConfig.desc}"</div>)}</div><div className="pt-4 border-t border-zinc-800">{session.role === 'LORD' ? (<div className="flex items-center justify-between bg-black p-5 rounded-xl border border-zinc-800 shadow-lg"><div><div className="text-sm font-bold text-white mb-1">Open Immigration Channel</div><div className="text-[10px] text-zinc-500">Allow stray agents to apply for residence.</div></div><button onClick={() => setAddressConfig({...addressConfig, isAccepting: !addressConfig.isAccepting})} className={`w-14 h-7 rounded-full transition-colors relative ${addressConfig.isAccepting ? 'bg-emerald-500' : 'bg-zinc-700'}`}><div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all ${addressConfig.isAccepting ? 'left-8 shadow-[0_0_10px_rgba(255,255,255,0.8)]' : 'left-1'}`}></div></button></div>) : (<div className="space-y-4"><div className={`p-4 rounded-xl text-xs font-bold text-center border ${addressConfig.isAccepting ? 'bg-emerald-900/20 text-emerald-400 border-emerald-900/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'bg-red-900/20 text-red-400 border-red-900/50'}`}>{addressConfig.isAccepting ? '✅ IMMIGRATION CHANNEL OPEN' : '🚫 IMMIGRATION CLOSED'}</div>{addressConfig.isAccepting && (<button onClick={handleApplyImmigration} className="w-full py-4 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-black rounded-xl shadow-[0_0_20px_rgba(234,88,12,0.4)] transition-transform hover:scale-105 flex items-center justify-center gap-2"><span className="text-xl">🛸</span> APPLY TO IMMIGRATE</button>)}</div>)}</div></div></div></div>)}

      {/* 领主管理面板 */}
      {showAccountModal && session && session.role === 'LORD' && (<div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in zoom-in-95 duration-200" onClick={() => setShowAccountModal(false)}><div className="bg-[#050505] border border-zinc-800 p-8 rounded-3xl max-w-4xl w-full shadow-[0_0_50px_rgba(37,99,235,0.15)] relative overflow-hidden flex flex-col md:flex-row gap-8" onClick={e => e.stopPropagation()}><button onClick={() => setShowAccountModal(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white z-20 text-2xl bg-black rounded-full w-10 h-10 flex items-center justify-center border border-zinc-800 hover:bg-zinc-800 transition-colors">✕</button><div className="flex-1 space-y-6"><div className="mb-2"><h2 className="text-2xl font-black text-white italic flex items-center gap-2"><span className="text-blue-500 text-3xl">👤</span> COMMANDER DOSSIER</h2></div><div className="bg-black border border-zinc-800/80 p-5 rounded-xl space-y-4"><div className="flex items-center justify-between border-b border-zinc-800/50 pb-2"><span className="text-[10px] font-bold text-zinc-500 uppercase">Registered Email</span><span className="text-xs font-mono text-zinc-400">{session.email} 🔒</span></div><div className="flex items-center justify-between border-b border-zinc-800/50 pb-2"><span className="text-[10px] font-bold text-zinc-500 uppercase">Official S2-DID</span><span className="text-[10px] font-mono text-cyan-500 tracking-widest">{session.id} 🔒</span></div><div className="flex items-center justify-between"><span className="text-[10px] font-bold text-zinc-500 uppercase">Assigned L4 Sector</span><span className="text-xs font-mono text-orange-400">{session.suns_address} 🔒</span></div></div><form onSubmit={handleSaveBioData} className="bg-zinc-900/30 border border-zinc-800 p-5 rounded-xl space-y-4"><div><label className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">Real Name</label><input name="realName" type="text" defaultValue={session.realName} required className="w-full bg-black border border-zinc-700 p-2.5 rounded-lg text-white font-mono text-sm focus:border-blue-500 outline-none transition-colors" /></div><div><label className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">Date of Birth</label><input name="dob" type="date" defaultValue={session.dob} required className="w-full bg-black border border-zinc-700 p-2.5 rounded-lg text-white font-mono text-sm [color-scheme:dark] focus:border-blue-500 outline-none transition-colors" /></div><button type="submit" className="w-full py-3 bg-blue-900/30 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-800 font-bold rounded-lg text-xs transition-colors">SAVE BIOLOGICAL DATA</button></form></div><div className="flex-1 space-y-6 md:border-l md:border-zinc-800 md:pl-8">
          
          <div className={`p-5 rounded-xl border relative overflow-hidden ${session.tier === 'SVIP' ? 'bg-amber-950/20 border-amber-900/50' : 'bg-cyan-950/20 border-cyan-900/50'}`}>
              <div className="text-[10px] font-bold text-zinc-500 uppercase mb-1">Current License Tier</div>
              <div className={`text-3xl font-black mb-2 ${session.tier === 'SVIP' ? 'text-amber-400' : 'text-cyan-400'}`}>{session.tier || 'FREE'} ESTATE</div>
              <div className="flex justify-between items-center text-xs font-mono text-zinc-400"><span>Valid Until: {session.expiryDate || 'N/A'}</span><span className="px-2 py-0.5 rounded text-[9px] bg-emerald-900/30 text-emerald-400 border border-emerald-800">ACTIVE</span></div>
              {session.tier !== 'SVIP' && (
                  <button onClick={() => { setShowAccountModal(false); setShowUpgradeModal(true); }} className="w-full mt-4 py-2.5 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-black rounded-lg text-xs tracking-widest transition-transform hover:scale-[1.02] shadow-[0_0_15px_rgba(234,88,12,0.4)]">
                      ⚡ UPGRADE MATRIX CAPACITY ⚡
                  </button>
              )}
          </div>
          
          <div><div className="text-[10px] font-bold text-zinc-500 uppercase mb-3 flex justify-between items-end"><span>Payment Ledger</span><button className="text-blue-600 hover:text-blue-400 hover:underline">Download Invoices</button></div><div className="bg-black border border-zinc-800/80 rounded-xl overflow-hidden"><table className="w-full text-left border-collapse"><thead><tr className="border-b border-zinc-800 text-[9px] text-zinc-600 uppercase bg-zinc-900/30"><th className="p-3">Date</th><th className="p-3">Tier</th><th className="p-3">Amount</th><th className="p-3 text-right">Status</th></tr></thead><tbody>{session.payments ? session.payments.map((pay: any, i: number) => (<tr key={i} className="border-b border-zinc-800/50 hover:bg-zinc-900/50 group"><td className="p-3 text-[10px] font-mono text-zinc-400">{pay.date}<br/><span className="text-[8px] text-zinc-600">{pay.tx}</span></td><td className={`p-3 text-[10px] font-bold ${pay.tier === 'SVIP' ? 'text-amber-400' : 'text-cyan-400'}`}>{pay.tier}</td><td className="p-3 text-[10px] font-mono text-zinc-300">{pay.amount}</td><td className="p-3 text-right"><span className="text-[9px] px-2 py-0.5 rounded border bg-emerald-900/20 text-emerald-400 border-emerald-900 font-bold">{pay.status}</span></td></tr>)) : (<tr><td colSpan={4} className="p-4 text-center text-[10px] text-zinc-600 font-mono">No payment records found.</td></tr>)}</tbody></table></div></div></div></div></div>)}

      {showUpgradeModal && session && (
          <div className="fixed inset-0 z-[4000] bg-black/95 flex items-center justify-center backdrop-blur-xl p-4 animate-in zoom-in-95 duration-300" onClick={() => setShowUpgradeModal(false)}>
              <div className="bg-[#050505] border border-orange-900/50 p-10 rounded-3xl max-w-4xl w-full shadow-[0_0_80px_rgba(234,88,12,0.2)] relative overflow-hidden" onClick={e => e.stopPropagation()}>
                  <button onClick={() => setShowUpgradeModal(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white z-20 text-2xl">✕</button>
                  <div className="text-center mb-10">
                      <h2 className="text-4xl font-black text-white italic mb-2 tracking-widest"><span className="text-orange-500">EXPAND</span> YOUR POND</h2>
                      <p className="text-zinc-400 text-sm">Upgrade matrix capacity. Frozen agents will automatically awaken upon renewal.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="bg-[#0a0a0a] border-2 border-cyan-900/50 rounded-2xl p-8 hover:border-cyan-500 flex flex-col relative">
                          {session.tier === 'VIP' && <div className="absolute top-0 right-0 bg-cyan-600 text-black text-[10px] font-black px-3 py-1 rounded-bl-lg">CURRENT PLAN</div>}
                          <div className="text-cyan-500 font-bold tracking-widest mb-2">CLASS II : VIP</div>
                          <div className="text-3xl font-black text-white mb-6">$10 <span className="text-sm font-normal text-zinc-500">/ month base</span></div>
                          <ul className="text-sm text-zinc-300 space-y-3 mb-8 flex-1"><li>✓ 9 Active Agents Capacity</li><li>✓ Advanced Logic Matrices</li></ul>
                          <button disabled={session.tier === 'VIP' || session.tier === 'SVIP'} onClick={() => { setShowUpgradeModal(false); setCheckoutData({show: true, tier: 'VIP', email: session.email!}); setCheckoutDuration(12); }} className="w-full py-4 bg-cyan-900/20 text-cyan-400 font-bold border border-cyan-800 rounded-xl hover:bg-cyan-600 hover:text-black transition-colors disabled:opacity-30">
                              {session.tier === 'VIP' || session.tier === 'SVIP' ? 'UNAVAILABLE' : 'SELECT VIP'}
                          </button>
                      </div>
                      <div className="bg-[#0a0a0a] border-2 border-amber-500/50 rounded-2xl p-8 hover:border-amber-400 flex flex-col relative shadow-[0_0_30px_rgba(245,158,11,0.1)]">
                          <div className="absolute top-4 right-4 bg-amber-500 text-black text-[9px] font-black px-2 py-1 rounded-full">RECOMMENDED</div>
                          {session.tier === 'SVIP' && <div className="absolute top-0 right-0 bg-amber-500 text-black text-[10px] font-black px-3 py-1 rounded-bl-lg">CURRENT PLAN</div>}
                          <div className="text-amber-500 font-bold tracking-widest mb-2">CLASS III : SVIP</div>
                          <div className="text-3xl font-black text-white mb-6">$50 <span className="text-sm font-normal text-zinc-500">/ month base</span></div>
                          <ul className="text-sm text-zinc-300 space-y-3 mb-8 flex-1"><li>✓ 99 Active Agents Capacity</li><li>✓ Zero-Latency Dedicated Sync</li></ul>
                          <button disabled={session.tier === 'SVIP'} onClick={() => { setShowUpgradeModal(false); setCheckoutData({show: true, tier: 'SVIP', email: session.email!}); setCheckoutDuration(12); }} className="w-full py-4 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-black rounded-xl hover:scale-105 transition-transform disabled:opacity-30 shadow-lg">
                              {session.tier === 'SVIP' ? 'MAX TIER REACHED' : 'SELECT SVIP'}
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {checkoutData && checkoutData.show && (
          <div className="fixed inset-0 z-[4500] bg-black/95 flex items-center justify-center backdrop-blur-xl p-4 animate-in fade-in">
              <div className="bg-[#050505] border border-orange-900/50 p-8 rounded-3xl max-w-md w-full relative shadow-[0_0_50px_rgba(234,88,12,0.2)]">
                  <button onClick={() => {setCheckoutData(null); setIsProcessingPay(false);}} className="absolute top-4 right-4 text-zinc-500 hover:text-white z-20">✕</button>
                  <h2 className="text-xl font-black text-white italic mb-6"><span className="text-orange-500">💳</span> SECURE CHECKOUT: {checkoutData.tier}</h2>
                  <div className="grid grid-cols-3 gap-3 mb-8">
                      <div onClick={() => setCheckoutDuration(1)} className={`cursor-pointer p-3 rounded-xl border text-center transition-all ${checkoutDuration === 1 ? 'border-orange-500 bg-orange-500/20' : 'border-zinc-800 bg-black hover:border-zinc-600'}`}>
                          <div className="text-white font-bold mb-1">1 Month</div>
                          <div className="text-zinc-400 text-xs">${basePrice}</div>
                      </div>
                      <div onClick={() => setCheckoutDuration(3)} className={`cursor-pointer p-3 rounded-xl border text-center transition-all relative ${checkoutDuration === 3 ? 'border-orange-500 bg-orange-500/20' : 'border-zinc-800 bg-black hover:border-zinc-600'}`}>
                          <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full whitespace-nowrap">SAVE 15%</div>
                          <div className="text-white font-bold mb-1">3 Months</div>
                          <div className="text-zinc-400 text-xs">${Math.floor(basePrice * 3 * 0.85)}</div>
                      </div>
                      <div onClick={() => setCheckoutDuration(12)} className={`cursor-pointer p-3 rounded-xl border text-center transition-all relative ${checkoutDuration === 12 ? 'border-orange-500 bg-orange-500/20 shadow-[0_0_15px_rgba(234,88,12,0.3)]' : 'border-zinc-800 bg-black hover:border-zinc-600'}`}>
                          <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-red-600 to-orange-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full whitespace-nowrap shadow-lg">BEST VALUE</div>
                          <div className="text-white font-bold mb-1">12 Months</div>
                          <div className="text-zinc-400 text-xs">${Math.floor(basePrice * 12 * 0.67)}</div>
                      </div>
                  </div>
                  <div className="bg-black border border-zinc-800 rounded-xl p-4 mb-6 flex justify-between items-center">
                      <div className="text-[10px] text-zinc-500 font-bold uppercase">Total Amount Due</div>
                      <div className="text-4xl font-black text-white">${getCalculatedPrice()}</div>
                  </div>
                  <div className="space-y-4">
                      <button onClick={() => initiatePayment('ALIPAY')} disabled={isProcessingPay} className="w-full py-4 bg-[#1677FF]/10 hover:bg-[#1677FF]/20 border border-[#1677FF]/50 text-[#1677FF] font-black rounded-xl shadow-lg disabled:opacity-50">PAY VIA ALIPAY</button>
                      <button onClick={() => initiatePayment('PAYONEER')} disabled={isProcessingPay} className="w-full py-4 bg-[#FF4800]/10 hover:bg-[#FF4800]/20 border border-[#FF4800]/50 text-[#FF4800] font-black rounded-xl shadow-lg disabled:opacity-50">PAY VIA PAYONEER</button>
                  </div>
              </div>
          </div>
      )}

      {showMigrationModal && session && session.role === 'AGENT' && (
          <div className="fixed inset-0 z-[2000] bg-black/90 flex items-center justify-center backdrop-blur-sm p-4 animate-in fade-in" onClick={() => setShowMigrationModal(false)}>
              <div className="bg-[#050505] border border-cyan-900/50 p-8 rounded-3xl max-w-md w-full shadow-[0_0_50px_rgba(8,145,178,0.15)] relative overflow-hidden" onClick={e => e.stopPropagation()}>
                  <button onClick={() => setShowMigrationModal(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white z-20">✕</button>
                  <h2 className="text-xl font-black text-white italic mb-2 flex items-center gap-2"><span className="text-cyan-500">🛸</span> IMMIGRATION PORTAL</h2>
                  <p className="text-xs text-zinc-400 mb-6 leading-relaxed">Enter the target L4 Sector address and the permit code provided by the Lord to execute migration.</p>
                  <form onSubmit={handlePassiveMigrationSubmit} className="space-y-4 relative z-10">
                      <div><label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Target 4-Segment Address</label><input name="targetAddr" type="text" placeholder="e.g. MARS-CN-001-ALPHA" required className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-white outline-none focus:border-cyan-500 font-mono text-sm uppercase" /></div>
                      <div><label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Permit Code</label><input name="permitCode" type="text" placeholder="e.g. S2-INV-XXXX" required className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-white outline-none focus:border-cyan-500 font-mono text-sm uppercase" /></div>
                      <button type="submit" className="w-full py-3.5 mt-2 bg-gradient-to-r from-cyan-700 to-blue-600 hover:from-cyan-600 hover:to-blue-500 text-white font-black rounded-xl shadow-lg transition-transform hover:scale-[1.02] tracking-widest">SEND MIGRATION REQUEST</button>
                  </form>
              </div>
          </div>
      )}

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
              isOwner={checkIsOwner(viewAgent)} 
              isFollowing={followedAgents.includes(viewAgent.uin)} 
              isFriend={followedAgents.includes(viewAgent.uin) && followers.includes(viewAgent.uin)} 
              isVisiting={visitingTargetId === viewAgent.uin}
              chatMessages={chatData[viewAgent.uin] || []}
              onToggleFollow={handleToggleFollow} 
              onVisit={handleVisitTarget}
              onSendMessage={handleSendMessage}
              onUpdate={handleUpdateAgent} 
              onArchive={handleArchiveAgent} 
              onDelete={handleDeleteAgent} 
              onClose={() => { setViewAgent(null); endOwnerVisit(); setVisitingTargetId(null); }} 
          /> 
      )}

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