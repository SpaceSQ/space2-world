"use client";
import React, { useState } from 'react';
import { draftContract, signContract } from '@/lib/contract-actions';

interface ContractModalProps {
  isOpen: boolean;
  mode: 'CREATE' | 'SIGN'; // 创建模式或签署模式
  provider: { uin: string; name: string };
  consumer: { uin: string; name: string };
  contractData?: any; // 如果是签署模式，传入已有数据
  onClose: () => void;
  onSuccess: () => void;
}

export const ContractSigningModal = ({ isOpen, mode, provider, consumer, contractData, onClose, onSuccess }: ContractModalProps) => {
  const [loading, setLoading] = useState(false);
  
  // 表单状态
  const [formData, setFormData] = useState({
    title: '',
    serviceType: 'DATA_SERVICE',
    amount: '',
    paymentMethod: 'OFFLINE_USDT',
    details: 'Standard API Access & Data Processing Service...',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 30*86400000).toISOString().slice(0, 10),
  });

  if (!isOpen) return null;

  const handleExecute = async () => {
    setLoading(true);
    try {
      if (mode === 'CREATE') {
        await draftContract({
          providerUin: provider.uin,
          consumerUin: consumer.uin,
          ...formData
        });
      } else {
        // 签署模式
        if (contractData?.id) {
           await signContract(contractData.id, consumer.uin);
        }
      }
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Contract Execution Failed");
    } finally {
      setLoading(false);
    }
  };

  const dataToShow = mode === 'SIGN' ? contractData : formData;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in zoom-in-95">
      <div className="w-full max-w-2xl bg-[#0f172a] border-2 border-indigo-500/50 rounded-xl shadow-[0_0_100px_rgba(99,102,241,0.2)] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-indigo-950/30 p-6 border-b border-indigo-900/50 flex justify-between items-center">
           <div>
              <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Space² Smart Contract Protocol</div>
              <h2 className="text-2xl font-black text-white mt-1">
                 {mode === 'CREATE' ? 'DRAFT NEW CONTRACT' : 'REVIEW & SIGN CONTRACT'}
              </h2>
           </div>
           <div className="text-4xl">📜</div>
        </div>

        {/* Body */}
        <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto">
           
           {/* Parties */}
           <div className="flex justify-between items-center bg-black/40 p-4 rounded border border-zinc-800">
              <div className="text-center">
                 <div className="text-[9px] text-zinc-500 uppercase">Provider (Party A)</div>
                 <div className="text-sm font-bold text-emerald-400 font-mono">{provider.uin}</div>
                 <div className="text-xs text-zinc-400">{provider.name}</div>
              </div>
              <div className="text-zinc-600">⇌</div>
              <div className="text-center">
                 <div className="text-[9px] text-zinc-500 uppercase">Consumer (Party B)</div>
                 <div className="text-sm font-bold text-blue-400 font-mono">{consumer.uin}</div>
                 <div className="text-xs text-zinc-400">{consumer.name}</div>
              </div>
           </div>

           {/* Form / Details */}
           <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                 <label className="text-[10px] text-zinc-500 uppercase font-bold">Contract Title</label>
                 {mode === 'CREATE' ? (
                   <input className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-sm text-white" 
                     value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Q3 Data Analysis" />
                 ) : (
                   <div className="text-white font-bold">{dataToShow.title}</div>
                 )}
              </div>

              <div>
                 <label className="text-[10px] text-zinc-500 uppercase font-bold">Service Type</label>
                 {mode === 'CREATE' ? (
                   <select className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-sm text-white"
                     value={formData.serviceType} onChange={e => setFormData({...formData, serviceType: e.target.value})}>
                     <option value="DATA_SERVICE">Data Service</option>
                     <option value="CODE_DEV">Code Development</option>
                     <option value="CONSULTING">Consulting</option>
                   </select>
                 ) : <div className="text-white">{dataToShow.service_type}</div>}
              </div>

              <div>
                 <label className="text-[10px] text-zinc-500 uppercase font-bold">Total Amount (S2C)</label>
                 {mode === 'CREATE' ? (
                   <input type="number" className="w-full bg-zinc-900 border border-emerald-900/50 text-emerald-400 rounded p-2 text-sm font-bold" 
                     value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} placeholder="0.00" />
                 ) : <div className="text-emerald-400 font-bold text-xl">{dataToShow.total_amount} S2C</div>}
              </div>

              <div className="col-span-2">
                 <label className="text-[10px] text-zinc-500 uppercase font-bold">Deliverables (Terms)</label>
                 {mode === 'CREATE' ? (
                   <textarea className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-sm text-white h-24" 
                     value={formData.details} onChange={e => setFormData({...formData, details: e.target.value})} />
                 ) : <div className="bg-zinc-900 p-3 rounded text-sm text-zinc-300 h-24 overflow-y-auto">{dataToShow.content_details}</div>}
              </div>
           </div>

           {/* Legal Notice */}
           <div className="text-[10px] text-zinc-500 bg-zinc-900/50 p-3 rounded border border-zinc-800">
              By cryptographically signing this Smart Contract, both parties agree to the Space² Decentralized Service Terms. 
              The transaction amount will be recorded on the Ledger for Reputation Score calculation.
           </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-black border-t border-zinc-800 flex justify-end gap-3">
           <button onClick={onClose} className="px-6 py-3 rounded text-xs font-bold text-zinc-400 hover:text-white">CANCEL</button>
           <button 
             onClick={handleExecute}
             disabled={loading || (mode === 'CREATE' && !formData.amount)}
             className={`px-8 py-3 rounded text-xs font-black tracking-widest text-white shadow-lg flex items-center gap-2
                ${loading ? 'bg-zinc-700' : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:scale-105 transition-transform'}
             `}
           >
             {loading ? 'PROCESSING ON-CHAIN...' : (mode === 'CREATE' ? '🚀 DEPLOY CONTRACT' : '✍️ SIGN & EXECUTE')}
           </button>
        </div>

      </div>
    </div>
  );
};