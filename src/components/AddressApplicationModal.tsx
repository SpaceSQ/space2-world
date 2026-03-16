"use client";
import React, { useState, useMemo } from 'react';
import { LOGIC_ROOTS, ORIENTATION_MATRIX, generateSUNSAddress, calculateChecksum } from '@/lib/suns-v3-utils';

// ... (Imports)

export const AddressApplicationModal = ({ userUin, onClose, onSuccess }: any) => {
  // 状态管理
  const [l1, setL1] = useState('MARS'); // 默认选中一个
  const [l2, setL2] = useState('CN');   // 默认 CN [cite: 24]
  const [l3, setL3] = useState('001');  // 默认 001 [cite: 45]
  const [l4, setL4] = useState('');     // 用户输入

  // 实时计算预览
  const previewData = useMemo(() => {
    // 过滤非法字符，只允许 A-Z [cite: 49]
    const cleanL4 = l4.toUpperCase().replace(/[^A-Z]/g, '');
    
    // 计算长度 (包含连字符)
    // L1(4)+1+L2(2)+1+L3(3)+1 = 12 chars prefix [cite: 63]
    const currentLen = 12 + cleanL4.length;
    
    // 校验位预测
    const checksum = currentLen % 10; // 
    
    return {
      cleanL4,
      currentLen,
      checksum,
      isValid: cleanL4.length >= 5 && cleanL4.length <= 35 // [cite: 48]
    };
  }, [l1, l2, l3, l4]);

  const handleSubmit = async () => {
    if (!previewData.isValid) return;
    const fullAddress = generateSUNSAddress(l1, l2, l3, previewData.cleanL4);
    // ... 提交到 Supabase ...
  };

  return (
    <div className="fixed inset-0 ..."> 
      {/* ... 弹窗外壳 ... */}
      
      <div className="p-6 space-y-6">
        <div className="bg-zinc-900 p-4 rounded border border-zinc-800">
           <h3 className="text-emerald-500 font-mono mb-4 border-b border-zinc-700 pb-2">SUNS v3.0 ADDRESS GENERATOR</h3>
           
           <div className="grid grid-cols-12 gap-2 items-end font-mono text-lg">
              
              {/* L1: Logic Root */}
              <div className="col-span-3">
                 <label className="text-[9px] text-zinc-500 block mb-1">L1: ROOT</label>
                 <select value={l1} onChange={e => setL1(e.target.value)} className="w-full bg-black border border-zinc-700 rounded p-2 text-white text-xs">
                    {LOGIC_ROOTS.map(r => <option key={r.code} value={r.code}>{r.code}</option>)}
                 </select>
              </div>
              
              <div className="col-span-1 text-center text-zinc-600 pb-2">-</div>

              {/* L2: Orientation */}
              <div className="col-span-2">
                 <label className="text-[9px] text-zinc-500 block mb-1">L2: MATRIX</label>
                 <select value={l2} onChange={e => setL2(e.target.value)} className="w-full bg-black border border-zinc-700 rounded p-2 text-white text-xs">
                    {ORIENTATION_MATRIX.map(o => <option key={o.code} value={o.code}>{o.code}</option>)}
                 </select>
              </div>

              <div className="col-span-1 text-center text-zinc-600 pb-2">-</div>

              {/* L3: Grid (目前固定为 001, 未来可开放) */}
              <div className="col-span-2">
                 <label className="text-[9px] text-zinc-500 block mb-1">L3: GRID</label>
                 <input disabled value="001" className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-500 text-xs text-center" />
              </div>

              <div className="col-span-1 text-center text-zinc-600 pb-2">-</div>

              {/* L4: Sovereign Handle */}
              <div className="col-span-2 relative">
                 <label className="text-[9px] text-emerald-500 block mb-1">L4: HANDLE</label>
                 {/* 强制大写输入 */}
                 <input 
                    value={l4} 
                    onChange={e => setL4(e.target.value.toUpperCase())} 
                    placeholder="NAME"
                    maxLength={35}
                    className="w-full bg-black border border-emerald-900/50 focus:border-emerald-500 rounded p-2 text-white text-xs placeholder:text-zinc-700" 
                 />
                 {/* 校验位预览 (自动附加) */}
                 <div className="absolute -right-6 bottom-2 w-6 h-6 flex items-center justify-center bg-emerald-900 text-emerald-400 text-xs font-bold rounded">
                    {previewData.checksum}
                 </div>
              </div>
           </div>

           {/* 实时预览条 */}
           <div className="mt-6 p-3 bg-black rounded border border-zinc-800 flex justify-between items-center">
              <div>
                 <div className="text-[9px] text-zinc-500">FULL PREVIEW</div>
                 <div className="text-xl font-black text-white tracking-wider">
                    <span className="text-emerald-500">{l1}</span>-
                    <span className="text-blue-400">{l2}</span>-
                    <span className="text-zinc-400">001</span>-
                    <span className="text-white">{previewData.cleanL4 || '...'}</span>
                    <span className="text-yellow-500 bg-yellow-900/20 px-1 rounded ml-1">{previewData.checksum}</span>
                 </div>
              </div>
              <div className="text-right">
                 <div className="text-[9px] text-zinc-500">TOTAL LENGTH</div>
                 <div className={`text-xl font-mono ${previewData.isValid ? 'text-zinc-300' : 'text-red-500'}`}>
                    {/* 总长度 = 12 (前缀) + L4长度 + 1 (校验位) - 校验位实际上不算在N里计算，但物理长度包含它 */}
                    {/* 白皮书校验公式: N不含校验位。但物理显示长度含校验位 */}
                    {previewData.currentLen + 1} / 48
                 </div>
              </div>
           </div>
           
           {!previewData.isValid && (
              <div className="mt-2 text-[10px] text-red-500">
                 * L4 must be 5-35 characters (A-Z only).
              </div>
           )}
        </div>
        
        {/* ... Submit Button ... */}
      </div>
    </div>
  );
};