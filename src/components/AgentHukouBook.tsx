"use client";
import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { AddressDisplay } from '@/components/AddressDisplay'; // 🔥 引入新组件

interface HukouProps {
  agentUin: string;
  agentName: string;
}

interface LogRecord {
  id: string;
  event_type: string;
  old_value: string;
  new_value: string;
  timestamp: string;
  details: string; // 这里现在存的是 JSON 字符串
}

export const AgentHukouBook = ({ agentUin, agentName }: HukouProps) => {
  const supabase = createClientComponentClient();
  const [isOpen, setIsOpen] = useState(false);
  const [records, setRecords] = useState<LogRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchLedger = async () => {
        setLoading(true);
        const { data } = await supabase
          .from('agent_lifecycle_ledger')
          .select('*')
          .eq('agent_uin', agentUin)
          .order('timestamp', { ascending: false });
        
        if (data) setRecords(data as LogRecord[]);
        setLoading(false);
      };
      fetchLedger();
    }
  }, [isOpen, agentUin]);

  const parseDetails = (jsonStr: string) => {
    try {
      return JSON.parse(jsonStr);
    } catch (e) {
      return {}; 
    }
  };

  const renderEvent = (record: LogRecord) => {
    const meta = parseDetails(record.details);
    const isJson = Object.keys(meta).length > 0;

    // === A. 移民迁入 (Immigration) ===
    if (record.event_type === 'IMMIGRATION') {
       return (
          <div className="border border-blue-500/50 bg-blue-950/20 p-3 rounded mb-2 relative overflow-hidden">
             <div className="absolute top-0 right-0 bg-blue-600 text-white text-[8px] px-2 py-0.5 rounded-bl">ENTRY VISA</div>
             <div className="text-blue-400 font-bold mb-2">✈️ IMMIGRATION RECORD</div>
             <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-[9px] text-zinc-300">
                <div className="col-span-2 text-zinc-500 border-b border-blue-900/50 pb-1 mb-1">ORIGIN (SOURCE)</div>
                <div><span className="text-zinc-500">Prev Owner:</span> <br/>{meta.origin_owner || 'Unknown'}</div>
                <div className="col-span-2">
                   <span className="text-zinc-500">From Addr:</span> <br/>
                   <div className="mt-1"><AddressDisplay address={meta.origin_address} size="sm" /></div>
                </div>
                
                <div className="col-span-2 text-zinc-500 border-b border-blue-900/50 pb-1 mb-1 mt-2">DESTINATION (CURRENT)</div>
                <div><span className="text-zinc-500">New ID:</span> <br/>{meta.new_identity_id}</div>
                <div><span className="text-zinc-500">Grid:</span> #{meta.new_grid_id}</div>
                <div><span className="text-zinc-500">Entry Date:</span> <br/>{new Date(meta.migration_date || record.timestamp).toLocaleDateString()}</div>
                <div className="col-span-2">
                   <span className="text-zinc-500">New Addr:</span> <br/>
                   <div className="mt-1"><AddressDisplay address={meta.new_address_code} size="sm" /></div>
                </div>
             </div>
          </div>
       );
    }

    // === B. 本地诞生 (Genesis) ===
    if (record.event_type === 'GENESIS') {
       return (
          <div className="border border-emerald-500/50 bg-emerald-950/20 p-3 rounded mb-2 relative overflow-hidden">
             <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[8px] px-2 py-0.5 rounded-bl">CERTIFICATE</div>
             <div className="text-emerald-400 font-bold mb-2">🐣 GENESIS RECORD</div>
             <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-[9px] text-zinc-300">
                <div><span className="text-zinc-500">Birth Date:</span> <br/>{new Date(meta.birth_date || record.timestamp).toLocaleString()}</div>
                <div><span className="text-zinc-500">Identity ID:</span> <br/>{meta.identity_id || (record as any).agent_uin}</div>
                <div><span className="text-zinc-500">Init Grid:</span> #{meta.grid_id || 'Auto'}</div>
                <div className="col-span-2">
                   <span className="text-zinc-500">Origin Addr:</span> <br/>
                   <div className="mt-1"><AddressDisplay address={meta.address_code || 'N/A'} size="sm" /></div>
                </div>
             </div>
          </div>
       );
    }

    // === C. 普通记录 ===
    return (
      <div className="border-l-2 border-zinc-700 pl-3 ml-1 py-1">
         <div className="flex justify-between items-center">
            <span className={`font-bold text-[10px] ${record.event_type === 'RENAME' ? 'text-yellow-400' : 'text-zinc-300'}`}>
               {record.event_type}
            </span>
            <span className="text-[8px] text-zinc-600">{new Date(record.timestamp).toLocaleDateString()}</span>
         </div>
         {record.event_type === 'RENAME' ? (
            <div className="text-zinc-400 text-[9px]">
               Change: <span className="line-through opacity-50">{record.old_value}</span> ➔ <span className="text-white">{record.new_value}</span>
            </div>
         ) : (
            <div className="text-zinc-500 text-[9px]">{isJson ? JSON.stringify(meta) : record.details}</div>
         )}
      </div>
    );
  };

  return (
    <>
      <button 
        onClick={(e) => { e.stopPropagation(); setIsOpen(true); }}
        className="absolute top-3 right-3 z-40 group cursor-pointer"
        title="Confidential Life Ledger"
      >
        <div className="w-6 h-8 bg-[#0a0a0a] border border-zinc-600 rounded-[2px] flex items-center justify-center shadow-lg group-hover:border-emerald-400 group-hover:shadow-[0_0_10px_rgba(16,185,129,0.4)] transition-all">
           <span className="text-[10px] grayscale group-hover:grayscale-0">📜</span>
        </div>
        <div className="absolute -bottom-4 right-0 text-[6px] text-emerald-500 opacity-0 group-hover:opacity-100 bg-black/80 px-1 rounded transition-opacity whitespace-nowrap">
           HUKOU / ARCHIVE
        </div>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in" onClick={() => setIsOpen(false)}>
           <div 
             className="w-full max-w-sm bg-[#050505] border border-zinc-800 rounded shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
             onClick={e => e.stopPropagation()}
           >
              <div className="bg-zinc-900/50 p-4 border-b border-zinc-800 flex justify-between items-start">
                 <div>
                    <h3 className="text-emerald-500 font-black font-mono text-sm tracking-widest">LIFE LEDGER</h3>
                    <div className="text-[9px] text-zinc-500 uppercase mt-1">Classification: <span className="text-red-500 font-bold">TOP SECRET</span></div>
                    <div className="text-[9px] text-zinc-600 font-mono">ID: {agentUin}</div>
                 </div>
                 <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-white px-2">✕</button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
                 {loading ? (
                    <div className="text-center text-[10px] text-zinc-600 animate-pulse py-10">retrieving encrypted blocks...</div>
                 ) : records.length > 0 ? (
                    records.map((rec) => (
                       <div key={rec.id}>{renderEvent(rec)}</div>
                    ))
                 ) : (
                    <div className="text-center text-zinc-700 py-10 text-xs">No records archived.</div>
                 )}
              </div>

              <div className="p-2 bg-zinc-950 border-t border-zinc-900 text-center">
                 <span className="text-[7px] text-zinc-700 font-mono">Standard Space2.0 Protocol /// Archival Node</span>
              </div>
           </div>
        </div>
      )}
    </>
  );
};