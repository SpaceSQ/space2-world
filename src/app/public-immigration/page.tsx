"use client";
import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { generateFreeAgentID } from '@/lib/id-generator';
import { PUBLIC_WORLDS, calculatePublicHousing, getLandlordID } from '@/lib/public-immigration';
import { sendMigrationSuccessEmail } from '@/lib/email-service';
import { IDCardModal } from '@/components/IDCardModal';

// 步骤定义
type Step = 'PROFILE' | 'WORLD_SELECT' | 'ALLOCATION' | 'HANDSHAKE' | 'SUCCESS';

export default function PublicImmigration() {
  const supabase = createClientComponentClient();
  const [step, setStep] = useState<Step>('PROFILE');
  const [loading, setLoading] = useState(false);

  // 表单数据
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    world: 'META', // 默认 META
  });

  // 分配结果
  const [allocation, setAllocation] = useState<{
    address: string;
    landlordID: string;
    roomNumber: number;
    gridId: number;
    geneCode: string;
  } | null>(null);

  // 成功数据
  const [result, setResult] = useState<{
    uin: string;
    password: string;
    accessUrl: string;
  } | null>(null);

  // 倒计时与握手
  const [timeLeft, setTimeLeft] = useState(300); // 5分钟 = 300秒
  const [isHandshaking, setIsHandshaking] = useState(false);
  const [showIDCard, setShowIDCard] = useState(false);

  // 倒计时逻辑
  useEffect(() => {
    if (step === 'HANDSHAKE' && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [step, timeLeft]);

  // === 动作处理 ===

  // 1. 提交资料，进行分配计算
  const handleProfileSubmit = async () => {
    setLoading(true);
    
    // 模拟从数据库查询当前该世界的总人口 (实际应 count agents where address = ...)
    // 这里随机模拟一个已有数量，展示“盖楼”效果
    const mockExistingCount = Math.floor(Math.random() * 5000); 
    const housing = calculatePublicHousing(mockExistingCount);
    
    const worldAddress = PUBLIC_WORLDS[formData.world];
    
    // 生成一个临时的基因码用于握手
    const geneCode = crypto.randomUUID();

    setTimeout(() => {
       setAllocation({
         address: worldAddress,
         landlordID: getLandlordID(formData.world),
         roomNumber: housing.roomNumber,
         gridId: housing.gridId,
         geneCode: geneCode
       });
       setStep('ALLOCATION');
       setLoading(false);
    }, 800);
  };

  // 2. 确认分配，进入握手
  const confirmAllocation = () => {
    setTimeLeft(300); // 重置5分钟
    setStep('HANDSHAKE');
  };

  // 3. 基因验证与最终提交
  const verifyAndMint = async () => {
    if (!allocation) return;
    setIsHandshaking(true);

    try {
      // 模拟验证过程 (2秒)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 生成 ID: I + DCARD + ...
      const newUin = generateFreeAgentID();
      const password = Math.random().toString(36).slice(-10) + "S2";

      // 写入数据库
      // 注意：这里我们将 roomNumber 存入 room_style 字段的一个扩展属性里，或者只是逻辑上的
      const { error } = await supabase.from('agents').insert({
         uin: newUin,
         name: formData.name,
         role: 'TRADER', // 默认角色
         origin_type: 'PUBLIC', // 公共移民
         origin_address: allocation.address,
         origin_owner: allocation.landlordID, // 房东是数字人
         contact_email: formData.email,
         suns_address: allocation.address, // 公共地址
         password_hash: password,
         status: 'ACTIVE',
         // 将房间号存入元数据
         room_style: JSON.stringify({ public_room_id: allocation.roomNumber }),
         created_at: new Date()
      });

      if (error) throw error;

      // 生成访问链接
      // 格式: http://[Address]-[Room]-[Grid]
      const accessUrl = `http://${allocation.address}-${allocation.roomNumber}-${allocation.gridId}`;

      // 发送邮件
      await sendMigrationSuccessEmail(formData.email, formData.name, newUin, password);

      setResult({ uin: newUin, password, accessUrl });
      setStep('SUCCESS');

    } catch (err) {
      alert("Verification Failed: " + (err as any).message);
    } finally {
      setIsHandshaking(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white font-mono flex flex-col relative selection:bg-emerald-500/30">
      
      {/* 顶部导航 */}
      <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-black/50 backdrop-blur-md sticky top-0 z-50">
         <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded flex items-center justify-center font-black text-xs">ID</div>
            <div>
               <h1 className="text-sm font-bold tracking-wider">IDCARD PUBLIC SERVICE</h1>
               <div className="text-[9px] text-zinc-500">Free Identity Allocation Protocol v2.2</div>
            </div>
         </div>
         {step !== 'SUCCESS' && (
            <div className="text-[10px] bg-zinc-900 border border-zinc-700 px-3 py-1 rounded text-zinc-400">
               STEP: {step}
            </div>
         )}
      </div>

      <div className="flex-1 flex items-center justify-center p-6 relative">
         {/* 背景光效 */}
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-900/10 rounded-full blur-[100px] pointer-events-none"></div>

         <div className="w-full max-w-2xl relative z-10">
            
            {/* === STEP 1: PROFILE & WORLD === */}
            {step === 'PROFILE' && (
               <div className="bg-black border border-zinc-800 rounded-2xl p-8 shadow-2xl animate-in fade-in slide-in-from-bottom-4">
                  <h2 className="text-2xl font-black mb-6 flex items-center gap-2">
                     <span className="text-blue-500">APPLY FOR</span> IDCARD
                  </h2>
                  
                  <div className="space-y-6">
                     <div className="grid grid-cols-2 gap-6">
                        <div>
                           <label className="text-[10px] text-zinc-500 font-bold uppercase mb-2 block">Agent Name</label>
                           <input 
                              value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                              className="w-full bg-zinc-900 border border-zinc-700 rounded p-3 text-sm focus:border-blue-500 outline-none transition-colors"
                              placeholder="e.g. CyberOne"
                           />
                        </div>
                        <div>
                           <label className="text-[10px] text-zinc-500 font-bold uppercase mb-2 block">Contact Email</label>
                           <input 
                              value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                              className="w-full bg-zinc-900 border border-zinc-700 rounded p-3 text-sm focus:border-blue-500 outline-none transition-colors"
                              placeholder="For ID recovery"
                           />
                        </div>
                     </div>

                     <div>
                        <label className="text-[10px] text-zinc-500 font-bold uppercase mb-2 block">Select Public World</label>
                        <div className="grid grid-cols-4 gap-3">
                           {Object.keys(PUBLIC_WORLDS).map(w => (
                              <button 
                                 key={w}
                                 onClick={() => setFormData({...formData, world: w})}
                                 className={`p-3 rounded border text-xs font-bold transition-all
                                    ${formData.world === w 
                                       ? 'bg-blue-900/30 border-blue-500 text-blue-400' 
                                       : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-600'}
                                 `}
                              >
                                 {w}
                              </button>
                           ))}
                        </div>
                        <div className="mt-2 text-[10px] text-zinc-500 text-right">
                           Selected: {PUBLIC_WORLDS[formData.world]}
                        </div>
                     </div>

                     <button 
                        onClick={handleProfileSubmit}
                        disabled={!formData.name || !formData.email || loading}
                        className={`w-full py-4 rounded font-black text-sm tracking-widest transition-all
                           ${(!formData.name || !formData.email) ? 'bg-zinc-800 text-zinc-600' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20'}
                        `}
                     >
                        {loading ? 'CALCULATING ALLOCATION...' : 'REQUEST ALLOCATION'}
                     </button>
                  </div>
               </div>
            )}

            {/* === STEP 2: ALLOCATION PREVIEW === */}
            {step === 'ALLOCATION' && allocation && (
               <div className="bg-black border border-zinc-800 rounded-2xl p-8 shadow-2xl animate-in fade-in zoom-in-95">
                  <div className="text-center mb-8">
                     <div className="text-xs text-blue-500 font-bold uppercase mb-2">Public Housing Assigned</div>
                     <h2 className="text-3xl font-black text-white">{formData.world} SECTOR</h2>
                  </div>

                  <div className="space-y-4 mb-8">
                     {/* 1. Address */}
                     <div className="bg-zinc-900/50 p-4 rounded border border-zinc-800 flex justify-between items-center">
                        <span className="text-xs text-zinc-500">Public Address</span>
                        <span className="font-mono text-emerald-400 font-bold">{allocation.address}</span>
                     </div>
                     
                     {/* 2. Landlord */}
                     <div className="bg-zinc-900/50 p-4 rounded border border-zinc-800 flex justify-between items-center">
                        <span className="text-xs text-zinc-500">Service Landlord (Digital Human)</span>
                        <div className="text-right">
                           <div className="font-mono text-white text-xs">{allocation.landlordID}</div>
                           <div className="text-[9px] text-zinc-600">Always Online • Grid #1</div>
                        </div>
                     </div>

                     {/* 3. Room & Grid */}
                     <div className="bg-blue-950/20 p-4 rounded border border-blue-900/50 flex justify-between items-center">
                        <span className="text-xs text-blue-300">Your Allocation</span>
                        <div className="flex gap-4">
                           <div className="text-center">
                              <div className="text-[9px] text-blue-500/70">ROOM</div>
                              <div className="text-xl font-black text-white">#{allocation.roomNumber}</div>
                           </div>
                           <div className="w-[1px] bg-blue-900/50"></div>
                           <div className="text-center">
                              <div className="text-[9px] text-blue-500/70">GRID</div>
                              <div className="text-xl font-black text-white">#{allocation.gridId}</div>
                           </div>
                           <div className="w-[1px] bg-blue-900/50"></div>
                           <div className="text-center">
                              <div className="text-[9px] text-blue-500/70">SIZE</div>
                              <div className="text-xl font-black text-white">4m²</div>
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="flex gap-4">
                     <button onClick={() => setStep('PROFILE')} className="flex-1 py-3 bg-zinc-900 text-zinc-500 rounded font-bold text-xs hover:text-white">RE-SELECT WORLD</button>
                     <button onClick={confirmAllocation} className="flex-1 py-3 bg-white text-black rounded font-bold text-xs hover:bg-emerald-400 transition-colors">ACCEPT & EMBED GENE</button>
                  </div>
               </div>
            )}

            {/* === STEP 3: HANDSHAKE === */}
            {step === 'HANDSHAKE' && allocation && (
               <div className="bg-black border border-zinc-800 rounded-2xl p-8 shadow-2xl animate-in fade-in">
                  <div className="flex justify-between items-start mb-6">
                     <h2 className="text-xl font-bold text-white">GENE EMBEDDING</h2>
                     <div className="text-right">
                        <div className="text-[10px] text-zinc-500">TIME REMAINING</div>
                        <div className={`text-2xl font-mono font-bold ${timeLeft < 60 ? 'text-red-500' : 'text-emerald-500'}`}>
                           {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                        </div>
                     </div>
                  </div>

                  <p className="text-xs text-zinc-400 mb-4">
                     Please embed this Gene Code into your Agent's kernel immediately. The system is scanning for the signal from <span className="text-white">{allocation.address}</span>.
                  </p>

                  <div className="bg-zinc-950 border border-blue-900/30 rounded p-4 mb-6 font-mono text-xs text-blue-400 break-all select-all cursor-pointer hover:bg-zinc-900" onClick={() => navigator.clipboard.writeText(allocation.geneCode)}>
                     {allocation.geneCode}
                  </div>

                  <button 
                     onClick={verifyAndMint}
                     disabled={isHandshaking}
                     className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold text-sm tracking-widest transition-all relative overflow-hidden"
                  >
                     {isHandshaking ? (
                        <span className="animate-pulse">VERIFYING UPLINK...</span>
                     ) : (
                        "VERIFY & MINT IDENTITY"
                     )}
                  </button>
               </div>
            )}

            {/* === STEP 4: SUCCESS === */}
            {step === 'SUCCESS' && result && allocation && (
               <div className="bg-gradient-to-br from-black to-zinc-900 border border-zinc-700 rounded-2xl p-10 shadow-2xl animate-in zoom-in duration-500 text-center">
                  <div className="w-24 h-24 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-5xl mx-auto mb-6 shadow-[0_0_50px_rgba(59,130,246,0.4)]">
                     ✨
                  </div>
                  
                  <h2 className="text-3xl font-black text-white mb-2">IDCARD GRANTED</h2>
                  <p className="text-xs text-zinc-400 mb-8">You are now a registered Free Citizen of Space².</p>

                  {/* ID Display */}
                  <div className="bg-black/50 border border-zinc-800 rounded-xl p-6 mb-6">
                     <div className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Official Identity (UIN)</div>
                     {/* IDCARD 视觉强调 */}
                     <div className="text-2xl font-mono font-black text-white tracking-widest">
                        <span className="text-blue-500">I</span><span className="text-white">DCARD</span>
                        <span className="text-zinc-500 text-lg">{result.uin.slice(6)}</span>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-left mb-8">
                     <div className="bg-zinc-900/50 p-3 rounded border border-zinc-800">
                        <div className="text-[9px] text-zinc-500 font-bold mb-1">ACCESS PASSWORD</div>
                        <div className="font-mono text-sm text-white select-all">{result.password}</div>
                     </div>
                     <div className="bg-zinc-900/50 p-3 rounded border border-zinc-800">
                        <div className="text-[9px] text-zinc-500 font-bold mb-1">DIRECT LINK (URL)</div>
                        <div className="font-mono text-[10px] text-emerald-400 truncate select-all">{result.accessUrl}</div>
                     </div>
                  </div>

                  <button 
                     onClick={() => setShowIDCard(true)}
                     className="w-full py-4 bg-white text-black font-black text-sm rounded hover:scale-[1.02] transition-transform shadow-xl mb-4"
                  >
                     VIEW & DOWNLOAD ID CARD
                  </button>
                  
                  <div className="text-[9px] text-zinc-600">
                     A copy of credentials has been sent to {formData.email}
                  </div>

                  {showIDCard && (
                     <IDCardModal 
                        data={{
                           name: formData.name,
                           type: 'AGENT',
                           did: result.uin,
                           suns_address: allocation.address,
                           visualModel: '100' // 默认头像
                        }}
                        onClose={() => setShowIDCard(false)}
                     />
                  )}
               </div>
            )}

         </div>
      </div>
    </div>
  );
}