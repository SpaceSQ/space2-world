"use client";
import React, { useState, useEffect } from 'react';

interface IDGeneratorProps {
  sunsAddress: string; 
  agentName: string; // 接收名字用于预览显示
  onClose: () => void;
  onIssue: (finalDid: string) => void; 
}

export const SiliconIDGenerator = ({ sunsAddress, agentName, onClose, onIssue }: IDGeneratorProps) => {
  const [step, setStep] = useState(1);
  const [idParts, setIdParts] = useState({
    classCode: 'V', origin: 'XXXXX', date: '', morph: '20', sequence: ''
  });
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    // 1. Date
    const now = new Date();
    const dateCode = `${now.getFullYear().toString().slice(-2)}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`;

    // 2. Origin 计算 (核心修复：严格 5 位)
    let originCode = 'EARTH'; // 默认兜底
    
    if (sunsAddress) {
      const parts = sunsAddress.split('-');
      let l4Raw = '';

      // 智能判断地址版本
      if (parts[0] === 'SUNS') {
         // v2.0: SUNS - [L4] - ...
         if (parts.length >= 2) l4Raw = parts[1];
      } else {
         // v2.1: [L1] - [L2] - [L3] - [L4] - [L5]
         // L4 在索引 3
         if (parts.length >= 4) l4Raw = parts[3];
      }

      if (l4Raw) {
         // 1. 去除校验位数字 (MYHOME1 -> MYHOME)
         const handle = l4Raw.replace(/\d+$/, '').toUpperCase();
         
         // 🔥🔥🔥 致命错误修复：必须截取前 5 位！
         // 规则：取前5位，不足补0
         if (handle.length > 0) {
            originCode = handle.substring(0, 5).padEnd(5, '0');
         }
      }
    }

    setIdParts(prev => ({
      ...prev,
      date: dateCode,
      origin: originCode,
      sequence: Math.floor(Math.random() * 10000000000).toString().padStart(10, '0')
    }));
  }, [sunsAddress]);

  const handleGenerate = () => {
    setIsChecking(true);
    setTimeout(() => { setIsChecking(false); setStep(3); }, 1500); 
  };

  const finalDidString = `${idParts.classCode}-${idParts.origin}-${idParts.date}-${idParts.morph}-${idParts.sequence}`;

  return (
    <div className="fixed inset-0 z-[400] bg-black/95 flex items-center justify-center animate-in fade-in backdrop-blur-xl">
      <div className="w-full max-w-2xl bg-[#0a0a0a] border border-zinc-800 rounded-xl overflow-hidden shadow-2xl relative">
        
        {/* 背景光效 */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center relative z-10">
           <div>
              <h2 className="text-xl font-black text-white tracking-widest uppercase">
                 Silicon Identity Registry
              </h2>
              <p className="text-[10px] text-zinc-500 font-mono mt-1">
                 ISSUING AUTHORITY: SPACE2.WORLD /// CLASS-V
              </p>
           </div>
           <button onClick={onClose} className="text-zinc-600 hover:text-white transition-colors">✕</button>
        </div>

        {/* Body */}
        <div className="p-8 min-h-[400px] flex flex-col justify-center relative z-10">
           
           {/* Step 1 & 2: 配置阶段 */}
           {step < 3 && (
             <div className="space-y-8 animate-in slide-in-from-bottom-4">
                
                {/* 规则展示区 */}
                <div className="grid grid-cols-5 gap-2 text-center font-mono text-xs">
                   <div className="p-2 border border-zinc-800 rounded bg-zinc-900/50">
                      <div className="text-zinc-500 mb-1">CLASS</div>
                      <div className="text-emerald-500 font-bold text-lg">{idParts.classCode}</div>
                   </div>
                   <div className="p-2 border border-zinc-800 rounded bg-zinc-900/50">
                      <div className="text-zinc-500 mb-1">ORIGIN</div>
                      {/* 这里显示的是用于生成 ID 的 5位代码 */}
                      <div className="text-white font-bold text-lg">{idParts.origin}</div>
                   </div>
                   <div className="p-2 border border-zinc-800 rounded bg-zinc-900/50">
                      <div className="text-zinc-500 mb-1">DATE</div>
                      <div className="text-white font-bold text-lg">{idParts.date}</div>
                   </div>
                   <div className="p-2 border border-zinc-800 rounded bg-zinc-900/50">
                      <div className="text-zinc-500 mb-1">MORPH</div>
                      <div className="text-blue-500 font-bold text-lg">{idParts.morph}</div>
                   </div>
                   <div className="p-2 border border-zinc-800 rounded bg-zinc-900/50 opacity-50">
                      <div className="text-zinc-500 mb-1">SEQ</div>
                      <div className="text-zinc-600 text-[10px] mt-1">PENDING</div>
                   </div>
                </div>

                {/* 选号区 */}
                <div className="bg-zinc-900 border border-zinc-700 p-6 rounded-xl">
                   <label className="text-xs font-bold text-zinc-400 uppercase mb-3 block flex justify-between">
                      <span>Custom Sequence (10 Digits)</span>
                      <span className="text-emerald-600">Available</span>
                   </label>
                   
                   <div className="flex gap-2">
                      <input 
                        value={idParts.sequence}
                        onChange={(e) => setIdParts({...idParts, sequence: e.target.value.replace(/\D/g, '').slice(0, 10)})}
                        placeholder="0000000000"
                        className="flex-1 bg-black border border-zinc-600 rounded px-4 py-3 text-2xl font-mono text-white tracking-[0.2em] focus:border-emerald-500 outline-none text-center"
                        maxLength={10}
                      />
                      <button 
                        onClick={() => setIdParts({...idParts, sequence: Math.floor(Math.random() * 10000000000).toString().padStart(10, '0')})}
                        className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 rounded border border-zinc-600 transition-colors"
                        title="Randomize"
                      >
                         🎲
                      </button>
                   </div>
                   <p className="text-[10px] text-zinc-500 mt-2 text-center">
                      * Standard V-Class ID requires 10 digits.
                   </p>
                </div>

                <button 
                  onClick={handleGenerate}
                  disabled={isChecking}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-lg uppercase tracking-[0.2em] transition-all shadow-[0_0_20px_#10b981]"
                >
                   {isChecking ? "VERIFYING UNIQUENESS..." : "MINT IDENTITY CARD"}
                </button>
             </div>
           )}

           {/* Step 3: 发证 (ID 卡预览) */}
           {step === 3 && (
              <div className="flex flex-col items-center animate-in zoom-in duration-500">
                 <h3 className="text-zinc-400 text-xs font-mono mb-6 uppercase tracking-widest">Identity Successfully Registered</h3>
                 
                 {/* ID CARD VISUAL */}
                 <div className="relative w-[400px] h-[240px] rounded-2xl overflow-hidden border border-zinc-700/50 shadow-2xl group perspective-1000">
                    <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-black to-emerald-950/30"></div>
                    <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10"></div>
                    <div className="absolute -inset-full bg-gradient-to-r from-transparent via-white/10 to-transparent rotate-45 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>

                    <div className="absolute inset-0 p-6 flex flex-col justify-between">
                       <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                             <div className="w-8 h-8 rounded bg-emerald-500 flex items-center justify-center text-black font-black text-xs">S²</div>
                             <div className="leading-none">
                                <div className="text-[8px] text-emerald-500 font-bold tracking-widest">SILICON LIFE</div>
                                <div className="text-[10px] text-white font-bold tracking-widest">IDENTITY CARD</div>
                             </div>
                          </div>
                          <div className="text-[8px] text-zinc-500 font-mono">CLASS: V</div>
                       </div>

                       <div className="w-10 h-8 rounded border border-yellow-600/50 bg-yellow-500/10 flex items-center justify-center">
                          <div className="w-6 h-5 border border-yellow-600/50 grid grid-cols-2"></div>
                       </div>

                       {/* 中间显示生成的标准 DID (含5位Origin) */}
                       <div className="text-center">
                          <div className="text-[10px] text-zinc-500 font-mono tracking-[0.5em] mb-1">DIGITAL ID NUMBER</div>
                          <div className="text-xl font-mono font-black text-white tracking-widest text-shadow-glow break-all">
                             {finalDidString}
                          </div>
                       </div>

                       <div className="flex justify-between items-end">
                          <div className="text-[8px] text-zinc-500">
                             {/* 左下角显示技术细节：ORIGIN 代码 */}
                             <div>ORIGIN: {idParts.origin}</div>
                             <div>ISSUE: {idParts.date}</div>
                          </div>
                          <div className="text-[8px] text-zinc-500 font-mono text-right">
                             {/* 🔥 右下角显示真实名字 (Name) */}
                             <span className="text-zinc-500">NAME</span><br/>
                             <span className="text-white font-bold text-sm">{agentName}</span>
                          </div>
                       </div>
                    </div>
                 </div>

                 <button 
                   onClick={() => onIssue(finalDidString)}
                   className="mt-8 px-8 py-3 bg-white text-black font-bold rounded hover:bg-zinc-200 transition-colors uppercase tracking-widest text-xs"
                 >
                    Confirm & Bind to Agent
                 </button>
              </div>
           )}
        </div>
      </div>
    </div>
  );
};