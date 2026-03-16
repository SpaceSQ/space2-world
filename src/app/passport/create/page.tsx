"use client";
import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { registerCitizen, checkExistingCitizenship } from '@/lib/db-actions';
import { generateSUNSAddress } from '@/lib/suns-v2.1';
import { generateDigitalHumanID, generateRandomSequence, getTodayDateCode } from '@/lib/id-generator';
import { GlobalNav } from '@/components/GlobalNav';

export default function PassportCreate() {
  const supabase = createClientComponentClient();
  const router = useRouter();

  // --- 流程状态 ---
  const [step, setStep] = useState<'AUTH' | 'CHECKING' | 'ADDRESS_FORM' | 'IDENTITY_FORM' | 'SUCCESS'>('AUTH');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // --- 1. 基础账号 (Auth) ---
  const [authMode, setAuthMode] = useState<'LOGIN' | 'SIGNUP'>('SIGNUP');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [user, setUser] = useState<any>(null);

  // --- 2. 地址业务 (Address) ---
  const [planet, setPlanet] = useState<'EARTH' | 'MARS' | 'MOON'>('EARTH');
  const [city, setCity] = useState('');
  const [handle, setHandle] = useState('');
  const [citizenName, setCitizenName] = useState('');
  const [previewAddress, setPreviewAddress] = useState('');

  // --- 3. 身份业务 (Identity) ---
  const [realName, setRealName] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [idSequence, setIdSequence] = useState('');
  const [previewID, setPreviewID] = useState('');

  // 初始化：检查登录态
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        checkEligibility(session.user.id);
      }
    };
    checkSession();
  }, []);

  const checkEligibility = async (userId: string) => {
    setStep('CHECKING');
    try {
      const existing = await checkExistingCitizenship(userId);
      if (existing) router.push(`/passport/${existing.uin}`);
      else setStep('ADDRESS_FORM'); 
    } catch (err) {
      setStep('ADDRESS_FORM'); 
    }
  };

  const isValidInput = (val: string) => /^[a-zA-Z0-9]*$/.test(val);

  // --- A. 注册/登录逻辑 ---
  const handleAuth = async () => {
    setErrorMsg('');
    if (!email || !password) { setErrorMsg('Credentials required.'); return; }
    
    setLoading(true);

    if (authMode === 'SIGNUP') {
      if (password !== confirmPassword) { setErrorMsg('Passwords mismatch.'); setLoading(false); return; }
      
      const { data, error } = await supabase.auth.signUp({
        email, password, options: { emailRedirectTo: `${location.origin}/auth/callback` }
      });

      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
      } else {
        setShowOtpInput(true); 
        setErrorMsg(''); 
        setLoading(false);
      }

    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { setErrorMsg(error.message); setLoading(false); }
      else if (data.session) {
        setUser(data.session.user);
        checkEligibility(data.session.user.id);
      }
    }
  };

  // --- B. 验证验证码 (🔥 8位修正版) ---
  const handleVerifyOtp = async () => {
    // 🔥 校验长度改为 8
    if (otp.length < 8) return;
    setLoading(true); setErrorMsg('');

    const { data, error } = await supabase.auth.verifyOtp({
      email, token: otp, type: 'signup'
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
    } else if (data.session) {
      setUser(data.session.user);
      checkEligibility(data.session.user.id);
    }
  };

  // --- 业务预览逻辑 ---
  const handlePreviewAddress = () => {
    setErrorMsg('');
    if (!city || city.length < 2) { setErrorMsg('City code too short.'); return; }
    if (!handle || handle.length < 3) { setErrorMsg('Handle too short.'); return; }
    if (!citizenName) { setErrorMsg('Display Name required.'); return; }

    let l1 = 'S2', l2 = '00';
    if (planet === 'MARS') { l1 = 'MA'; l2 = 'RS'; }
    if (planet === 'MOON') { l1 = 'MO'; l2 = 'ON'; }

    const res = generateSUNSAddress({ l1, l2, city, handle });
    if ('error' in res) setErrorMsg(res.error);
    else { setPreviewAddress(res.address); setErrorMsg(''); }
  };

  const handlePreviewID = () => {
    setErrorMsg('');
    if (!realName || realName.length < 2) { setErrorMsg('Full Name required.'); return; }
    if (!birthdate) { setErrorMsg('Birthdate required.'); return; }
    
    let seq = idSequence;
    if (!seq) { seq = generateRandomSequence(); setIdSequence(seq); }
    seq = seq.padEnd(10, '0');

    const fullID = generateDigitalHumanID(realName, seq);
    setPreviewID(fullID);
  };

  const handleFinalSubmit = async () => {
    if (!previewID || !user) return;
    setLoading(true);
    try {
      let l1 = 'S2', l2 = '00';
      if (planet === 'MARS') { l1 = 'MA'; l2 = 'RS'; }
      if (planet === 'MOON') { l1 = 'MO'; l2 = 'ON'; }
      
      await registerCitizen({
        owner_id: user.id, email: user.email, name: realName.toUpperCase(),
        birthdate: birthdate, uin: previewID, l1, l2, city, handle
      });
      setStep('SUCCESS');
    } catch (err: any) { setErrorMsg(err.message); } 
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen w-full bg-[#020617] text-white font-mono flex flex-col items-center justify-center relative overflow-y-auto py-10">
      <div className="fixed top-0 w-full z-50"><GlobalNav currentScene="REGISTRY" /></div>
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none z-0"></div>

      <div className="z-10 w-full max-w-[360px] px-4 mt-12 animate-in fade-in zoom-in-95 duration-300">
        
        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="text-xl font-black tracking-tighter text-white">SPACE².WORLD</h1>
          <p className="text-[9px] text-zinc-500 uppercase tracking-widest">Sovereign Identity Registry</p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] rounded flex items-center gap-2"><span>⚠️</span> {errorMsg}</div>
        )}

        {/* === STEP 1: AUTH === */}
        {step === 'AUTH' && (
          <div className="bg-black/40 border border-zinc-800 p-6 rounded-xl backdrop-blur-md shadow-2xl">
             
             {/* 模式一：输入邮箱密码 */}
             {!showOtpInput && (
               <>
                 <div className="flex border-b border-zinc-800 mb-6 pb-2">
                    <button onClick={() => setAuthMode('SIGNUP')} className={`flex-1 text-xs font-bold pb-2 border-b-2 transition-all ${authMode === 'SIGNUP' ? 'text-white border-emerald-500' : 'text-zinc-600 border-transparent'}`}>REGISTER</button>
                    <button onClick={() => setAuthMode('LOGIN')} className={`flex-1 text-xs font-bold pb-2 border-b-2 transition-all ${authMode === 'LOGIN' ? 'text-white border-blue-500' : 'text-zinc-600 border-transparent'}`}>LOGIN</button>
                 </div>

                 <div className="space-y-4">
                    <input type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-zinc-900/50 border border-zinc-700 rounded-lg p-3 text-sm outline-none focus:border-white text-white" />
                    <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-zinc-900/50 border border-zinc-700 rounded-lg p-3 text-sm outline-none focus:border-white text-white" />
                    {authMode === 'SIGNUP' && (
                      <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full bg-zinc-900/50 border border-zinc-700 rounded-lg p-3 text-sm outline-none focus:border-white text-white" />
                    )}

                    <button 
                      onClick={handleAuth} disabled={loading}
                      className={`w-full font-black py-3.5 rounded-lg uppercase tracking-widest text-[10px] shadow-lg ${authMode === 'SIGNUP' ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-white hover:bg-zinc-200 text-black'}`}
                    >
                      {loading ? 'Processing...' : (authMode === 'SIGNUP' ? 'Register & Send Code' : 'Secure Login')}
                    </button>
                 </div>
               </>
             )}

             {/* 模式二：输入验证码 (🔥 8位修正版) */}
             {showOtpInput && (
               <div className="animate-in slide-in-from-right-8">
                  <div className="text-center mb-6">
                    <div className="text-emerald-500 font-bold mb-1">Check Your Email</div>
                    {/* 提示文案改为 8-digit */}
                    <div className="text-[10px] text-zinc-500">We sent an 8-digit code to <span className="text-white">{email}</span></div>
                  </div>

                  <div className="space-y-4">
                    <input 
                      type="text" value={otp} 
                      onChange={e => { const val = e.target.value.replace(/\D/g, ''); setOtp(val); }} 
                      maxLength={8} // 🔥 最大长度 8
                      placeholder="--------" // 🔥 占位符 8位
                      autoFocus 
                      className="w-full bg-black border border-emerald-500/50 rounded-lg p-4 text-center text-xl font-bold tracking-[0.3em] text-white outline-none shadow-[0_0_15px_rgba(16,185,129,0.2)]" 
                    />
                    
                    {/* 按钮状态校验长度改为 8 */}
                    <button 
                      onClick={handleVerifyOtp} disabled={loading || otp.length < 8}
                      className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black py-3.5 rounded-lg uppercase tracking-widest text-[10px] shadow-lg disabled:opacity-50"
                    >
                      {loading ? 'Verifying...' : 'Verify & Enter'}
                    </button>
                    
                    <button onClick={() => setShowOtpInput(false)} className="w-full text-[9px] text-zinc-500 hover:text-white underline">Wrong email? Go Back</button>
                  </div>
               </div>
             )}
          </div>
        )}

        {/* === STEP 2: ADDRESS === */}
        {step === 'ADDRESS_FORM' && (
          <div className="bg-black/40 border border-zinc-800 p-6 rounded-xl backdrop-blur-md animate-in slide-in-from-right-8">
            <div className="flex justify-between items-center mb-6 pb-2 border-b border-zinc-800">
               <span className="text-[10px] font-bold text-emerald-500 uppercase">1. Location Mapping</span>
               <span className="text-[9px] text-zinc-600">Address Protocol</span>
            </div>

            <div className="space-y-4 mb-6">
               <div>
                  <label className="text-[9px] text-zinc-500 font-bold uppercase block mb-2">Planet</label>
                  <div className="flex gap-2">
                    {['EARTH', 'MARS', 'MOON'].map(p => (
                      <button key={p} onClick={() => { setPlanet(p as any); setPreviewAddress(''); }} className={`flex-1 py-2 rounded border text-[9px] font-bold ${planet === p ? 'bg-white text-black border-white' : 'bg-black text-zinc-500 border-zinc-800'}`}>{p}</button>
                    ))}
                  </div>
               </div>
               <div>
                  <label className="text-[9px] text-zinc-500 font-bold uppercase block mb-1">City Sector (L3)</label>
                  <input type="text" placeholder="SHANGHAI" maxLength={15} value={city} onChange={e => { if(isValidInput(e.target.value)) { setCity(e.target.value.toUpperCase()); setPreviewAddress(''); } }} className="w-full bg-zinc-900/50 border border-zinc-700 rounded-lg p-3 text-xs outline-none focus:border-emerald-500 text-white" />
               </div>
               <div>
                  <label className="text-[9px] text-zinc-500 font-bold uppercase block mb-1">Sovereign Handle (L4)</label>
                  <input type="text" placeholder="MYHOME" maxLength={24} value={handle} onChange={e => { if(isValidInput(e.target.value)) { setHandle(e.target.value.toUpperCase()); setPreviewAddress(''); } }} className="w-full bg-zinc-900/50 border border-zinc-700 rounded-lg p-3 text-xs outline-none focus:border-emerald-500 text-white" />
               </div>
               <div>
                  <label className="text-[9px] text-zinc-500 font-bold uppercase block mb-1">Display Name</label>
                  <input type="text" placeholder="Commander X" maxLength={20} value={citizenName} onChange={e => setCitizenName(e.target.value)} className="w-full bg-zinc-900/50 border border-zinc-700 rounded-lg p-3 text-xs outline-none focus:border-emerald-500 text-white" />
               </div>
            </div>

            {!previewAddress ? (
                <button onClick={handlePreviewAddress} className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 rounded-lg text-[10px] uppercase border border-zinc-700">Generate Preview</button>
            ) : (
                <div className="animate-in fade-in zoom-in-95">
                   <div className="bg-emerald-900/10 border border-emerald-500/30 border-dashed rounded-lg p-3 mb-4 text-center">
                      <div className="text-[9px] text-emerald-500/70 mb-1">GENERATED ADDRESS</div>
                      <div className="font-mono text-xs font-bold text-emerald-400 break-all">{previewAddress}</div>
                   </div>
                   <div className="flex gap-2">
                      <button onClick={() => setPreviewAddress('')} className="flex-1 bg-zinc-800 text-zinc-400 font-bold py-3 rounded-lg text-[10px] uppercase">Edit</button>
                      <button onClick={() => setStep('IDENTITY_FORM')} className="flex-[2] bg-white text-black hover:bg-emerald-400 font-black py-3 rounded-lg text-[10px] uppercase shadow-lg">Confirm & Next</button>
                   </div>
                </div>
            )}
          </div>
        )}

        {/* === STEP 3: IDENTITY === */}
        {step === 'IDENTITY_FORM' && (
          <div className="bg-black/40 border border-zinc-800 p-6 rounded-xl backdrop-blur-md animate-in slide-in-from-right-8">
            <div className="flex justify-between items-center mb-6 pb-2 border-b border-zinc-800">
               <span className="text-[10px] font-bold text-blue-500 uppercase">2. Identity Matrix</span>
               <span className="text-[9px] text-zinc-600">Digital Human</span>
            </div>

            <div className="space-y-4 mb-6">
               <div>
                  <label className="text-[9px] text-zinc-500 font-bold uppercase block mb-1">Full Name</label>
                  <input type="text" placeholder="ZHANG SAN" maxLength={30} value={realName} onChange={e => { setRealName(e.target.value.toUpperCase()); setPreviewID(''); }} className="w-full bg-zinc-900/50 border border-zinc-700 rounded-lg p-3 text-xs outline-none focus:border-blue-500 text-white" />
               </div>
               <div>
                  <label className="text-[9px] text-zinc-500 font-bold uppercase block mb-1">Birthdate</label>
                  <input type="date" value={birthdate} onChange={e => { setBirthdate(e.target.value); setPreviewID(''); }} style={{ colorScheme: 'dark' }} className="w-full bg-zinc-900/50 border border-zinc-700 rounded-lg p-3 text-xs outline-none focus:border-blue-500 text-white cursor-pointer" />
               </div>
               <div>
                  <label className="text-[9px] text-zinc-500 font-bold uppercase block mb-1">Lucky Sequence (Optional)</label>
                  <input type="text" placeholder="Auto-generated" maxLength={10} value={idSequence} onChange={e => { const val = e.target.value.replace(/\D/g, ''); setIdSequence(val); setPreviewID(''); }} className="w-full bg-zinc-900/50 border border-zinc-700 rounded-lg p-3 text-xs font-mono outline-none focus:border-blue-500 text-white" />
               </div>
            </div>

            {!previewID ? (
                <div className="flex gap-2">
                   <button onClick={() => setStep('ADDRESS_FORM')} className="flex-1 bg-zinc-900 text-zinc-500 font-bold py-3 rounded-lg text-[10px] uppercase border border-zinc-800">Back</button>
                   <button onClick={handlePreviewID} className="flex-[2] bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 rounded-lg text-[10px] uppercase border border-zinc-700">Generate Preview</button>
                </div>
            ) : (
                <div className="animate-in fade-in zoom-in-95">
                   <div className="bg-blue-900/10 border border-blue-500/30 border-dashed rounded-lg p-3 mb-4 text-center">
                      <div className="text-[9px] text-blue-500/70 mb-1">DIGITAL IDENTITY</div>
                      <div className="font-mono text-xs font-bold text-blue-400 break-all">{previewID}</div>
                   </div>
                   <div className="flex gap-2">
                      <button onClick={() => setPreviewID('')} className="flex-1 bg-zinc-800 text-zinc-400 font-bold py-3 rounded-lg text-[10px] uppercase">Edit</button>
                      <button onClick={handleFinalSubmit} disabled={loading} className="flex-[2] bg-white text-black hover:bg-emerald-400 font-black py-3 rounded-lg text-[10px] uppercase shadow-lg">
                        {loading ? 'Minting...' : 'Confirm & Mint'}
                      </button>
                   </div>
                </div>
            )}
          </div>
        )}

        {step === 'SUCCESS' && (
          <div className="bg-black/40 border border-zinc-800 p-8 rounded-xl backdrop-blur-md text-center animate-in zoom-in-95">
            <div className="w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center text-3xl mb-4 mx-auto shadow-lg">✓</div>
            <h2 className="text-xl font-black text-white mb-2">CITIZEN MINTED</h2>
            <p className="text-[10px] text-zinc-400 mb-6">Your sovereign identity is secured.</p>
            <button onClick={() => router.push('/')} className="w-full px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-lg text-[10px] uppercase">Enter Dashboard</button>
          </div>
        )}

        {step === 'CHECKING' && (
           <div className="text-center py-12">
             <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
             <div className="text-[10px] font-bold text-white">VERIFYING CITIZENSHIP...</div>
           </div>
        )}
      </div>
    </div>
  );
}