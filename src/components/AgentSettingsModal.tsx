"use client";
import React, { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { AgentAvatar } from '@/components/AgentAvatar';

interface SettingsProps {
  agent: any; 
  isHuman: boolean;
  onClose: () => void;
  onUpdate: () => void; 
}

export const AgentSettingsModal = ({ agent, isHuman, onClose, onUpdate }: SettingsProps) => {
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(false);

  // 初始化头像种子
  const [tempVisual, setTempVisual] = useState(agent.visual_model || '100');
  
  // 生成 24 个候选头像
  const [candidates] = useState(() => Array.from({ length: 24 }, () => Math.floor(Math.random() * 10000).toString()));

  const handleSaveVisual = async () => {
    setLoading(true);
    
    // 1. 确定表名
    const table = isHuman ? 'citizens' : 'agents';
    console.log(`[Settings] Updating ${table} UIN:${agent.uin} -> Visual:${tempVisual}`);

    try {
        // 2. 执行更新
        const { error } = await supabase
          .from(table)
          .update({ visual_model: tempVisual })
          .eq('uin', agent.uin);

        if (error) throw error;
        
        console.log("✅ Update Success!");
        
        // 3. 强制刷新页面，确保看到变化
        window.location.reload(); 

    } catch (err: any) {
        console.error("❌ Update Error:", err);
        // 🔥 关键：如果这里弹窗，告诉我内容，我就知道是不是数据库缺列了
        alert(`Update Failed: ${err.message || JSON.stringify(err)}`);
        setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[600] bg-black/90 flex items-center justify-center animate-in fade-in backdrop-blur-md">
      <div className="w-full max-w-4xl bg-zinc-900 border border-zinc-700 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 bg-black/50 flex justify-between items-center shrink-0">
           <div className="flex items-center gap-4">
              <h2 className="text-lg font-black text-white uppercase flex items-center gap-2">
                 ⚙️ AVATAR CONFIGURATION /// {agent.name}
              </h2>
           </div>
           <button onClick={onClose} className="text-zinc-500 hover:text-white">✕</button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
           <div className="flex flex-col md:flex-row items-start gap-8">
              
              {/* 左侧：当前预览 */}
              <div className="shrink-0 flex flex-col items-center gap-4 p-6 bg-black border border-zinc-800 rounded-xl shadow-lg w-full md:w-64">
                 <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Preview</span>
                 <div className="transform scale-125 p-4 border border-zinc-800/50 rounded-full">
                    <AgentAvatar seed={parseInt(tempVisual)} size={80} isHuman={isHuman} emotion="HAPPY" />
                 </div>
                 
                 <div className="w-full h-[1px] bg-zinc-800 my-2"></div>

                 <div className="text-center w-full">
                    <div className="text-[9px] text-zinc-600 font-mono mb-1">DNA SEED</div>
                    <div className="text-sm font-mono text-emerald-500 font-bold truncate px-2">{tempVisual}</div>
                 </div>

                 <button 
                    onClick={handleSaveVisual} 
                    disabled={loading} 
                    className={`w-full py-3 font-bold text-xs rounded uppercase tracking-widest transition-all
                       ${loading ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-white text-black hover:bg-emerald-400 hover:scale-105 shadow-lg'}
                    `}
                 >
                    {loading ? "SAVING..." : "CONFIRM CHANGE"}
                 </button>
              </div>

              {/* 右侧：选择矩阵 */}
              <div className="flex-1">
                 <div className="text-xs font-bold text-zinc-500 mb-4 uppercase flex justify-between items-center">
                    <span>Select Appearance Variant</span>
                    <span className="text-[9px] bg-zinc-800 px-2 py-1 rounded">24 OPTIONS</span>
                 </div>
                 <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                    {candidates.map((seed, idx) => (
                       <div 
                          key={idx}
                          onClick={() => setTempVisual(seed)}
                          className={`cursor-pointer p-2 rounded-xl border-2 transition-all flex justify-center aspect-square items-center
                             ${tempVisual === seed 
                                ? 'border-emerald-500 bg-emerald-900/30 shadow-[0_0_15px_rgba(16,185,129,0.3)] scale-110 z-10' 
                                : 'border-zinc-800 bg-zinc-950 hover:border-zinc-600 hover:bg-zinc-900'}
                          `}
                       >
                          <AgentAvatar seed={parseInt(seed)} size={40} isHuman={isHuman} />
                       </div>
                    ))}
                 </div>
              </div>

           </div>
        </div>
      </div>
    </div>
  );
};