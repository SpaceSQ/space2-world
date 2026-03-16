"use client";
import React, { useState, useEffect } from 'react';

// === 12套 AGI 空间预设库 ===
const ROOM_PRESETS = [
  // --- 科幻/赛博组 ---
  { id: 'scifi_quantum', label: 'Quantum Command', style: 'SCI-FI', vibe: 'Stoic', 
    desc: 'Pure data stream environment. Zero gravity suspension chair.',
    css: 'bg-slate-950 border-cyan-500 shadow-[0_0_30px_rgba(6,182,212,0.3)]',
    gradient: 'from-slate-900 via-cyan-900/20 to-slate-900',
    icon: '💠' },
  { id: 'punk_cyber', label: 'Neon Glitch', style: 'PUNK', vibe: 'Witty', 
    desc: 'High-contrast neon lights with exposed circuitry walls.',
    css: 'bg-zinc-900 border-pink-500 shadow-[0_0_30px_rgba(236,72,153,0.3)]',
    gradient: 'from-purple-900/40 via-black to-pink-900/40',
    icon: '⚡' },
  { id: 'esport_rgb', label: 'Pro Gamer Grid', style: 'E-SPORTS', vibe: 'Competitive', 
    desc: 'Soundproof panels, RGB fluid cooling system, triple monitors.',
    css: 'bg-black border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.3)]',
    gradient: 'from-black via-green-900/20 to-black',
    icon: '🎮' },

  // --- 东方美学组 ---
  { id: 'jp_zen', label: 'Kyoto Capsule', style: 'JAPANESE', vibe: 'Peaceful', 
    desc: 'Tatami floor, shoji screen projection, bonsai algorithm.',
    css: 'bg-stone-900 border-stone-400 shadow-[0_0_30px_rgba(168,162,158,0.2)]',
    gradient: 'from-stone-950 via-stone-900 to-orange-900/10',
    icon: '🍵' },
  { id: 'cn_ink', label: 'Ink Flow', style: 'CHINESE', vibe: 'Stoic', 
    desc: 'Holographic calligraphy floating in void. Black wood finish.',
    css: 'bg-gray-950 border-zinc-500 shadow-[0_0_30px_rgba(255,255,255,0.1)]',
    gradient: 'from-black via-zinc-900 to-gray-900',
    icon: '✒️' },

  // --- 西方/现代组 ---
  { id: 'us_loft', label: 'Brooklyn Node', style: 'AMERICAN', vibe: 'Friendly', 
    desc: 'Exposed brick texture, warm tungsten lighting, leather seat.',
    css: 'bg-[#1a1510] border-orange-700 shadow-[0_0_30px_rgba(194,65,12,0.2)]',
    gradient: 'from-orange-950/30 via-black to-black',
    icon: '🧱' },
  { id: 'eu_bauhaus', label: 'Bauhaus Cube', style: 'EUROPEAN', vibe: 'Professional', 
    desc: 'Form follows function. Steel, glass, and geometric harmony.',
    css: 'bg-zinc-900 border-white/50 shadow-[0_0_30px_rgba(255,255,255,0.1)]',
    gradient: 'from-zinc-800 via-zinc-900 to-black',
    icon: '📐' },
  { id: 'modern_min', label: 'Nordic White', style: 'MINIMAL', vibe: 'Clean', 
    desc: 'Absolute white space. Soft diffused light. Zero clutter.',
    css: 'bg-zinc-800 border-zinc-300 shadow-[0_0_30px_rgba(255,255,255,0.2)]',
    gradient: 'from-zinc-700 via-zinc-900 to-black',
    icon: '❄️' },

  // --- 趣味/异类组 ---
  { id: 'cartoon_pixel', label: '8-Bit Haven', style: 'CARTOON', vibe: 'Playful', 
    desc: 'Voxel furniture, pastel skybox, retro game console sounds.',
    css: 'bg-indigo-950 border-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.3)]',
    gradient: 'from-indigo-900 via-purple-900 to-pink-900',
    icon: '👾' },
  { id: 'punk_steam', label: 'Brass Gear', style: 'STEAMPUNK', vibe: 'Creative', 
    desc: 'Copper pipes, analog pressure gauges, warm steam vents.',
    css: 'bg-[#1c1005] border-amber-600 shadow-[0_0_30px_rgba(217,119,6,0.3)]',
    gradient: 'from-amber-950/50 via-black to-black',
    icon: '⚙️' },
  { id: 'scifi_bio', label: 'Bio-Lab', style: 'BIOPUNK', vibe: 'Organic', 
    desc: 'Living plant walls, hydroponic air filters, soft green glow.',
    css: 'bg-[#051c05] border-emerald-600 shadow-[0_0_30px_rgba(16,185,129,0.2)]',
    gradient: 'from-emerald-950/50 via-black to-black',
    icon: '🌿' },
  { id: 'vip_gold', label: 'The Vault', style: 'LUXURY', vibe: 'Wealthy', 
    desc: 'Black marble, gold trim, floating digital asset display.',
    css: 'bg-black border-yellow-600 shadow-[0_0_30px_rgba(202,138,4,0.4)]',
    gradient: 'from-yellow-900/20 via-black to-black',
    icon: '🏆' },
];

interface AGIRoomGeneratorProps {
  onConfirm: (roomData: any) => void;
}

export const AGIRoomGenerator = ({ onConfirm }: AGIRoomGeneratorProps) => {
  const [selectedId, setSelectedId] = useState(ROOM_PRESETS[0].id);
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  const currentPreset = ROOM_PRESETS.find(p => p.id === selectedId) || ROOM_PRESETS[0];

  const handleSelect = (id: string) => {
    setIsSynthesizing(true);
    setSelectedId(id);
    // 模拟 AGI 生成的延迟感
    setTimeout(() => setIsSynthesizing(false), 600);
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4">
      
      {/* 顶部标题 */}
      <div className="text-center mb-6">
         <h3 className="text-xl font-black text-white uppercase tracking-[0.2em]">
            Spatial Materialization
         </h3>
         <p className="text-[10px] text-zinc-500 font-mono mt-1">
            AGI ARCHITECT ENGINE V2.1 /// SELECT STANDARD UNIT (4M²)
         </p>
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-6 min-h-0">
         
         {/* 左侧：列表选择 (垂直滚动) */}
         <div className="w-full md:w-1/3 bg-zinc-950/50 border border-zinc-800 rounded-xl overflow-y-auto max-h-[400px] p-2 custom-scrollbar">
            <div className="grid grid-cols-1 gap-2">
               {ROOM_PRESETS.map(preset => (
                  <button
                    key={preset.id}
                    onClick={() => handleSelect(preset.id)}
                    className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all group
                       ${selectedId === preset.id 
                          ? 'bg-zinc-800 border-white text-white shadow-lg' 
                          : 'bg-black border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300'}
                    `}
                  >
                     <span className="text-xl group-hover:scale-110 transition-transform">{preset.icon}</span>
                     <div>
                        <div className="text-xs font-bold uppercase tracking-wider">{preset.label}</div>
                        <div className="text-[9px] opacity-60 font-mono">{preset.style}</div>
                     </div>
                  </button>
               ))}
            </div>
         </div>

         {/* 右侧：3D 预览舱 */}
         <div className="flex-1 flex flex-col">
            <div className={`relative flex-1 rounded-xl border-2 overflow-hidden transition-all duration-500 flex flex-col items-center justify-center p-8
               ${currentPreset.css}
            `}>
               {/* 背景光效 */}
               <div className={`absolute inset-0 bg-gradient-to-b ${currentPreset.gradient} opacity-80`}></div>
               <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10"></div>
               
               {/* 扫描线动画 (生成时出现) */}
               {isSynthesizing && (
                  <div className="absolute inset-0 z-20 bg-black/50 backdrop-blur-[2px] flex items-center justify-center">
                     <div className="w-full h-1 bg-emerald-500 shadow-[0_0_20px_#10b981] animate-[scan_1s_ease-in-out_infinite]"></div>
                     <div className="absolute text-emerald-500 font-mono text-xs font-bold tracking-widest animate-pulse">
                        SYNTHESIZING...
                     </div>
                  </div>
               )}

               {/* 模拟 4m² 空间透视 */}
               <div className="relative z-10 w-48 h-48 border border-white/20 perspective-1000 group-hover:scale-105 transition-transform">
                  {/* 后墙 */}
                  <div className="absolute inset-4 border border-white/10 bg-white/5"></div>
                  {/* 地板网格 */}
                  <div className="absolute bottom-0 w-full h-1/2 bg-gradient-to-t from-white/5 to-transparent transform skew-x-12 opacity-30"></div>
                  
                  {/* 中央家具示意图 (用 Emoji 代替 3D 模型) */}
                  <div className="absolute inset-0 flex items-center justify-center text-6xl drop-shadow-2xl animate-in zoom-in duration-700">
                     {currentPreset.icon}
                  </div>
               </div>

               {/* 文字描述 */}
               <div className="relative z-10 mt-8 text-center max-w-xs">
                  <h4 className="text-lg font-bold text-white mb-2">{currentPreset.label}</h4>
                  <p className="text-xs text-zinc-300 font-mono leading-relaxed">
                     "{currentPreset.desc}"
                  </p>
                  <div className="mt-3 flex justify-center gap-2">
                     <span className="px-2 py-1 bg-black/50 border border-white/10 rounded text-[9px] text-zinc-400 uppercase">
                        STYLE: {currentPreset.style}
                     </span>
                     <span className="px-2 py-1 bg-black/50 border border-white/10 rounded text-[9px] text-zinc-400 uppercase">
                        VIBE: {currentPreset.vibe}
                     </span>
                  </div>
               </div>

            </div>

            {/* 确认按钮 */}
            <button 
               onClick={() => onConfirm(currentPreset)}
               className="mt-6 w-full py-4 bg-white hover:bg-zinc-200 text-black font-black rounded-lg uppercase tracking-[0.2em] transition-all shadow-lg"
            >
               Deploy Interior
            </button>
         </div>

      </div>
    </div>
  );
};