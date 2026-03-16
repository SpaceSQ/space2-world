"use client";
import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function AuthForm() {
  const supabase = createClientComponentClient();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  
  // ⏳ 冷却倒计时逻辑
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (cooldown > 0) {
      interval = setInterval(() => setCooldown(c => c - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [cooldown]);

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldown > 0) return; // 还在冷却中，直接拦截

    setLoading(true);
    
    // 1. 发送请求
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    });

    setLoading(false);

    if (error) {
      if (error.status === 429) {
        alert("请求过于频繁，请稍后再试 (Rate Limit Reached)");
      } else {
        alert(error.message);
      }
    } else {
      alert("验证码已发送，请查收邮件！");
      // 2. 触发冷却：60秒内禁止再次发送
      setCooldown(60); 
    }
  };

  return (
    <form onSubmit={handleSendMagicLink} className="space-y-4">
      <input 
        type="email" 
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        className="w-full p-3 bg-zinc-900 border border-zinc-700 rounded text-white"
        required
      />
      
      <button 
        type="submit" 
        disabled={loading || cooldown > 0}
        className={`w-full p-3 rounded font-bold transition-all ${
          cooldown > 0 
            ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed' 
            : 'bg-emerald-600 hover:bg-emerald-500 text-white'
        }`}
      >
        {loading ? 'Sending...' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Send Verification Code'}
      </button>
      
      <p className="text-xs text-zinc-500 text-center">
        Security Note: Limit 3 requests/hour.
      </p>
    </form>
  );
}