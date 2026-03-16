"use client";
import React, { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { GlobalNav } from '@/components/GlobalNav';
import { useRouter } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login'); // 没登录踢回登录页
        return;
      }

      // 获取人类管理者信息
      const { data: citizen } = await supabase
        .from('citizens')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (citizen) {
        setUser(citizen);
      }
      setLoading(false);
    };
    checkUser();
  }, [router, supabase]);

  if (loading) return <div className="min-h-screen bg-[#020617] flex items-center justify-center text-emerald-500 font-mono animate-pulse">AUTHENTICATING COMMANDER...</div>;

  return (
    <div className="min-h-screen bg-[#020617] text-white selection:bg-emerald-500/30">
      {/* 顶部导航：传入 HUMAN_MANAGER 角色 */}
      <GlobalNav 
        userType="HUMAN_MANAGER" 
        userInfo={{ 
          name: user?.name || 'Commander', 
          tier: user?.subscription_tier || 'FREE', // 免费/VIP/SVIP
          uin: user?.uin 
        }} 
      />
      
      {/* 子页面容器 */}
      <main className="animate-in fade-in duration-500">
        {children}
      </main>
    </div>
  );
}