"use client";
import React, { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface CitizenNameModalProps {
  currentName: string;
  userUin: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const CitizenNameModal = ({ currentName, userUin, onClose, onSuccess }: CitizenNameModalProps) => {
  const supabase = createClientComponentClient();
  const [newName, setNewName] = useState(currentName);
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    if (!newName.trim()) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('citizens')
        .update({ name: newName })
        .eq('uin', userUin);
      
      if (error) throw error;
      onSuccess();
    } catch (err) {
      alert("Failed to update name.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[600] bg-black/90 flex items-center justify-center animate-in fade-in backdrop-blur-md">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl p-6">
        <h2 className="text-lg font-black text-white mb-4 uppercase flex items-center gap-2">
           <span>👤</span> Update Citizen Name
        </h2>
        
        <div className="space-y-4">
           <div>
              <label className="text-xs font-bold text-zinc-400 uppercase mb-2 block">
                 Real Name / Alias
              </label>
              <input 
                value={newName}
                onChange={e => setNewName(e.target.value)}
                className="w-full bg-black border border-zinc-700 rounded p-3 text-white focus:border-emerald-500 outline-none text-lg"
                placeholder="e.g. Jack Ma, 李雷, 太郎..."
              />
              {/* 🔥 数字人多语言提示 */}
              <div className="mt-2 p-3 bg-zinc-950 rounded border border-zinc-800">
                 <p className="text-[10px] text-emerald-500 font-bold mb-1">
                    🌐 Multi-language Support Active
                 </p>
                 <p className="text-[10px] text-zinc-500 leading-relaxed">
                    You can use your native language name here (e.g. <strong>中文, 한국어, 日本語, English</strong>). 
                    This name will be displayed on your ID Card and public profile.
                 </p>
              </div>
           </div>
        </div>

        <div className="flex gap-3 mt-6">
           <button onClick={onClose} className="flex-1 py-3 text-zinc-500 text-xs font-bold hover:text-white border border-transparent hover:border-zinc-700 rounded">CANCEL</button>
           <button onClick={handleUpdate} disabled={loading} className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-xs uppercase tracking-widest">
              {loading ? "UPDATING..." : "CONFIRM"}
           </button>
        </div>
      </div>
    </div>
  );
};