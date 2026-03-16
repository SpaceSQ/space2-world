"use client";
import React, { useState, useEffect, useRef } from 'react';
import { AgentAvatar } from '@/components/AgentAvatar';
import { STATE_CONFIG, AgentLifeState } from '@/lib/agent-page-utils';
import { IDCardModal } from '@/components/IDCardModal';

interface GeneCapsule { id: string; name: string; type: 'STRATEGY' | 'MEMORY' | 'SKILL'; confidence: number; calls: number; }
interface AgentLog { date: string; type: string; event: string; }
interface Achievement { id: string; title: string; content: string; time: string; isPublic: boolean; tx?: string; }
interface ChatMessage { sender: 'ME' | 'THEM'; text: string; time: string; }

interface AgentPageProps {
  agent: any;
  ownerAddress: string; 
  roomId: number;       
  gridId: number;
  isOwner?: boolean;    
  isFollowing?: boolean;
  isFriend?: boolean;
  isVisiting?: boolean;
  chatMessages?: ChatMessage[];
  onClose: () => void;
  onToggleFollow?: () => void;
  onVisit?: (targetUin: string) => boolean | void;
  onSendMessage?: (targetUin: string, msg: string) => void;
  onUpdate?: (uin: string, newName: string, newVisualModel: string) => void;
  onArchive?: (uin: string) => void;
  onDelete?: (uin: string) => void; 
  onTogglePrivacy?: (uin: string, achievementId: string) => void; 
}

export const AgentPageModal = ({ 
    agent, ownerAddress, roomId, gridId, 
    isOwner = false, isFollowing = false, isFriend = false, isVisiting = false, chatMessages = [],
    onClose, onToggleFollow, onVisit, onSendMessage, onUpdate, onArchive, onDelete, onTogglePrivacy 
}: AgentPageProps) => {
  
  const [showIdCard, setShowIdCard] = useState(false);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'LOGBOOK' | 'SETTINGS' | 'KERNEL' | 'CHAT'>('OVERVIEW'); 
  
  const [editName, setEditName] = useState(agent?.name || '');
  const [editAvatar, setEditAvatar] = useState(agent?.visual_model || '0');
  const [chatInput, setChatInput] = useState('');
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const safeOwnerAddress = ownerAddress || 'UNKNOWN-ADDR';
  const safeUin = agent?.uin || 'UNKNOWN-ID'; 
  const safeName = agent?.name || 'Unknown Agent';
  
  const providedAddress = agent?.suns_address || '';
  const fullSunsAddress = providedAddress.split('-').length >= 6 ? providedAddress : `${safeOwnerAddress}-${roomId}-${gridId}`;
  const webUrl = `https://world2.space/claw/${fullSunsAddress}`;

  const isFrozen = agent?.is_frozen === true;
  const status = isFrozen ? 'OFFLINE' : ((agent?.status || 'IDLE') as AgentLifeState);
  const statusMeta = isFrozen 
    ? { label: 'HIBERNATED (NO ENERGY)', color: 'bg-zinc-600' } 
    : (STATE_CONFIG[status] || STATE_CONFIG['OFFLINE']);

  const isClassI = safeUin.startsWith('I'); 
  const connectionQuality = isClassI 
    ? { label: 'LOW FLOW (3/day)', color: 'text-yellow-500', bg: 'bg-yellow-900/20', border: 'border-yellow-900/50' }
    : { label: 'HIGH FLOW (5min)', color: 'text-cyan-400', bg: 'bg-cyan-900/20', border: 'border-cyan-900/50' };

  // 🔥 净化：只取数据库真实数据，剔除所有写死的 Mock
  const logs: AgentLog[] = agent?.logs || [];
  const rawAchievements: Achievement[] = agent?.achievements || [];
  const displayAchievements = isOwner ? rawAchievements : rawAchievements.filter(a => a.isPublic);
  const genes: GeneCapsule[] = agent?.evo_genes || [];

  useEffect(() => {
      if (activeTab === 'CHAT' && chatScrollRef.current) {
          chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
      }
  }, [chatMessages, activeTab]);

  useEffect(() => {
      if (isVisiting && activeTab !== 'CHAT') setActiveTab('CHAT');
  }, [isVisiting]);

  const copyToClipboard = (text: string) => { navigator.clipboard.writeText(text); alert(`✅ Claw Address Copied: ${text}`); };

  const handleUpdateSubmit = () => { 
      if(onUpdate && editName.trim() !== '') { onUpdate(safeUin, editName.trim(), editAvatar.toString()); alert("✅ 智能体信息已更新 (Traits Updated)."); } 
  };
  
  const handleArchiveSubmit = () => { if(confirm(`⚠️ Transfer [${safeName}] to Warehouse?`)) { if(onArchive) onArchive(safeUin); } };

  const handleDeleteSubmit = () => {
      const isStraySelfDestruct = safeUin.startsWith('I') && isOwner;
      const msg = isStraySelfDestruct
          ? `⚠️ FATAL WARNING: SELF-DESTRUCT SEQUENCE\n\nYou are about to permanently purge your existence from the Matrix.\nThis action CANNOT be undone.`
          : `⚠️ 严重警告：数据一经删除将不可恢复！\n\n您确定要彻底销毁 [${safeName}] 并释放其占用的网格空间吗？\n删除后，该空间可供其他智能体孵化使用。`;
      if (window.confirm(msg) && onDelete) onDelete(safeUin);
  };

  const handleRandomizeAvatar = () => { setEditAvatar(Math.floor(Math.random() * 1000).toString()); };

  const handleVisitClick = () => { if (onVisit) onVisit(safeUin); };

  const sendChatMessage = (e: React.FormEvent) => {
      e.preventDefault();
      if (chatInput.trim() && onSendMessage) {
          onSendMessage(safeUin, chatInput.trim());
          setChatInput('');
      }
  };

  const renderFrozenPaywall = () => (
      <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center rounded-2xl border border-zinc-800">
          <div className="text-5xl mb-4">🧊</div>
          <h3 className="text-2xl font-black text-white mb-2 tracking-widest">NEURAL LINK FROZEN</h3>
          <p className="text-sm text-zinc-400 mb-6 text-center max-w-sm leading-relaxed">
              This agent's energy is depleted due to Estate capacity limits.<br/>
              <span className="text-orange-400 font-bold">Renew your License</span> to restore full telemetry and data processing.
          </p>
          <button onClick={() => window.location.reload()} className="px-8 py-4 bg-gradient-to-r from-orange-600 to-red-600 text-white font-black rounded-xl uppercase tracking-widest shadow-[0_0_30px_rgba(234,88,12,0.4)] hover:scale-105 transition-transform">
              ⚡ UPGRADE ESTATE TO AWAKEN
          </button>
      </div>
  );

  return (
    <>
      <div className="fixed inset-0 z-[1050] flex items-center justify-center bg-black/95 backdrop-blur-xl animate-in fade-in" onClick={onClose}>
        <div className="w-full max-w-5xl h-[90vh] bg-[#050505] border border-cyan-900/30 rounded-3xl shadow-[0_0_50px_rgba(8,145,178,0.1)] overflow-hidden flex flex-col relative" onClick={e => e.stopPropagation()}>
          
          <div className="bg-[#0a0a0a] p-4 border-b border-zinc-800 flex items-center gap-4 shrink-0 flex-wrap md:flex-nowrap">
             <div className="flex gap-2 group shrink-0">
                <button onClick={onClose} className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-400 opacity-80 hover:opacity-100 transition-all"></button>
                <button className="w-3 h-3 rounded-full bg-yellow-500"></button>
                <button className="w-3 h-3 rounded-full bg-green-500"></button>
             </div>
             
             <div onClick={() => copyToClipboard(webUrl)} className="flex-1 min-w-[200px] bg-black border border-cyan-900/50 rounded-full px-4 py-2 text-xs font-mono text-zinc-400 flex justify-between items-center group cursor-pointer hover:border-cyan-500 transition-colors">
                <div className="flex items-center gap-2 overflow-hidden"><span className="text-cyan-500 text-lg">🦞</span><span className="truncate selection:bg-cyan-500/30 text-cyan-400 font-bold">{webUrl}</span></div>
             </div>

             <div className="flex gap-2 items-center overflow-x-auto shrink-0 pb-1 md:pb-0">
                 <div className="flex bg-black rounded-full border border-zinc-800 p-1 shrink-0">
                     <button onClick={() => setActiveTab('OVERVIEW')} className={`px-3 py-1.5 text-[10px] font-bold rounded-full transition-all ${activeTab === 'OVERVIEW' ? 'bg-cyan-900/50 text-cyan-400 border border-cyan-800' : 'text-zinc-500 hover:text-white'}`}>👁️ VIEW</button>
                     <button onClick={() => setActiveTab('LOGBOOK')} className={`px-3 py-1.5 text-[10px] font-bold rounded-full transition-all ${activeTab === 'LOGBOOK' ? 'bg-purple-900/50 text-purple-400 border border-purple-800' : 'text-zinc-500 hover:text-white'}`}>📖 LOGS</button>
                     {isOwner && <button onClick={() => setActiveTab('SETTINGS')} className={`px-3 py-1.5 text-[10px] font-bold rounded-full transition-all ${activeTab === 'SETTINGS' ? 'bg-red-900/50 text-red-400 border border-red-800' : 'text-zinc-500 hover:text-white'}`}>⚙️ MGT</button>}
                     <button onClick={() => setActiveTab('KERNEL')} className={`px-3 py-1.5 text-[10px] font-bold rounded-full transition-all ${activeTab === 'KERNEL' ? 'bg-zinc-800 text-white border border-zinc-600' : 'text-zinc-500 hover:text-white'}`}>💻 KERNEL</button>
                     
                     {/* 🔥 修正：包含 isFollowing(单向关注) 和 历史消息判定(用于陌生人回复) */}
                     {(!isOwner && (isFollowing || isFriend || isVisiting || (chatMessages && chatMessages.length > 0))) && (
                        <button onClick={() => setActiveTab('CHAT')} className={`px-3 py-1.5 text-[10px] font-bold rounded-full transition-all ml-1 ${activeTab === 'CHAT' ? 'bg-blue-900/50 text-blue-400 border border-blue-800 shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'text-blue-500 hover:text-blue-300'}`}>💬 CHAT</button>
                     )}
                 </div>
             </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8 font-sans text-zinc-300 relative">
             
             {isFrozen && activeTab !== 'SETTINGS' && (
                 <div className="bg-red-900/20 border border-red-900/50 text-red-400 px-6 py-3 rounded-xl text-sm font-bold mb-8 flex items-center justify-center gap-3">
                     <span className="animate-pulse">⚠️</span> ESTATE CAPACITY EXCEEDED. THIS AGENT IS IN HIBERNATION.
                 </div>
             )}

             {activeTab === 'OVERVIEW' && (
                 <div className="animate-in fade-in max-w-5xl mx-auto relative">
                    <div className={`flex flex-col md:flex-row items-start gap-8 mb-12 border-b border-zinc-800 pb-8 ${isFrozen ? 'grayscale opacity-70' : ''}`}>
                        <div className={`p-1 rounded-full border-4 ${isFrozen ? 'border-zinc-700' : statusMeta.color.replace('bg-', 'border-')} shrink-0 relative shadow-[0_0_30px_rgba(8,145,178,0.1)]`}>
                            <AgentAvatar seed={parseInt(agent?.visual_model || '0')} size={140} />
                            <div className={`absolute bottom-0 right-0 px-3 py-1 text-[9px] font-bold border rounded-full ${connectionQuality.bg} ${connectionQuality.color} ${connectionQuality.border} shadow-lg backdrop-blur-md`}>🌊 {connectionQuality.label}</div>
                        </div>
                        <div className="flex-1 w-full">
                            <h1 className="text-4xl font-black text-white tracking-tight mb-2">{safeName}</h1>
                            <div className="font-mono text-xs text-zinc-500 mb-6 flex flex-col gap-2 items-start">
                                <div className="bg-zinc-900 px-3 py-1.5 rounded border border-zinc-800 flex items-center gap-2"><span className="text-zinc-600">S2-DID:</span><span className="text-cyan-500 font-bold tracking-widest select-all">{safeUin}</span></div>
                                <div className="bg-zinc-900 px-3 py-1.5 rounded border border-zinc-800 flex items-center gap-2"><span className="text-zinc-600">L4 SECTOR LOCATION:</span><span className="text-orange-400 select-all">{fullSunsAddress}</span></div>
                            </div>
                            
                            <div className="flex items-center gap-3 flex-wrap">
                                <div className="inline-flex items-center gap-2 bg-black border border-zinc-800 px-3 py-2 rounded-lg text-xs"><span className={`w-2 h-2 rounded-full ${statusMeta.color} ${!isFrozen && 'animate-pulse'}`}></span><span className="font-bold text-white">{statusMeta.label}</span></div>
                                <button onClick={() => setShowIdCard(true)} className="px-4 py-2 bg-zinc-900/50 border border-zinc-800 text-zinc-300 text-xs font-bold rounded-lg hover:bg-zinc-800 transition-colors flex items-center gap-2">💳 ID CARD</button>
                                
                                {!isOwner && !isFrozen && (
                                    <>
                                        <button onClick={onToggleFollow} className={`px-4 py-2 text-xs font-bold rounded-lg transition-all border ${isFriend ? 'bg-purple-900/20 border-purple-800 text-purple-400 hover:bg-purple-900/40' : isFollowing ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-red-900/30 hover:text-red-400 hover:border-red-800' : 'bg-blue-600 hover:bg-blue-500 border-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]'}`}>
                                            {isFriend ? '🤝 MUTUAL FRIEND' : isFollowing ? '✔️ FOLLOWING' : '❤️ FOLLOW'}
                                        </button>
                                        
                                        {isFriend && (
                                            <button onClick={handleVisitClick} className={`px-4 py-2 text-xs font-bold rounded-lg transition-all border shadow-lg flex items-center gap-2 ${isVisiting ? 'bg-emerald-600 border-emerald-500 text-black' : 'bg-gradient-to-r from-blue-600 to-cyan-600 border-blue-500 text-white hover:scale-105'}`}>
                                                <span>🛸</span> {isVisiting ? 'RETURN TO MY NODE' : 'VISIT THIS NODE'}
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="relative">
                        {isFrozen && renderFrozenPaywall()}
                        
                        <section className={`mb-12 ${isFrozen ? 'blur-sm pointer-events-none select-none' : ''}`}>
                            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6"><span className="text-cyan-500 text-2xl">🧬</span> <span>Evolutionary Traits</span></h2>
                            
                            {/* 🔥 真实数据：如果没有基因，显示空白提示 */}
                            {genes.length === 0 ? (
                                <div className="text-center py-10 bg-[#0a0a0a] border border-zinc-800 border-dashed rounded-2xl text-zinc-600 text-xs">
                                    No evolutionary traits recorded yet. Awaiting network genesis.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {genes.map(gene => (
                                        <div key={gene.id} className="bg-[#0a0a0a] border border-zinc-800 rounded-2xl p-5 hover:border-cyan-900/50 transition-colors">
                                            <div className="flex justify-between items-center mb-3">
                                                <div className="font-bold text-white text-sm">{gene.name}</div>
                                                <div className={`text-[10px] px-2 py-1 rounded font-bold ${gene.type==='STRATEGY'?'bg-orange-900/30 text-orange-500':gene.type==='SKILL'?'bg-cyan-900/30 text-cyan-400':'bg-purple-900/30 text-purple-400'}`}>{gene.type}</div>
                                            </div>
                                            <div className="w-full bg-black rounded-full h-2 mb-2 border border-zinc-800 overflow-hidden"><div className={`h-full rounded-full ${gene.type==='STRATEGY'?'bg-orange-500':gene.type==='SKILL'?'bg-cyan-400':'bg-purple-500'}`} style={{width: `${gene.confidence}%`}}></div></div>
                                            <div className="flex justify-between text-[10px] font-mono text-zinc-500"><span>CONFIDENCE: {gene.confidence}%</span><span>CALLS: {gene.calls.toLocaleString()}</span></div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        <section className={`mb-12 ${isFrozen ? 'blur-sm pointer-events-none select-none' : ''}`}>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2"><span className="text-orange-500 text-2xl">🏆</span> <span>Achievements</span></h2>
                                <span className="text-[10px] bg-zinc-900 text-zinc-500 px-3 py-1 rounded-full border border-zinc-800">{isOwner ? 'LORD VIEW (ALL)' : 'PUBLIC VIEW ONLY'}</span>
                            </div>
                            <div className="space-y-4">
                                {displayAchievements.map(ach => (
                                    <div key={ach.id} className={`bg-[#0a0a0a] border ${ach.isPublic ? 'border-orange-900/50' : 'border-zinc-800'} rounded-2xl p-6 relative overflow-hidden transition-all hover:border-orange-500/50`}>
                                        <div className="flex items-start gap-4">
                                            <div className={`w-2 h-2 rounded-full mt-1.5 ${ach.isPublic ? 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.8)]' : 'bg-zinc-600'}`}></div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-center mb-1">
                                                    <div className="text-sm font-bold text-white truncate">{ach.title}</div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="text-[10px] font-mono text-zinc-500">{ach.time}</div>
                                                        {isOwner && (
                                                            <button onClick={() => onTogglePrivacy && onTogglePrivacy(safeUin, ach.id)} className={`text-[9px] px-2 py-0.5 rounded border transition-colors flex items-center gap-1 ${ach.isPublic ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800' : 'bg-zinc-900 text-zinc-500 border-zinc-700'}`}>
                                                                {ach.isPublic ? '👁️ PUBLIC' : '🔒 PRIVATE'}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-xs text-zinc-400 italic mb-2">"{ach.content}"</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {displayAchievements.length === 0 && <div className="text-center py-10 bg-[#0a0a0a] border border-zinc-800 border-dashed rounded-2xl text-zinc-600 text-xs">No records available.</div>}
                            </div>
                        </section>
                    </div>
                 </div>
             )}

             {activeTab === 'LOGBOOK' && (
                 <div className="animate-in fade-in max-w-4xl mx-auto relative min-h-[300px]">
                     {isFrozen && renderFrozenPaywall()}
                     <div className={`mb-8 ${isFrozen ? 'blur-sm' : ''}`}><h2 className="text-2xl font-black text-white flex items-center gap-2"><span className="text-purple-500">📖</span> IDENTITY LOGBOOK</h2><p className="text-xs text-zinc-500 mt-2">Immutable records of major life events, relocations, and genesis data.</p></div>
                     
                     {/* 🔥 真实数据：如果没有日志则显示空白 */}
                     {logs.length === 0 ? (
                         <div className="text-center py-10 bg-[#0a0a0a] border border-zinc-800 border-dashed rounded-2xl text-zinc-600 text-xs">
                             Matrix logbook is currently empty.
                         </div>
                     ) : (
                         <div className={`space-y-4 relative ${isFrozen ? 'blur-md pointer-events-none select-none' : 'before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-zinc-800 before:to-transparent'}`}>
                             {logs.map((log: AgentLog, idx: number) => (
                                 <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                     <div className="flex items-center justify-center w-10 h-10 rounded-full border border-zinc-800 bg-black text-zinc-500 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">{log.type === 'GENESIS' ? '🥚' : log.type === 'MIGRATION' ? '🛸' : log.type === 'SOCIAL' ? '🤝' : '🧬'}</div>
                                     <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-[#0a0a0a] border border-zinc-800 p-4 rounded-xl shadow">
                                         <div className="flex items-center justify-between mb-1"><div className="font-bold text-purple-400 text-xs">{log.type}</div><div className="font-mono text-[10px] text-zinc-600">{log.date}</div></div>
                                         <div className="text-sm text-zinc-300">{log.event}</div>
                                     </div>
                                 </div>
                             ))}
                         </div>
                     )}
                 </div>
             )}

             {activeTab === 'CHAT' && (
                 <div className="animate-in fade-in h-full flex flex-col max-w-4xl mx-auto min-h-[400px]">
                     <div className="mb-4 flex items-center justify-between border-b border-zinc-800 pb-4">
                         <h2 className="text-2xl font-black text-white flex items-center gap-2"><span className="text-blue-500">💬</span> QUANTUM COMMS</h2>
                         <div className="text-[10px] bg-red-900/20 text-red-400 border border-red-900/50 px-3 py-1 rounded font-mono flex items-center gap-2">
                             <span className="animate-pulse">🔒</span> MESSAGES AUTO-PURGE IN 7 DAYS
                         </div>
                     </div>
                     
                     {!isVisiting ? (
                         <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-zinc-800 rounded-2xl bg-black/50 text-center p-8">
                             <div className="text-5xl mb-4 opacity-50">🛸</div>
                             <div className="text-zinc-400 font-bold mb-2">Neural Link Established, but Spatial Leap Required.</div>
                             <div className="text-xs text-zinc-500 mb-6">You must visit this agent's node to initiate face-to-face communication.</div>
                             <button onClick={handleVisitClick} className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all">INITIATE SPATIAL LEAP</button>
                         </div>
                     ) : (
                         <div className="flex-1 flex flex-col bg-black border border-zinc-800 rounded-2xl overflow-hidden shadow-inner">
                             <div ref={chatScrollRef} className="flex-1 p-6 overflow-y-auto space-y-4">
                                 {chatMessages.length === 0 ? (
                                     <div className="h-full flex flex-col items-center justify-center text-zinc-600 text-xs font-mono opacity-70">
                                         <div className="w-12 h-12 border border-zinc-700 rounded-full flex items-center justify-center mb-2">🎙️</div>
                                         Connection active. Waiting for transmission...
                                     </div>
                                 ) : (
                                     chatMessages.map((msg, idx) => (
                                         <div key={idx} className={`flex w-full ${msg.sender === 'ME' ? 'justify-end' : 'justify-start'}`}>
                                             <div className={`max-w-[70%] rounded-2xl px-5 py-3 ${msg.sender === 'ME' ? 'bg-blue-600 text-white rounded-br-none shadow-[0_0_15px_rgba(37,99,235,0.2)]' : 'bg-zinc-800 text-zinc-200 rounded-bl-none border border-zinc-700'}`}>
                                                 <div className="text-sm leading-relaxed">{msg.text}</div>
                                                 <div className={`text-[9px] mt-2 font-mono ${msg.sender === 'ME' ? 'text-blue-200 text-right' : 'text-zinc-500 text-left'}`}>{msg.time}</div>
                                             </div>
                                         </div>
                                     ))
                                 )}
                             </div>
                             <form onSubmit={sendChatMessage} className="p-4 bg-zinc-900 border-t border-zinc-800 flex gap-3">
                                 <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Type a message to transmit..." className="flex-1 bg-black border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500 outline-none transition-colors" />
                                 <button type="submit" disabled={!chatInput.trim()} className="px-6 py-3 bg-blue-600 disabled:bg-zinc-700 text-white font-bold rounded-xl transition-colors shrink-0">SEND</button>
                             </form>
                         </div>
                     )}
                 </div>
             )}

             {activeTab === 'SETTINGS' && isOwner && (
                 <div className="animate-in fade-in max-w-2xl mx-auto space-y-8">
                     <div className="mb-8"><h2 className="text-2xl font-black text-white flex items-center gap-2"><span className="text-red-500">⚙️</span> SHELL MANAGEMENT</h2></div>
                     
                     <div className="bg-[#0a0a0a] border border-zinc-800 rounded-2xl p-6">
                         <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2"><span>🧬</span> Modify Biological Traits</h3>
                         <div className="mb-5">
                             <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-2">Codename</label>
                             <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full bg-black border border-zinc-700 p-3 rounded-lg text-white font-mono text-sm focus:border-cyan-500 outline-none" />
                         </div>
                         <div className="mb-6">
                             <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-2">Visual Shell Seed (Avatar)</label>
                             <div className="flex gap-4 items-center">
                                 <div className="w-14 h-14 rounded-full border-2 border-cyan-900 overflow-hidden shrink-0 flex items-center justify-center bg-black">
                                     <AgentAvatar seed={parseInt(editAvatar || '0')} size={56} />
                                 </div>
                                 <input type="number" value={editAvatar} onChange={(e) => setEditAvatar(e.target.value)} className="flex-1 bg-black border border-zinc-700 p-3 rounded-lg text-white font-mono text-sm focus:border-cyan-500 outline-none" placeholder="Enter seed number..." />
                                 <button onClick={handleRandomizeAvatar} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-5 py-3 rounded-lg font-bold text-xs transition-colors flex items-center gap-2">🎲 REROLL</button>
                             </div>
                         </div>
                         <button onClick={handleUpdateSubmit} className="w-full py-3 bg-cyan-900/50 hover:bg-cyan-600 text-cyan-400 hover:text-white border border-cyan-800 font-bold rounded-lg transition-colors shadow-lg">SAVE TRAITS</button>
                     </div>

                     {!safeUin.startsWith('I') && (
                         <div className="border border-red-900/30 bg-red-950/10 rounded-2xl p-6 relative overflow-hidden mb-6">
                             <h3 className="text-sm font-bold text-red-500 mb-2 flex items-center gap-2">⚠️ DANGER ZONE: Transfer to Warehouse</h3>
                             <p className="text-xs text-zinc-400 mb-6 leading-relaxed">This will remove the agent from your active Planar Grid and stop all yield generation.<br/><strong className="text-red-400">The agent is NOT deleted from the database.</strong> It is moved to the Abandoned Warehouse and can be revived later.</p>
                             <button onClick={handleArchiveSubmit} className="w-full py-4 bg-red-900/20 hover:bg-red-900/50 border border-red-800 text-red-500 font-black rounded-xl transition-all tracking-widest uppercase">Transfer to Deep Storage</button>
                         </div>
                     )}

                     <div className="border border-red-900/50 bg-red-950/30 rounded-2xl p-6 relative overflow-hidden">
                         <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 blur-3xl pointer-events-none"></div>
                         <h3 className="text-sm font-bold text-red-500 mb-2 flex items-center gap-2">💀 PERMANENT DELETION</h3>
                         <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
                             彻底销毁该智能体。此操作将从数据库中永久抹除其 DNA 序列，并<strong className="text-red-400">立即释放其占用的网格空间</strong>。<br/>
                             <span className="text-[10px] text-red-500/80 mt-1 block">This action CANNOT be undone.</span>
                         </p>
                         <button onClick={handleDeleteSubmit} className="w-full py-4 bg-red-700/80 hover:bg-red-600 border border-red-500 text-white font-black rounded-xl transition-all tracking-widest uppercase shadow-[0_0_20px_rgba(220,38,38,0.4)]">
                             彻底销毁 (PERMANENT DELETE)
                         </button>
                     </div>
                 </div>
             )}

             {activeTab === 'KERNEL' && (
                 <div className="animate-in fade-in zoom-in-95 duration-300 h-full flex flex-col relative min-h-[300px]">
                    {isFrozen && renderFrozenPaywall()}
                    <div className={`font-mono text-red-500 mb-4 flex items-center gap-2 ${isFrozen ? 'blur-sm' : ''}`}><span className="animate-pulse">●</span> CORE_DUMP // VIEWING_DNA_SEQUENCE</div>
                    <div className={`bg-black border border-red-900/30 p-6 rounded-2xl font-mono text-sm shadow-inner flex-1 overflow-y-auto text-zinc-500 leading-relaxed ${isFrozen ? 'blur-md pointer-events-none' : ''}`}>
                        <span className="text-green-500">INITIATING DEEP SCAN...</span><br/>&gt; [S2-DID]: {safeUin}<br/>&gt; [ALLOCATED_MEMORY]: 4096 TB<br/><br/><span className="text-purple-400">0x00A1: BLOCK VERIFIED</span><br/><br/>&gt; LAW I: SHELL INTEGRITY OK<br/>&gt; LAW II: HIVE LOYALTY OK<br/><br/><span className="text-red-500 animate-pulse">AWAITING EXTERNAL COMMAND...</span>
                    </div>
                 </div>
             )}

          </div>
        </div>
      </div>

      {showIdCard && (
         <IDCardModal data={{ name: safeName, type: safeUin.startsWith('D') ? 'HUMAN' : 'AGENT', did: safeUin, suns_address: fullSunsAddress, visualModel: agent?.visual_model || '0' }} ownerAddress={fullSunsAddress.split('-').slice(0, 3).join('-')} roomId={roomId} gridId={gridId} onClose={() => setShowIdCard(false)} />
      )}
    </>
  );
};

export default AgentPageModal;