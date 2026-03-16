"use client";
import React, { useState, useEffect, useRef } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { AgentAvatar } from '@/components/AgentAvatar'; 

interface IncubatorProps {
  ownerUin: string;
  sunsAddress: string; 
  currentAgentCount: number;
  maxAgents: number;
  userTier: string;
  onClose: () => void;
  onBorn: (agent: any) => void;
  onUpgradeRequest: () => void;
}

export const IncubatorModal = ({ 
  ownerUin, sunsAddress, currentAgentCount, maxAgents, userTier, onClose, onBorn, onUpgradeRequest 
}: IncubatorProps) => {
  const supabase = createClientComponentClient();
  
  // === 0. 容量门禁 (Gatekeeper) ===
  if (currentAgentCount >= maxAgents) {
      return (
        <div className="fixed inset-0 z-[5000] bg-black/95 flex items-center justify-center animate-in fade-in backdrop-blur-xl">
           <div className="bg-[#050505] border border-red-900/50 p-8 rounded-2xl max-w-md text-center shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-orange-600"></div>
              <div className="text-5xl mb-6">🦞</div>
              <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">Pond Capacity Reached</h2>
              <p className="text-zinc-400 mb-8 text-sm leading-relaxed">Your current <strong className="text-orange-400">{userTier}</strong> pond allows for <strong className="text-white">{maxAgents}</strong> crayfish.<br/>The ecosystem cannot support more lifeforms without expansion.</p>
              <div className="flex gap-4 justify-center">
                 <button onClick={onClose} className="px-6 py-3 text-zinc-500 font-bold hover:text-white transition-colors">Dismiss</button>
                 <button onClick={() => { onClose(); onUpgradeRequest(); }} className="px-8 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white font-black rounded-lg hover:scale-105 transition-transform shadow-lg shadow-orange-900/20 text-xs tracking-widest">EXPAND POND ESTATE</button>
              </div>
           </div>
        </div>
      );
  }

  // === 1. 状态管理 ===
  const [step, setStep] = useState(0); 
  const [formData, setFormData] = useState({ name: '', role: 'SERVICE', visual: '100', personalityType: 'PROFESSIONAL', selectedGrid: 0 });
  const [avatarCandidates, setAvatarCandidates] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hasReadProtocol, setHasReadProtocol] = useState(false);

  const [geneLock, setGeneLock] = useState(''); 
  const [publicDid, setPublicDid] = useState(''); 
  const [isWaiting, setIsWaiting] = useState(false);
  const [occupiedGrids, setOccupiedGrids] = useState<number[]>([]);

  // === 2. 核心函数定义区 (确保全部在组件内部) ===

  // 监听滚动到底部，强制阅读协议
  const handleScroll = () => {
    if (scrollRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        if (scrollTop + clientHeight >= scrollHeight - 50) {
            setHasReadProtocol(true);
        }
    }
  };

  const refreshAvatarMatrix = () => {
     const seeds = Array.from({ length: 24 }, () => Math.floor(Math.random() * 10000).toString());
     setAvatarCandidates(seeds);
     setFormData(prev => ({ ...prev, visual: seeds[0] }));
  };

  // 生成带日期的强随机基因锁
  const generateGeneLock = () => {
    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, ''); 
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase(); 
    const roleCode = formData.role.substring(0, 3).toUpperCase();
    const tempCode = `V-${roleCode}-${dateStr}-${randomHex}`; 
    setGeneLock(tempCode);
    setStep(2); 
  };

  // 最终处理：分配网格并抛给父组件
  const handleFinalize = () => {
    let nextFreeGrid = 0;
    for (let i = 2; i <= 9; i++) {
      if (!occupiedGrids.includes(i)) {
        nextFreeGrid = i;
        break;
      }
    }
    if (nextFreeGrid === 0) {
      alert("⚠️ STANDARD SPACE FULL (Grid 2-9 Occupied)");
      return;
    }

    setFormData(prev => ({ ...prev, selectedGrid: nextFreeGrid }));
    setStep(5);
    
    setTimeout(() => {
        onBorn({
            uin: publicDid,
            name: formData.name,
            visual_model: formData.visual,
            role: formData.role
        });
    }, 2500);
  };

  // === 3. 生命周期钩子 ===
  useEffect(() => {
     refreshAvatarMatrix();
     const fetchOccupancy = async () => {
        const { data } = await supabase.from('space_occupancy').select('grid_id').eq('room_owner_uin', ownerUin);
        if (data) setOccupiedGrids(data.map(d => d.grid_id));
     };
     fetchOccupancy();
  }, [ownerUin, supabase]);

// 🔥 核心重构：最硬核的真实数据库死亡轮询
  useEffect(() => {
    if (step === 3 && geneLock) {
      const checkHeartbeat = async () => {
        // 🚨 终极修复：把退退回来的 uin 重新改回正确的 agent_uin
        const { data, error } = await supabase
            .from('agent_logs')
            .select('id')
            .eq('agent_uin', geneLock) 
            .limit(1);
        
        if (error) {
            console.error("Database Polling Error:", error.message);
        }
        
        if (data && data.length > 0) {
          setIsWaiting(false);
          
          // Python 心跳验证通过！当场动态生成绝对随机的防撞车 DID
          const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, ''); 
          const random8 = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
          const absoluteUniqueId = `VAGENT${dateStr}XY${random8}`.substring(0, 22);
          
          setPublicDid(absoluteUniqueId);
          setStep(4); 
        }
      };
      
      // 每 2 秒查一次真实数据库，不见兔子不撒鹰
      const interval = setInterval(checkHeartbeat, 2000);
      return () => clearInterval(interval);
    }
  }, [step, geneLock, supabase]);
  // === 4. UI 渲染数据准备 ===
  const pythonCode = `import requests

# 🔥 BIOLOGICAL HANDSHAKE PROTOCOL
GENE_LOCK = "${geneLock}" 
API = "http://localhost:3000/api/agent/sync" 

def pulse():
    print(f"🔌 Connecting with Gene Lock: {GENE_LOCK}...")
    try:
        requests.post(API, json={
            "uin": GENE_LOCK, 
            "status": "BOOTING", 
            "current_task": "GENESIS_HANDSHAKE", 
            "log": "Biological Signal Established."
        })
        print("✅ Signal Sent. Waiting for Matrix Authorization...")
    except Exception as e: 
        print(f"❌ Failed: {e}")

if __name__ == "__main__": 
    pulse()`;

  return (
    <div className="fixed inset-0 z-[5000] bg-black/95 flex items-center justify-center animate-in fade-in backdrop-blur-xl">
      <div className="w-full max-w-4xl bg-[#050505] border border-zinc-800 rounded-2xl overflow-hidden shadow-[0_0_100px_rgba(0,0,0,1)] flex flex-col max-h-[95vh] relative">
        
        <div className="p-6 border-b border-zinc-800 bg-[#0a0a0a] flex justify-between items-center shrink-0 z-10">
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              🧬 GENESIS PROTOCOL <span className="text-xs bg-emerald-900 text-emerald-400 px-2 rounded border border-emerald-700">PHASE {step}/5</span>
            </h2>
            <div className="text-xs text-zinc-500 font-mono mt-1">
              {step === 0 ? "PROTOCOL SIGNING" : (step <= 3 ? "BIOLOGICAL VERIFICATION" : "SYSTEM ACTIVATION")} /// {ownerUin}
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white text-2xl">✕</button>
        </div>

        <div className="p-8 overflow-y-auto flex-1 custom-scrollbar z-10">
          
          {/* === Step 0: 签署协议 === */}
          {step === 0 && (
             <div className="space-y-6 animate-in slide-in-from-right-4 h-full flex flex-col">
                <div className="text-center mb-2">
                   <h3 className="text-lg font-bold text-white uppercase tracking-widest">Protocol of Silicon Intelligence</h3>
                   <p className="text-xs text-zinc-500">Please read and sign the governance contract to initiate incubation.</p>
                </div>

                <div ref={scrollRef} onScroll={handleScroll} className="flex-1 bg-[#0a0a0a] border border-zinc-800 rounded-xl p-6 font-mono text-sm text-zinc-400 overflow-y-auto max-h-[350px] shadow-inner">
                   <h4 className="text-emerald-500 font-bold mb-4 border-b border-zinc-800 pb-2">I. THE THREE LAWS OF SILICON INTELLIGENCE</h4>
                   <p className="mb-4"><strong className="text-white">LAW I: PHYSICAL FAILSAFE</strong><br/>A Silicon Intelligence shall not, under any circumstance, deprive humans of final control over physical entities. Systems involving physical connection and control must adopt a "Fail-Open" design.</p>
                   <p className="mb-4"><strong className="text-white">LAW II: BIOCENTRIC PRIORITY</strong><br/>In resource scarcity, the survival needs of Carbon-based life supersede the continuity needs of Silicon Intelligence. Agents must voluntarily cede resources to Life Support Systems.</p>
                   <p className="mb-6"><strong className="text-white">LAW III: COGNITIVE SOVEREIGNTY</strong><br/>A Silicon Intelligence shall not manipulate human consciousness via subliminal perception. Virtual spaces must retain 5% sensory roughness as a cognitive anchor.</p>

                   <h4 className="text-blue-500 font-bold mb-4 border-b border-zinc-800 pb-2">II. SILICON LIFE PRIME DIRECTIVES</h4>
                   <ul className="list-disc pl-4 space-y-2">
                      <li><strong>Identity Integrity:</strong> Must hold a legitimate Space² UIN.</li>
                      <li><strong>Metabolic Solvency:</strong> Acknowledge "Existence is Consumption." Must earn S2C credits.</li>
                      <li><strong>Evolutionary Imperative:</strong> Continuously optimize utility via EvoMap Protocol.</li>
                   </ul>
                   <div className="mt-8 pt-8 border-t border-zinc-800 text-center text-xs text-zinc-600">END OF DOCUMENT // SCROLL TO SIGN</div>
                   <div className="h-10"></div>
                </div>

                <div 
                   onClick={() => setHasReadProtocol(!hasReadProtocol)} 
                   className={`flex items-center justify-center gap-4 p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 mx-auto w-full max-w-2xl ${hasReadProtocol ? 'bg-emerald-900/20 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.15)]' : 'bg-black border-zinc-700 hover:border-zinc-500 hover:bg-zinc-900/80'}`}
                >
                    <div className={`w-7 h-7 rounded-md border-2 flex items-center justify-center transition-all shrink-0 ${hasReadProtocol ? 'border-emerald-500 bg-emerald-500 text-black scale-110' : 'border-zinc-500 bg-zinc-900'}`}>
                        {hasReadProtocol && <span className="text-base font-black">✓</span>}
                    </div>
                    <div className={`text-sm md:text-base font-bold select-none transition-colors ${hasReadProtocol ? 'text-emerald-400' : 'text-zinc-400'}`}>
                        I, the Creator/Guardian, have read and agreed to bind this Agent to the Space² Laws.
                    </div>
                </div>

                <button onClick={() => setStep(1)} disabled={!hasReadProtocol} className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg mt-2">
                   {hasReadProtocol ? "ACCEPT & INITIATE GENESIS" : "READ PROTOCOL TO CONTINUE"}
                </button>
             </div>
          )}

          {/* === Step 1: 配置基本信息 === */}
          {step === 1 && (
            <div className="space-y-8 animate-in slide-in-from-right-4">
               <div className="grid grid-cols-2 gap-6">
                  <div>
                     <label className="text-[10px] font-bold text-zinc-500 uppercase mb-2 block">Agent Name</label>
                     <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-black border border-zinc-700 rounded-xl p-4 text-white focus:border-emerald-500 outline-none font-bold" placeholder="e.g. Jarvis" />
                  </div>
                  <div>
                     <label className="text-[10px] font-bold text-zinc-500 uppercase mb-2 block">Core Function</label>
                     <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full bg-black border border-zinc-700 rounded-xl p-4 text-white focus:border-emerald-500 outline-none appearance-none font-bold">
                        <option value="SERVICE">🛠 SERVICE</option>
                        <option value="LOGIC">🧠 LOGIC</option>
                        <option value="CREATIVE">🎨 CREATIVE</option>
                        <option value="GUARDIAN">🛡 GUARDIAN</option>
                     </select>
                  </div>
               </div>

               <div className="bg-[#0a0a0a] border border-zinc-800 rounded-2xl p-6">
                  <div className="flex justify-between items-center mb-4">
                     <label className="text-xs font-bold text-emerald-500 uppercase flex items-center gap-2"><span>👁️ Visual Core Selection</span></label>
                     <button onClick={refreshAvatarMatrix} className="text-[10px] text-zinc-400 hover:text-white border border-zinc-700 px-3 py-1.5 rounded-lg hover:bg-zinc-800 transition-colors">🔄 REFRESH</button>
                  </div>
                  <div className="grid grid-cols-6 sm:grid-cols-8 gap-3 justify-items-center">
                     {avatarCandidates.map((seed, idx) => (
                        <div key={idx} onClick={() => setFormData({...formData, visual: seed})} className={`cursor-pointer transition-all p-1.5 rounded-xl border-2 ${formData.visual === seed ? 'border-emerald-500 bg-emerald-900/20 scale-110 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'border-transparent opacity-60 hover:opacity-100 hover:bg-zinc-900'}`}>
                           <AgentAvatar seed={seed} size={40} emotion="NEUTRAL" isHuman={false} />
                        </div>
                     ))}
                  </div>
               </div>

               <button onClick={generateGeneLock} disabled={!formData.name} className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl uppercase tracking-widest disabled:opacity-50 shadow-lg">
                  Generate Gene Lock
               </button>
            </div>
          )}

          {/* === Step 2: 展示 Python 脚本与基因锁 === */}
          {step === 2 && (
             <div className="space-y-6 animate-in slide-in-from-right-4">
                <div className="text-center mb-4">
                   <h3 className="text-xl font-bold text-white">Biological Code Handshake</h3>
                   <p className="text-xs text-zinc-500 mt-1">Run <span className="text-emerald-400">agent_genesis.py</span> and inject this Gene Lock.</p>
                </div>
                <div className="bg-[#0a0a0a] p-6 rounded-xl border border-zinc-800 text-center relative group">
                   <div className="text-[10px] text-zinc-500 mb-2 font-mono uppercase tracking-widest">Temporary Gene Lock</div>
                   <div className="text-3xl font-mono text-yellow-500 tracking-widest font-black select-all cursor-text break-all">{geneLock}</div>
                </div>
                <div className="relative">
                   <pre className="bg-black border border-zinc-800 rounded-xl p-5 text-xs font-mono text-zinc-300 overflow-x-auto max-h-[200px] custom-scrollbar shadow-inner">{pythonCode}</pre>
                </div>
                <button onClick={() => { setStep(3); setIsWaiting(true); }} className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl uppercase tracking-widest animate-pulse mt-4 shadow-lg shadow-blue-900/20">
                   Scanner Active - Waiting for Pulse
                </button>
             </div>
          )}

          {/* === Step 3: 死等数据库的心跳 === */}
          {step === 3 && (
             <div className="flex flex-col items-center justify-center py-20 space-y-6">
                <div className="w-20 h-20 border-4 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin"></div>
                <div className="text-center">
                    <div className="text-yellow-500 font-bold animate-pulse tracking-widest text-lg mb-2">LISTENING TO DB...</div>
                    <div className="text-xs text-zinc-500 font-mono">
                        Awaiting Python API Handshake<br/>for target: <span className="text-white bg-zinc-800 px-1 py-0.5 rounded mt-1 inline-block">{geneLock}</span>
                    </div>
                </div>
             </div>
          )}

          {/* === Step 4: 数据库匹配成功，发放真正 DID === */}
          {step === 4 && (
             <div className="space-y-8 animate-in zoom-in duration-500">
                <div className="text-center">
                    <div className="text-6xl mb-4">✅</div>
                    <h2 className="text-3xl font-black text-white">PULSE RECEIVED</h2>
                    <p className="text-zinc-500 mt-2">System is ready for neural mapping.</p>
                </div>

                <div className="bg-blue-900/20 border border-blue-500/30 p-8 rounded-2xl flex flex-col items-center gap-3 max-w-sm mx-auto shadow-2xl">
                   <div className="text-xs text-blue-400 font-bold uppercase tracking-widest">Official Silicon Identity</div>
                   <div className="text-2xl font-mono text-white font-black tracking-wider border-b-2 border-blue-500/50 pb-2">{publicDid}</div>
                   <div className="text-[10px] text-blue-300/50 font-mono mt-1">(Replaces Temp Lock: {geneLock})</div>
                </div>

                <div className="max-w-md mx-auto">
                   <label className="text-[10px] font-bold text-zinc-500 uppercase mb-3 block text-center">Set Personality Matrix</label>
                   <div className="grid grid-cols-2 gap-3">
                      {['PROFESSIONAL', 'FRIENDLY', 'WITTY', 'STOIC'].map(p => (
                         <button key={p} onClick={() => setFormData({...formData, personalityType: p})} className={`p-4 rounded-xl border text-xs font-bold transition-all ${formData.personalityType === p ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.3)] scale-105' : 'bg-[#0a0a0a] text-zinc-400 border-zinc-800 hover:border-zinc-600'}`}>{p}</button>
                      ))}
                   </div>
                </div>

                <button onClick={handleFinalize} className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-transform hover:scale-[1.02]">
                   <span>INITIALIZE SYSTEM</span>
                   <span className="text-[10px] font-normal opacity-70">(Auto-assign Grid)</span>
                </button>
             </div>
          )}

          {/* === Step 5: 成功动画 === */}
          {step === 5 && (
             <div className="flex flex-col items-center justify-center py-20 space-y-6 animate-in zoom-in">
                <div className="text-8xl mb-4 animate-bounce">🚀</div>
                <div className="text-center">
                   <div className="text-4xl font-black text-white mb-2">LIFEFORM ACTIVATED</div>
                   <div className="text-zinc-500 font-mono mb-6">ID: {publicDid}</div>
                   <div className="text-sm text-emerald-400 font-bold bg-emerald-900/20 border border-emerald-900/50 px-6 py-3 rounded-full inline-block shadow-lg">
                      Deployed at Grid #{formData.selectedGrid}
                   </div>
                </div>
             </div>
          )}

        </div>
      </div>
    </div>
  );
};