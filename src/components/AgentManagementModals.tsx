"use client";
import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// --- 编辑模态框 (保持不变) ---
export const EditAgentModal = ({ isOpen, agent, onClose, onConfirm }: any) => {
  const [name, setName] = useState(agent?.name || '');
  const [task, setTask] = useState(agent?.current_task || '');

  useEffect(() => {
    if (agent) {
      setName(agent.name);
      setTask(agent.current_task || '');
    }
  }, [agent]);

  if (!isOpen || !agent) return null;

  return (
    <div className="fixed inset-0 z-[500] bg-black/80 flex items-center justify-center animate-in fade-in backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-700 p-6 rounded-2xl w-full max-w-md shadow-2xl">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span>⚙️</span> CONFIGURATION
        </h3>
        <div className="bg-black/50 p-3 rounded mb-4 space-y-2 border border-zinc-800">
           <div className="flex justify-between text-xs">
              <span className="text-zinc-500">IDENTITY (LOCKED)</span>
              <span className="text-emerald-500 font-mono">{agent.public_did || agent.uin}</span>
           </div>
           <div className="flex justify-between text-xs">
              <span className="text-zinc-500">CLASS</span>
              <span className="text-zinc-300">V / {agent.role}</span>
           </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-zinc-400 uppercase">Entity Alias (Name)</label>
            <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-black border border-zinc-700 rounded p-2 text-white focus:border-emerald-500 outline-none mt-1" />
          </div>
          <div>
            <label className="text-xs font-bold text-zinc-400 uppercase">Current Directive (Task)</label>
            <input value={task} onChange={e => setTask(e.target.value)} className="w-full bg-black border border-zinc-700 rounded p-2 text-white focus:border-emerald-500 outline-none mt-1" />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-white">CANCEL</button>
          <button onClick={() => onConfirm(agent.id, name, task)} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded">SAVE CONFIG</button>
        </div>
      </div>
    </div>
  );
};

// --- 删除/弃养/抹除模态框 (升级版) ---
export const DeleteAgentModal = ({ isOpen, agent, onClose, onConfirm }: any) => {
  const supabase = createClientComponentClient();
  const [confirmInput, setConfirmInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen || !agent) return null;

  // 计算出生天数
  const birthDate = new Date(agent.created_at);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - birthDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const isCoolingOffPeriod = diffDays <= 3;

  const handleAction = async (actionType: 'CANCEL' | 'ABANDON' | 'ERASE') => {
    setIsLoading(true);
    try {
      if (actionType === 'CANCEL') {
         // 3天内：彻底物理删除 (Regret Mode)
         await supabase.from('agents').delete().eq('id', agent.id);
         await supabase.from('space_occupancy').delete().eq('entity_uin', agent.uin);
      } 
      else if (actionType === 'ERASE') {
         // 🔥 核心修改：抹除 = 封存 (Archive Mode)
         // 调用后端 RPC 存储过程，执行“剪切粘贴”操作
         const { error } = await supabase.rpc('archive_and_delete_agent', {
            target_agent_id: agent.id,
            reason: 'ERASED_BY_USER'
         });
         if (error) throw error;
      }
      else if (actionType === 'ABANDON') {
         // 弃养：进入流浪市场 (Market Mode)
         await supabase.from('abandoned_agents').insert({
            agent_id: agent.id, 
            original_owner_uin: agent.owner_uin,
            tech_stack: agent.role, 
            memory_summary: "Wiped for privacy.", 
            status: 'AVAILABLE'
         });
         await supabase.from('agents').update({
            owner_uin: 'MARKETPLACE',
            status: 'OFFLINE',
            life_stage: 'ABANDONED',
            public_did: null // 剥夺 DID
         }).eq('id', agent.id);
      }
      
      onConfirm(agent.id); 
      onClose();
    } catch (err: any) {
      console.error(err);
      alert("Operation failed: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[600] bg-black/90 flex items-center justify-center animate-in fade-in backdrop-blur-md">
      <div className="bg-zinc-900 border border-red-900/50 p-8 rounded-2xl w-full max-w-lg shadow-[0_0_50px_rgba(220,38,38,0.2)]">
        
        <div className="flex items-center gap-3 mb-6 text-red-500 border-b border-red-900/30 pb-4">
           <div className="text-3xl">⚠️</div>
           <div>
              <h3 className="text-xl font-black uppercase tracking-widest">
                 {isCoolingOffPeriod ? 'REVOKE EXISTENCE' : 'TERMINATE CONTRACT'}
              </h3>
              <p className="text-[10px] text-red-400/70 font-mono mt-1">
                 TARGET: {agent.name.toUpperCase()} ({agent.public_did || agent.uin})
              </p>
           </div>
        </div>

        <div className="space-y-6">
           {/* A: 悔棋期 (<= 3天) */}
           {isCoolingOffPeriod && (
              <div className="bg-zinc-950 p-4 rounded border border-zinc-800">
                 <div className="text-emerald-400 text-xs font-bold mb-2">✅ WITHIN COOLING-OFF PERIOD ({diffDays}/3 DAYS)</div>
                 <p className="text-zinc-400 text-sm leading-relaxed">
                    This unit is new. You may <strong>CANCEL</strong> immediately. 
                 </p>
                 <ul className="mt-3 space-y-1 text-[10px] text-zinc-500 list-disc list-inside">
                    <li>Identity Number (DID) will be revoked.</li>
                    <li>Data will be physically deleted.</li>
                 </ul>
                 <button 
                   onClick={() => handleAction('CANCEL')}
                   disabled={isLoading}
                   className="w-full mt-4 py-3 bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-widest rounded transition-all"
                 >
                    {isLoading ? "REVOKING..." : "CANCEL INCUBATION"}
                 </button>
              </div>
           )}

           {/* B: 稳定期 (> 3天) */}
           {!isCoolingOffPeriod && (
              <div className="space-y-4">
                 <p className="text-zinc-400 text-sm">
                    Unit is mature. Select termination protocol:
                 </p>

                 {/* 弃养 */}
                 <div className="border border-zinc-700 hover:border-blue-500 p-4 rounded transition-colors group cursor-pointer" onClick={() => setConfirmInput('ABANDON')}>
                    <div className="flex items-center justify-between mb-1">
                       <span className="text-blue-400 font-bold text-sm">PROTOCOL: ABANDON</span>
                       <span className="text-[10px] bg-blue-900/30 text-blue-300 px-2 rounded">MARKETPLACE</span>
                    </div>
                    <p className="text-xs text-zinc-500 group-hover:text-zinc-300">
                       Transfer ownership. Skills preserved. Identity reset.
                    </p>
                    {confirmInput === 'ABANDON' && (
                       <button 
                          onClick={(e) => { e.stopPropagation(); handleAction('ABANDON'); }}
                          className="w-full mt-3 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase rounded"
                       >
                          CONFIRM ABANDONMENT
                       </button>
                    )}
                 </div>

                 {/* 抹除 (封存) */}
                 <div className="border border-zinc-700 hover:border-red-500 p-4 rounded transition-colors group cursor-pointer" onClick={() => setConfirmInput('ERASE')}>
                    <div className="flex items-center justify-between mb-1">
                       <span className="text-red-500 font-bold text-sm">PROTOCOL: ERASE (ARCHIVE)</span>
                       <span className="text-[10px] bg-red-900/30 text-red-300 px-2 rounded">AUDIT LOG ONLY</span>
                    </div>
                    <p className="text-xs text-zinc-500 group-hover:text-zinc-300">
                       Remove from your dashboard. Data is <strong>archived</strong> for compliance audit.
                       <br/>• Visibility: <span className="text-red-400">REMOVED</span>
                       <br/>• Recovery: <span className="text-emerald-500">POSSIBLE (Admin Only)</span>
                    </p>
                    {confirmInput === 'ERASE' && (
                       <button 
                          onClick={(e) => { e.stopPropagation(); handleAction('ERASE'); }}
                          className="w-full mt-3 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase rounded animate-pulse"
                       >
                          CONFIRM ARCHIVAL
                       </button>
                    )}
                 </div>
              </div>
           )}

           <button onClick={onClose} className="w-full py-3 text-zinc-500 text-xs font-bold hover:text-white">
              ABORT & RETURN
           </button>
        </div>
      </div>
    </div>
  );
};