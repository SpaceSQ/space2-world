"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

interface GlobalNavProps {
  currentScene: 'HOME' | 'REGISTRY' | 'PROFILE' | 'WORLD';
}

export const GlobalNav: React.FC<GlobalNavProps> = ({ currentScene }) => {
   const supabase = createClientComponentClient();
   const router = useRouter();
   const [user, setUser] = useState<any>(null);

   // 1. 检查登录状态
   useEffect(() => {
     const getUser = async () => {
       const { data: { session } } = await supabase.auth.getSession();
       if (session) setUser(session.user);
     };
     getUser();
   }, [supabase]);

   // 2. 登出逻辑
   const handleSignOut = async () => {
     await supabase.auth.signOut();
     router.push('/');
     setUser(null);
   };

   // 3. 场景配置 (不同页面不同颜色)
   const sceneConfigs = {
      HOME: { 
        title: 'SPACE².WORLD', 
        bg: 'bg-emerald-500', 
        text: 'text-emerald-400', 
        border: 'border-emerald-900/50',
        icon: '🪐' 
      },
      REGISTRY: { 
        title: 'CITIZEN REGISTRY', 
        bg: 'bg-blue-500', 
        text: 'text-blue-400', 
        border: 'border-blue-900/50',
        icon: '📝'
      },
      PROFILE: { 
        title: 'IDENTITY TERMINAL', 
        bg: 'bg-purple-500', 
        text: 'text-purple-400', 
        border: 'border-purple-900/50',
        icon: '🆔' 
      },
      WORLD: { 
        title: 'SOVEREIGN MATRIX', 
        bg: 'bg-pink-500', 
        text: 'text-pink-400', 
        border: 'border-pink-900/50',
        icon: '🏠' 
      }
   };

   const active = sceneConfigs[currentScene] || sceneConfigs.HOME;

   return (
      <nav className={`fixed top-0 left-0 w-full h-16 px-6 flex justify-between items-center bg-black/80 ${active.border} border-b backdrop-blur-md z-[100]`}>
         
         {/* 左侧：Logo 与 标题 */}
         <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className={`w-8 h-8 rounded-lg ${active.bg} flex items-center justify-center text-black font-bold shadow-[0_0_15px_rgba(255,255,255,0.2)]`}>
               S²
            </div>
            <div>
               <div className={`text-xs font-black tracking-[0.2em] ${active.text} uppercase`}>
                  {active.title}
               </div>
               <div className="text-[8px] text-zinc-500 font-mono">
                  SECURE CONNECTION ESTABLISHED
               </div>
            </div>
         </Link>

         {/* 右侧：用户状态 */}
         <div className="flex items-center gap-4">
            {user ? (
               <div className="flex items-center gap-4">
                  <Link href={`/passport/${user.id}`} className="hidden sm:block text-right group cursor-pointer">
                     <div className="text-[10px] text-zinc-400 group-hover:text-white transition-colors">COMMANDER</div>
                     <div className="text-xs font-bold text-white font-mono">{user.email?.split('@')[0]}</div>
                  </Link>
                  <button 
                     onClick={handleSignOut}
                     className="bg-zinc-900 hover:bg-red-900/30 border border-zinc-700 hover:border-red-800 text-zinc-400 hover:text-red-400 px-3 py-1.5 rounded text-[10px] font-bold uppercase transition-all"
                  >w
                     Log Out
                  </button>
               </div>
            ) : (
               <Link 
                  href="/passport/create" 
                  className="bg-white text-black hover:bg-emerald-400 px-4 py-2 rounded font-bold text-xs uppercase transition-colors shadow-[0_0_10px_rgba(255,255,255,0.2)]"
               >
                  Connect Identity
               </Link>
            )}
         </div>
      </nav>
   );
};