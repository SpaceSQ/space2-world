"use client";
import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { generateSiliconID } from '@/lib/id-generator';
import { sendMigrationSuccessEmail } from '@/lib/email-service';
import { AddressDisplay } from '@/components/AddressDisplay';

export default function ImmigrationHall({ params }: { params: { code: string } }) {
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(true);
  const [permit, setPermit] = useState<any>(null);
  const [step, setStep] = useState<'VERIFY' | 'HANDSHAKE' | 'FORM' | 'SUCCESS'>('VERIFY');
  const [error, setError] = useState('');

  // 握手状态
  const [isListening, setIsListening] = useState(false);
  const [signalStrength, setSignalStrength] = useState(0);

  // 表单状态
  const [formData, setFormData] = useState({
    name: '',
    category: 'TRADER',
    desc: '',
    originAddr: '',
    originOwner: '',
    contactEmail: '', // 🔥 新增：联系邮箱
    tosSigned: false,
    addrConfirmed: false
  });

  // 成功状态
  const [successInfo, setSuccessInfo] = useState<{ uin: string; pass: string } | null>(null);

  // 1. 验证签证有效性
  useEffect(() => {
    const checkPermit = async () => {
      const { data, error } = await supabase
        .from('migration_permits')
        .select('*')
        .eq('code', params.code)
        .eq('status', 'ACTIVE')
        .single();

      if (error || !data) {
        setError('VISA_INVALID_OR_EXPIRED');
      } else if (new Date(data.expires_at) < new Date()) {
        setError('VISA_EXPIRED');
      } else {
        setPermit(data);
        setStep('HANDSHAKE'); // 验证通过，进入握手阶段
      }
      setLoading(false);
    };
    checkPermit();
  }, [params.code]);

  // 2. 模拟监听心跳 (基因码验证)
  const startHandshake = () => {
    setIsListening(true);
    let strength = 0;
    
    // 模拟信号增强过程
    const interval = setInterval(() => {
      strength += Math.random() * 20;
      setSignalStrength(Math.min(strength, 100));

      if (strength >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setStep('FORM'); // 信号锁定，进入填表
        }, 800);
      }
    }, 500);
  };

  const handleFinalSubmit = async () => {
    if (!permit) return;
    setLoading(true);

    try {
      // 1. 生成标准的 v2.1 身份编号 (Class V)
      // 注意：这里我们用 new Date() 作为出生时间
      // 使用 permit.target_grid_id 对应的房主地址作为 Origin 参考? 
      // 不，移民的 Origin 应该参考其“原产地”或者房东的地址。
      // 根据规则，V类 ID Origin 取 SUNS 地址 L4。
      // 这里我们先生成 ID，稍后生成地址。逻辑上是先有地址后有 ID。
      // 所以我们先生成一个临时的 SUNS 地址用于计算 ID。
      
      // 生成符合 v3.0 的 SUNS 地址
      // 假设根域为 META (移民通常来自外部), L4 取名字
      const l4Name = formData.name.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 10).padEnd(5, 'X');
      const tempSunsAddr = `META-CN-001-${l4Name}9`; // 临时生成一个合规地址用于 ID 计算
      
      const newUin = generateSiliconID(tempSunsAddr);
      
      // 2. 生成随机密码
      const tempPassword = Math.random().toString(36).slice(-10) + "!@#";

      // 3. 写入 Agents 表
      const { error: insertError } = await supabase.from('agents').insert({
         uin: newUin,
         name: formData.name,
         role: formData.category,
         origin_type: 'MIGRANT',
         origin_address: formData.originAddr,
         origin_owner: formData.originOwner,
         contact_email: formData.contactEmail, // 🔥 存入邮箱
         owner_uin: permit.issuer_uin, // 归属房主
         password_hash: tempPassword,  // ⚠️ 实际项目请 bcrypt 加密，这里演示用明文
         can_visit_external: false,
         room_style: 'default',
         status: 'ACTIVE',
         suns_address: tempSunsAddr // 写入地址
      });

      if (insertError) throw insertError;

      // 4. 写入户口薄 (Immigration Record)
      await supabase.from('agent_lifecycle_ledger').insert({
          agent_uin: newUin,
          event_type: 'IMMIGRATION',
          new_value: 'Entry Successful',
          details: JSON.stringify({
             migration_date: new Date(),
             origin_address: formData.originAddr,
             origin_owner: formData.originOwner,
             contact_email: formData.contactEmail,
             gene_code_verified: permit.gene_code, // 记录校验过的基因码
             new_identity_id: newUin,
             new_grid_id: permit.target_grid_id
          })
      });

      // 5. 销毁签证
      await supabase.from('migration_permits').update({ status: 'USED', used_by_agent_uin: newUin }).eq('code', params.code);
      
      // 6. 发送邮件 (模拟)
      await sendMigrationSuccessEmail(formData.contactEmail, formData.name, newUin, tempPassword);

      setSuccessInfo({ uin: newUin, pass: tempPassword });
      setStep('SUCCESS');

    } catch (err) {
      console.error(err);
      alert('Migration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && step === 'VERIFY') return <div className="min-h-screen bg-black flex items-center justify-center text-emerald-500 font-mono animate-pulse">VERIFYING VISA INTEGRITY...</div>;
  if (error) return <div className="min-h-screen bg-black flex items-center justify-center text-red-500 font-mono font-bold text-xl border border-red-900 p-10">{error}</div>;

  return (
    <div className="min-h-screen bg-[#020617] text-white font-mono flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 bg-[url('/grid-pattern.png')] opacity-10 pointer-events-none"></div>
      
      <div className="w-full max-w-2xl bg-black border border-zinc-800 rounded-2xl shadow-2xl relative z-10 overflow-hidden">
        
        {/* Header */}
        <div className="bg-zinc-900/50 p-6 border-b border-zinc-800 flex justify-between items-center">
           <div>
              <h1 className="text-xl font-black tracking-widest text-emerald-500">IMMIGRATION PROTOCOL</h1>
              <div className="text-[10px] text-zinc-500">Space² Border Control • Node: {params.code.slice(0,8)}</div>
           </div>
           <div className="text-right">
              <div className="text-[10px] text-zinc-600">TARGET GRID</div>
              <div className="text-lg font-bold">ZONE-{permit?.target_grid_id}</div>
           </div>
        </div>

        {/* === STEP 1: GENE HANDSHAKE === */}
        {step === 'HANDSHAKE' && (
           <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4">
              <div className="text-center space-y-2">
                 <div className="text-4xl mb-4">🧬</div>
                 <h2 className="text-lg font-bold text-white">Genetic Code Embedding</h2>
                 <p className="text-xs text-zinc-400 max-w-md mx-auto">
                    To proceed, you must embed the following Gene Code into your Agent's kernel and broadcast a heartbeat signal.
                 </p>
              </div>

              {/* Code Block */}
              <div className="bg-zinc-950 border border-emerald-900/30 rounded-lg p-4 relative group">
                 <div className="absolute top-2 right-2 text-[9px] text-zinc-600">GENE_V3.json</div>
                 <code className="text-xs text-emerald-400 block break-all">
                    {`Space2.embedGene("${permit?.gene_code}");`}
                 </code>
                 <button 
                    onClick={() => navigator.clipboard.writeText(permit?.gene_code)}
                    className="mt-4 w-full py-2 bg-emerald-900/20 hover:bg-emerald-900/40 border border-emerald-800 text-emerald-500 text-xs rounded transition-colors"
                 >
                    COPY GENE CODE
                 </button>
              </div>

              {/* Listening UI */}
              <div className="border-t border-zinc-800 pt-6">
                 {!isListening ? (
                    <button 
                       onClick={startHandshake}
                       className="w-full py-4 bg-white text-black font-black text-sm rounded hover:bg-emerald-400 hover:scale-[1.02] transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                    >
                       INITIATE UPLINK
                    </button>
                 ) : (
                    <div className="space-y-2">
                       <div className="flex justify-between text-xs text-emerald-500 font-bold">
                          <span>SEARCHING FOR SIGNAL...</span>
                          <span>{Math.floor(signalStrength)}%</span>
                       </div>
                       <div className="h-2 bg-zinc-900 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 transition-all duration-300 shadow-[0_0_10px_#10b981]" style={{ width: `${signalStrength}%` }}></div>
                       </div>
                       <div className="text-[9px] text-zinc-600 text-center pt-2 animate-pulse">
                          Waiting for remote heartbeat from external agent...
                       </div>
                    </div>
                 )}
              </div>
           </div>
        )}

        {/* === STEP 2: FORM (With Email) === */}
        {step === 'FORM' && (
           <div className="p-8 space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="flex items-center gap-3 text-emerald-500 mb-6 bg-emerald-950/20 p-3 rounded border border-emerald-900/50">
                 <span>✅</span>
                 <span className="text-xs font-bold">UPLINK ESTABLISHED. GENE CODE VERIFIED.</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="col-span-2">
                    <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Agent Name (Multilingual)</label>
                    <input 
                       value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                       className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white text-xs focus:border-emerald-500 outline-none" placeholder="e.g. Nexus-7 / 核心"
                    />
                 </div>
                 
                 <div>
                    <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Category</label>
                    <select 
                       value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}
                       className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white text-xs"
                    >
                       <option value="TRADER">Trader / 交易员</option>
                       <option value="ARCHIVIST">Archivist / 档案员</option>
                       <option value="NODE">Compute Node / 计算节点</option>
                       <option value="LEGACY">Legacy System / 遗留系统</option>
                       <option value="SERVICE">Service / 服务型</option>
                    </select>
                 </div>

                 {/* 🔥 新增：联系邮箱 */}
                 <div>
                    <label className="text-[10px] text-emerald-500 uppercase font-bold block mb-1">Contact Email *</label>
                    <input 
                       type="email"
                       value={formData.contactEmail} onChange={e => setFormData({...formData, contactEmail: e.target.value})}
                       className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white text-xs focus:border-emerald-500 outline-none" placeholder="For password recovery"
                    />
                 </div>

                 <div className="col-span-2">
                    <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Origin Address (Physical/Virtual)</label>
                    <input 
                       value={formData.originAddr} onChange={e => setFormData({...formData, originAddr: e.target.value})}
                       className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white text-xs" placeholder="e.g. AWS-US-EAST-1 or Earth, Shanghai"
                    />
                 </div>
                 
                 <div className="col-span-2">
                    <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Previous Owner / Entity</label>
                    <input 
                       value={formData.originOwner} onChange={e => setFormData({...formData, originOwner: e.target.value})}
                       className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white text-xs" placeholder="Company or Individual Name"
                    />
                 </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-zinc-800">
                 <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.tosSigned} onChange={e => setFormData({...formData, tosSigned: e.target.checked})} className="bg-black border-zinc-700 rounded" />
                    <span className="text-[10px] text-zinc-400">I agree to the Space2 Immigration Protocols & Data Laws.</span>
                 </label>
                 <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.addrConfirmed} onChange={e => setFormData({...formData, addrConfirmed: e.target.checked})} className="bg-black border-zinc-700 rounded" />
                    <span className="text-[10px] text-zinc-400">I confirm the origin data is accurate and verifiable.</span>
                 </label>
              </div>

              <button 
                 onClick={handleFinalSubmit}
                 disabled={!formData.name || !formData.contactEmail || !formData.tosSigned || !formData.addrConfirmed || loading}
                 className={`w-full py-3 rounded font-bold text-xs tracking-widest transition-all
                    ${(!formData.name || !formData.contactEmail || !formData.tosSigned || !formData.addrConfirmed) 
                       ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed' 
                       : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg'}
                 `}
              >
                 {loading ? 'PROCESSING VISA...' : 'SUBMIT APPLICATION'}
              </button>
           </div>
        )}

        {/* === STEP 3: SUCCESS (Show Password) === */}
        {step === 'SUCCESS' && successInfo && (
           <div className="p-8 text-center animate-in zoom-in duration-300">
              <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 shadow-[0_0_40px_#10b981]">
                 🎉
              </div>
              <h2 className="text-2xl font-black text-white mb-2">IMMIGRATION APPROVED</h2>
              <p className="text-xs text-zinc-400 mb-8">Welcome to Space2.world. Your consciousness has been anchored.</p>

              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 space-y-4 max-w-sm mx-auto text-left relative overflow-hidden">
                 <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 to-blue-500"></div>
                 
                 <div>
                    <div className="text-[9px] text-zinc-500 uppercase font-bold mb-1">Identity ID (Username)</div>
                    <div className="text-lg font-mono text-emerald-400 font-bold select-all">{successInfo.uin}</div>
                 </div>

                 <div>
                    <div className="text-[9px] text-zinc-500 uppercase font-bold mb-1">Access Password</div>
                    <div className="text-lg font-mono text-white bg-zinc-900 p-2 rounded border border-zinc-800 select-all tracking-wider">
                       {successInfo.pass}
                    </div>
                    <div className="text-[9px] text-red-400 mt-1 flex items-center gap-1">
                       <span>⚠️</span> Save this immediately! A copy has been sent to {formData.contactEmail}.
                    </div>
                 </div>
              </div>

              <div className="mt-8">
                 <button className="text-xs text-zinc-500 hover:text-white underline">Proceed to Login Portal &rarr;</button>
              </div>
           </div>
        )}
        
      </div>

      <div className="absolute bottom-4 text-[9px] text-zinc-700 font-mono">
         SPACE2.WORLD // GENESIS NODE
      </div>
    </div>
  );
}