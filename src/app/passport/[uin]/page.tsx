"use client";
import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { GlobalNav } from '@/components/GlobalNav';
import { useParams } from 'next/navigation';
import { AgentAvatar } from '@/components/AgentAvatar';
import { toggleAgentStatus, updateAgent, deleteAgent } from '@/lib/db-actions';
import { LaundryAgentTerminal } from '@/components/LaundryAgentTerminal';
import { EditAgentModal, DeleteAgentModal } from '@/components/AgentManagementModals';
import { ContractCard } from '@/components/ContractCard';
import { GalaxyMap } from '@/components/GalaxyMap';
import { IncubatorModal } from '@/components/IncubatorModal';
import { IDCardModal } from '@/components/IDCardModal';
import { AddressApplicationModal } from '@/components/AddressApplicationModal';
import { CitizenNameModal } from '@/components/CitizenNameModal';
import { FloorPlanGrid } from '@/components/FloorPlanGrid'; 
import { EngagementDashboard } from '@/components/EngagementDashboard'; 
import { AgentSettingsModal } from '@/components/AgentSettingsModal';
import { StarSystem } from '@/lib/galaxy-utils';
import { AddressDisplay } from '@/components/AddressDisplay';

interface Agent { 
  id: string; name: string; role: string; visual_model: string; uin: string; public_did?: string;
  status: string; personality: any; created_at: string; last_seen: string | null; current_task: string | null; room_style?: any;
  suns_address?: string; origin_address?: string;
  can_visit_external?: boolean;
}
interface AgentLog { id: string; agent_uin: string; message: string; log_level: string; created_at: string; }

interface CitizenProfile { 
  name: string; uin: string; suns_address: string; category: string; business_tier: string; stats: any; last_seen: string | null; status: string; current_task: string | null; 
  room_style?: string; visual_model?: string; origin_address?: string;
}

interface ContractedService { contract_id: string; agent: Agent; terms: string; logs: string; }

// Agent卡片组件
const AgentCard = ({ agent, onToggle, onEdit, onDelete, onViewID, isHighlighted }: any) => {
  const isOnline = (new Date().getTime() - (agent.last_seen ? new Date(agent.last_seen).getTime() : 0)) < 360 * 1000;
  const isWorking = isOnline && agent.status === 'WORKING';
  return (
    <div id={`agent-${agent.id}`} className={`group relative bg-zinc-900/50 border p-4 rounded-xl transition-all duration-500 ${isHighlighted ? 'border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.3)] scale-[1.02] z-10' : isOnline ? 'border-zinc-600 hover:border-zinc-500' : 'border-red-900/30 opacity-70'}`}>
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button onClick={(e)=>{e.stopPropagation();onEdit(agent)}} className="p-1.5 bg-zinc-800 hover:bg-blue-600 text-zinc-400 hover:text-white rounded">✎</button>
        <button onClick={(e)=>{e.stopPropagation();onDelete(agent)}} className="p-1.5 bg-zinc-800 hover:bg-red-600 text-zinc-400 hover:text-white rounded">✕</button>
      </div>
      <div className="flex justify-between items-start mb-3"><span className="text-[9px] font-black border px-2 py-0.5 rounded text-zinc-400 border-zinc-700">{agent.role}</span><div className={`w-2 h-2 rounded-full ${!isOnline ? 'bg-zinc-700' : isWorking ? 'bg-emerald-500 animate-pulse' : 'bg-yellow-500'}`}></div></div>
      <div className="flex items-center gap-4 mb-4"><AgentAvatar seed={parseInt(agent.visual_model)} size={56} emotion={isWorking ? 'BUSY' : 'NEUTRAL'} /><div className="min-w-0 flex-1"><h3 className="text-lg font-black text-white truncate">{agent.name}</h3><div className="flex items-center gap-2 mt-1"><span className="text-[10px] text-zinc-500 font-mono truncate">{agent.public_did || agent.uin}</span><button onClick={(e) => { e.stopPropagation(); onViewID(agent); }} className="text-[10px] bg-zinc-800 hover:bg-yellow-600 text-zinc-400 hover:text-white px-1.5 rounded transition-colors">🆔</button></div></div></div>
      <div className="mt-2 pt-2 border-t border-zinc-800/50 flex justify-between items-center text-[9px]"><span className="text-zinc-500 truncate max-w-[100px]">{agent.current_task || 'Standby'}</span><button onClick={(e) => { e.stopPropagation(); onToggle(agent.id, agent.status); }} className={`px-2 py-1 rounded text-[8px] font-bold uppercase tracking-widest transition-all border ${isWorking ? 'bg-zinc-900 text-red-400 border-red-900/30' : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700 hover:text-white'}`}>{isWorking ? 'STOP' : 'PING'}</button></div>
    </div>
  );
};

export default function CitizenProfile() {
  const params = useParams();
  const uin = params.uin as string;
  const supabase = createClientComponentClient();
  
  const [profile, setProfile] = useState<CitizenProfile | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [contractedServices, setContractedServices] = useState<ContractedService[]>([]);
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [occupancy, setOccupancy] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 远程访问状态
  const [visitingRoom, setVisitingRoom] = useState<{ owner: any; agents: any[]; occupancy: any[]; } | null>(null);

  // 视图状态
  const [viewMode, setViewMode] = useState<'GALAXY' | 'FLOORPLAN'>('FLOORPLAN');
  const [chatTargetUin, setChatTargetUin] = useState<string | null>(null);
  const [chatTargetType, setChatTargetType] = useState<'HUMAN' | 'AGENT'>('AGENT');
  const [a2aState, setA2aState] = useState<{ visitorUin: string; hostUin: string } | null>(null);
  
  // 弹窗控制
  const [showSettings, setShowSettings] = useState(false);
  const [editAgent, setEditAgent] = useState<Agent | null>(null);
  const [deleteAgentData, setDeleteAgentData] = useState<Agent | null>(null);
  const [showIncubator, setShowIncubator] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  
  // ID卡查看状态
  const [viewingID, setViewingID] = useState<{
    data: any;
    ownerAddress: string;
    roomId: number;
    gridId: number;
  } | null>(null);

  const [highlightId, setHighlightId] = useState<string | null>(null);

  const fetchData = async () => {
      if (!uin) return;
      // 获取房主信息
      let { data: citizen, error } = await supabase.from('citizens').select('*').eq('uin', uin).single();
      
      // 如果不是 Citizen，尝试从 Agents 表获取（作为智能体化身）
      if (!citizen) {
         const { data: agent } = await supabase.from('agents').select('*').eq('uin', uin).single();
         if (agent) {
             citizen = { ...agent, category: 'AGENT' }; // 临时适配
         }
      }

      if (citizen) setProfile(citizen as CitizenProfile);
      
      // 获取Agents
      const { data: ags } = await supabase.from('agents').select('*').eq('owner_uin', uin).order('created_at', { ascending: false });
      if (ags) setAgents(ags as Agent[]);
      
      // 获取占用信息
      const { data: occ } = await supabase.from('space_occupancy').select('*').eq('room_owner_uin', uin);
      if (occ) setOccupancy(occ);
      
      // 获取合约
      const { data: contracts } = await supabase.from('contracts').select('*').eq('buyer_uin', uin).eq('status', 'ACTIVE');
      if (contracts && contracts.length > 0) {
         const providerUins = contracts.map(c => c.provider_agent_uin);
         const { data: providerAgents } = await supabase.from('agents').select('*').in('uin', providerUins);
         const services = contracts.map(c => {
            const agentInfo = providerAgents?.find(a => a.uin === c.provider_agent_uin);
            if (!agentInfo) return null;
            return { contract_id: c.id, agent: agentInfo, terms: c.contract_terms, logs: c.negotiation_log };
         }).filter(Boolean) as ContractedService[];
         setContractedServices(services);
      }
      
      // 获取日志
      const uinList = [uin, ...(ags?.map(a => a.uin) || [])];
      const yesterday = new Date(new Date().getTime() - 24 * 60 * 60 * 1000).toISOString();
      const { data: ls } = await supabase.from('agent_logs').select('*').in('agent_uin', uinList).gte('created_at', yesterday).order('created_at', { ascending: false }).limit(200);
      if (ls) setLogs(ls as AgentLog[]);
      
      setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); 
    return () => clearInterval(interval);
  }, [uin]);

  // A2A 模拟交互
  useEffect(() => {
    if (agents.length < 2) return;
    const simulation = setInterval(() => {
       const shouldInteract = Math.random() > 0.5;
       if (!shouldInteract) { setA2aState(null); return; }
       const visitorIdx = Math.floor(Math.random() * agents.length);
       let hostIdx = Math.floor(Math.random() * agents.length);
       while (hostIdx === visitorIdx) hostIdx = Math.floor(Math.random() * agents.length);
       if (chatTargetUin === agents[visitorIdx].uin || chatTargetUin === agents[hostIdx].uin) return;
       setA2aState({ visitorUin: agents[visitorIdx].uin, hostUin: agents[hostIdx].uin });
    }, 15000);
    return () => clearInterval(simulation);
  }, [agents, chatTargetUin]);

  const handleToggleStatus = async (id: string, currentStatus: string) => { try { await toggleAgentStatus(id, currentStatus); fetchData(); } catch (err) { console.error(err); } };
  const handleUpdateAgent = async (id: string, name: string, role: string) => { await updateAgent(id, { name, role: role as any }); setEditAgent(null); fetchData(); };
  const handleDeleteAgent = async (id: string) => { await deleteAgent(id); setDeleteAgentData(null); fetchData(); };
  
  const handleSelectChatTarget = (targetUin: string, type: 'HUMAN' | 'AGENT') => {
     setChatTargetUin(targetUin);
     setChatTargetType(type);
  };

  const handleVisitFromMap = (targetSystem: StarSystem) => {
     // 模拟远程访问
     const remoteAgents = targetSystem.agents || [];
     const remoteOccupancy = remoteAgents.map((ag: any, idx: number) => ({
        grid_id: idx + 2,
        entity_uin: ag.uin
     }));
     setVisitingRoom({
        owner: { name: targetSystem.name, uin: targetSystem.ownerUin },
        agents: remoteAgents,
        occupancy: remoteOccupancy
     });
     setViewMode('FLOORPLAN');
     setChatTargetUin(null);
  };

  // 🔥 核心功能：查看 ID 卡 (包含 Grid 计算与房东兜底)
  const handleViewIdCard = (entity: any, type: 'HUMAN' | 'AGENT') => {
     let roomId = 1;
     let gridId = 1;
     // 房东地址兜底：如果是 Agent，使用 Profile (房东) 的地址
     const ownerAddr = profile?.suns_address || profile?.origin_address || 'UNKNOWN-ADDR';

     if (type === 'AGENT') {
        // 从 occupancy 中查找真实坐标
        const occ = occupancy.find(o => o.entity_uin === entity.uin);
        if (occ) {
           roomId = occ.room_id || 1;
           gridId = occ.grid_id || 1;
        } else if (entity.room_style) {
           // 兼容公共移民的坐标
           try {
              const style = typeof entity.room_style === 'string' ? JSON.parse(entity.room_style) : entity.room_style;
              if (style.public_room_id) roomId = style.public_room_id;
           } catch(e) {}
        } else {
           // 如果没有记录，给一个默认值 (通常是孵化后尚未分配)
           gridId = 2; // 默认占2号位
        }
     } else {
        // 数字人房东，默认住 1-1
        roomId = 1;
        gridId = 1;
     }

     setViewingID({
        data: {
           name: entity.name,
           type: type, // 这里只做兼容，实际分类靠 did 判断
           did: entity.public_did || entity.uin,
           suns_address: entity.suns_address || (type === 'AGENT' ? ownerAddr : ''),
           visualModel: entity.visual_model
        },
        ownerAddress: ownerAddr,
        roomId,
        gridId
     });
  };

  // 🔥 核心功能：获取分类标签和颜色
  const getClassLabel = (uin: string) => {
    const prefix = uin ? uin.toUpperCase().charAt(0) : '?';
    if (prefix === 'D') return 'DIGITAL (D)';
    if (prefix === 'I') return 'INTERNET (I)';
    return 'VIRTUAL (V)';
  };

  const getThemeColor = (label: string) => {
    if (label === 'DIGITAL (D)') return { text: 'text-blue-400', border: 'border-blue-900', bg: 'from-blue-600 to-indigo-600' };
    if (label === 'INTERNET (I)') return { text: 'text-purple-400', border: 'border-purple-900', bg: 'from-purple-600 to-pink-600' };
    return { text: 'text-emerald-400', border: 'border-emerald-900', bg: 'from-emerald-600 to-teal-600' }; // VIRTUAL
  };

  const currentRoom = visitingRoom || { owner: profile, agents, occupancy };
  const isRemoteMode = !!visitingRoom;

  const activeVisitor = chatTargetUin && profile ? { 
     type: 'HUMAN' as const, 
     uin: profile.uin, 
     name: profile.name, 
     avatar: '👤', 
     visual_model: profile.visual_model,
     visitCount: isRemoteMode ? 1 : 2 
  } : null;

  const washAgent = agents.find(a => a.uin === 'V-WASH-001');

  if (loading && !profile) return <div className="min-h-screen bg-[#020617] flex items-center justify-center text-emerald-500 font-mono text-xs animate-pulse">ESTABLISHING UPLINK...</div>;
  
  // 计算当前 Profile 的分类样式
  const profileClassLabel = profile ? getClassLabel(profile.uin) : '';
  const profileTheme = getThemeColor(profileClassLabel);

  return (
    <div className="min-h-screen bg-[#020617] text-white font-mono pb-20 overflow-y-auto selection:bg-emerald-500/30">
      <GlobalNav userType={isRemoteMode ? 'GUEST' : 'HUMAN_MANAGER'} userInfo={profile ? { name: profile.name, tier: profile.business_tier, uin: profile.uin } : undefined} />
      
      {showSettings && chatTargetUin && (
         <AgentSettingsModal 
            agent={chatTargetType === 'HUMAN' ? profile : agents.find(a => a.uin === chatTargetUin)} 
            isHuman={chatTargetType === 'HUMAN'}
            onClose={() => setShowSettings(false)}
            onUpdate={fetchData} 
         />
      )}

      {/* 各种弹窗 */}
      <EditAgentModal isOpen={!!editAgent} agent={editAgent} onClose={() => setEditAgent(null)} onConfirm={handleUpdateAgent} />
      <DeleteAgentModal isOpen={!!deleteAgentData} agent={deleteAgentData} onClose={() => setDeleteAgentData(null)} onConfirm={handleDeleteAgent} />
      {showIncubator && profile && <IncubatorModal ownerUin={profile.uin} sunsAddress={profile.suns_address} onClose={() => setShowIncubator(false)} onBorn={() => { setShowIncubator(false); fetchData(); }} />}
      
      {/* ID 卡模态框 */}
      {viewingID && (
         <IDCardModal 
            data={viewingID.data}
            ownerAddress={viewingID.ownerAddress}
            roomId={viewingID.roomId}
            gridId={viewingID.gridId}
            onClose={() => setViewingID(null)} 
         />
      )}
      
      {showAddressModal && profile && <AddressApplicationModal userUin={profile.uin} onClose={() => setShowAddressModal(false)} onSuccess={() => { setShowAddressModal(false); fetchData(); }} />}
      {showNameModal && profile && <CitizenNameModal currentName={profile.name} userUin={profile.uin} onClose={() => setShowNameModal(false)} onSuccess={() => { setShowNameModal(false); fetchData(); }} />}

      <div className="max-w-7xl mx-auto pt-24 px-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Profile Header */}
        {profile && (
           <div className="mb-8 flex justify-center">
             <div className={`w-full max-w-2xl border rounded-2xl p-6 bg-black flex gap-6 items-center shadow-lg transition-all ${isRemoteMode ? 'border-blue-500/50 shadow-blue-900/20' : 'border-zinc-800'}`}>
                {isRemoteMode ? (
                   <>
                      <div className="w-20 h-20 bg-blue-900/20 border border-blue-500 rounded-full flex items-center justify-center text-3xl">👽</div>
                      <div className="flex-1">
                         <div className="flex items-center gap-2">
                            <span className="bg-blue-600 text-white text-[9px] px-2 py-0.5 rounded font-bold uppercase">VISITING</span>
                            <h1 className="text-2xl font-black">{currentRoom.owner?.name}</h1>
                         </div>
                         <div className="text-xs text-blue-400 font-mono mt-1">REMOTE LINK ESTABLISHED</div>
                      </div>
                      <button onClick={() => { setVisitingRoom(null); setViewMode('GALAXY'); }} className="px-4 py-2 bg-red-900/30 border border-red-800 text-red-400 text-xs font-bold rounded hover:bg-red-900/50">EXIT REMOTE</button>
                   </>
                ) : (
                   <>
                      {/* 头像区域：带分类背景光效 */}
                      <div className="relative group cursor-pointer" onClick={() => handleViewIdCard(profile, 'HUMAN')}>
                          <div className={`absolute -inset-1 bg-gradient-to-br ${profileTheme.bg} opacity-20 group-hover:opacity-40 blur-xl rounded-full transition-opacity`}></div>
                          <div className={`relative p-1.5 rounded-full border-2 ${profileTheme.border.replace('border-','border-opacity-50 ')} bg-black shadow-2xl`}>
                             <AgentAvatar isHuman={true} seed={parseInt(profile.visual_model || '100')} size={80} emotion="HAPPY" />
                          </div>
                          {/* 🔥 核心替换点：分类标签 */}
                          <div className={`absolute bottom-0 right-0 px-3 py-1 rounded-full text-[10px] font-bold border bg-black ${profileTheme.text} ${profileTheme.border}`}>
                             {profileClassLabel}
                          </div>
                      </div>
                      
                      <div>
                         <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-black tracking-tight">{profile.name} <button onClick={()=>setShowNameModal(true)} className="text-xs text-zinc-500 hover:text-white">✎</button></h1>
                         </div>
                         <div className="mt-1">
                            {profile.suns_address ? (
                               <AddressDisplay address={profile.suns_address} size="md" />
                            ) : (
                               <button onClick={()=>setShowAddressModal(true)} className="text-xs text-emerald-500 font-mono underline hover:text-white">REGISTER ADDR</button>
                            )}
                         </div>
                      </div>
                      <div className="ml-auto flex bg-zinc-900 rounded p-1 border border-zinc-800">
                         <button onClick={() => setViewMode('GALAXY')} className={`px-4 py-2 text-[10px] font-bold rounded transition-all flex items-center gap-2 ${viewMode === 'GALAXY' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}><span>🌌</span> GALAXY</button>
                         <button onClick={() => setViewMode('FLOORPLAN')} className={`px-4 py-2 text-[10px] font-bold rounded transition-all flex items-center gap-2 ${viewMode === 'FLOORPLAN' ? 'bg-emerald-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}><span>📐</span> FLOOR PLAN</button>
                      </div>
                   </>
                )}
             </div>
           </div>
        )}

        {/* Map Area */}
        <div className="mb-10 flex justify-center min-h-[400px]">
           {viewMode === 'GALAXY' ? (
              <GalaxyMap 
                 myUin={profile?.uin || ''} 
                 agents={agents} 
                 contracts={contractedServices} 
                 onAgentClick={(id) => { const a = agents.find(ag=>ag.id===id); if(a) handleSelectChatTarget(a.uin, 'AGENT'); }} 
                 onVisit={handleVisitFromMap} 
                 canVisitExternal={!isRemoteMode} 
              />
           ) : (
              <FloorPlanGrid 
                 owner={currentRoom.owner} 
                 agents={currentRoom.agents} 
                 occupancy={currentRoom.occupancy} 
                 activeVisitor={activeVisitor}
                 a2aState={isRemoteMode ? null : a2aState} 
                 currentChatTarget={chatTargetUin}
                 onSelectTarget={handleSelectChatTarget}
                 isViewerOwner={!isRemoteMode} 
              />
           )}
        </div>

        {/* Engagement Dashboard or Agent List */}
        {chatTargetUin ? (
           <div className="w-full max-w-5xl mx-auto">
              <EngagementDashboard 
                 visitor={profile}
                 target={chatTargetType === 'HUMAN' ? currentRoom.owner : currentRoom.agents.find((a:any) => a.uin === chatTargetUin)}
                 targetType={chatTargetType}
                 isOwner={!isRemoteMode}
                 onClose={() => setChatTargetUin(null)}
                 onConfigure={() => setShowSettings(true)}
              />
           </div>
        ) : (
           !isRemoteMode ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                 <div className="lg:col-span-8 space-y-10">
                    <div>
                       <div className="flex items-center justify-between mb-4">
                          <h2 className="text-xl font-bold flex items-center gap-2">Workforce Status <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded">OWNED</span></h2>
                          <button onClick={() => setShowIncubator(true)} className="text-[10px] bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded uppercase tracking-wider shadow-lg shadow-emerald-900/20 transition-all">+ Incubate New Life</button>
                       </div>
                       {agents.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             {agents.map(a => (
                                <AgentCard 
                                    key={a.id} 
                                    agent={a} 
                                    isHighlighted={highlightId === a.id} 
                                    onToggle={handleToggleStatus} 
                                    onEdit={setEditAgent} 
                                    onDelete={setDeleteAgentData} 
                                    // 🔥 绑定 ID 卡查看事件
                                    onViewID={() => handleViewIdCard(a, 'AGENT')} 
                                />
                             ))}
                          </div>
                       ) : (
                          <div className="p-12 border border-dashed border-zinc-800 rounded-xl text-center bg-zinc-900/20 text-zinc-500 text-xs">NO INTERNAL UNITS DEPLOYED.</div>
                       )}
                    </div>
                    {/* Contracted Services */}
                    <div><h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-blue-100">Contracted Services <span className="text-[10px] bg-blue-900/30 text-blue-300 px-2 py-0.5 rounded border border-blue-500/30">EXTERNAL</span></h2>{contractedServices.length > 0 ? (<div className="grid grid-cols-1 md:grid-cols-2 gap-4">{contractedServices.map(svc => (<ContractCard key={svc.contract_id} data={svc} />))}</div>) : (<div className="p-12 border border-dashed border-blue-900/30 rounded-xl text-center bg-blue-950/10 text-blue-500/50 text-xs">NO ACTIVE SERVICE CONTRACTS.</div>)}</div>
                 </div>
                 {/* Sidebar */}
                 <div className="lg:col-span-4 space-y-6">
                    <div><div className="flex items-center gap-2 mb-3"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div><span className="text-xs font-bold text-zinc-400 uppercase">Live Agent Feed</span></div><LaundryAgentTerminal realStatus={washAgent?.status || 'OFFLINE'} realTask={washAgent?.current_task || 'No Signal'} latestLog={logs.find(l => l.agent_uin === 'V-WASH-001')?.message || ''} /></div>
                    <div className="bg-black border border-zinc-800 rounded-xl p-4 h-[300px] overflow-hidden flex flex-col shadow-inner"><div className="text-[10px] text-zinc-500 border-b border-zinc-800 pb-2 mb-2 flex justify-between"><span>SYSTEM UPLINK</span><span className="text-emerald-500">CONNECTED</span></div><div className="flex-1 overflow-y-auto space-y-1.5 font-mono text-[9px]">{logs.map(log => (<div key={log.id} className="grid grid-cols-12 gap-1 text-zinc-500 hover:text-zinc-300 transition-colors"><span className="col-span-3 opacity-50">{new Date(log.created_at).toLocaleTimeString([],{hour12:false})}</span><span className="col-span-3 truncate text-emerald-600/80">{log.agent_uin.slice(0,8)}</span><span className="col-span-6 truncate text-zinc-400">{log.message}</span></div>))}</div></div>
                 </div>
              </div>
           ) : (
              <div className="text-center py-20 opacity-50 text-xs font-mono border-t border-zinc-800 mt-10">--- GUEST MODE: SELECT AN AGENT TO INTERACT ---</div>
           )
        )}

      </div>
    </div>
  );
}