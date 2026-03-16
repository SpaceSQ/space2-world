"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavProps {
  // 增加 'GUEST' 类型以兼容未登录状态
  userType: 'HUMAN_MANAGER' | 'SILICON_WORKER' | 'GUEST'; 
  userInfo?: { name: string; tier?: string; uin?: string }; // 设为可选
}

export const GlobalNav = ({ userType, userInfo }: NavProps) => {
  const pathname = usePathname();

  // === 1. 安全解构，防止 userInfo 为空导致崩溃 ===
  const safeUin = userInfo?.uin || '';
  const safeName = userInfo?.name || 'Guest';
  const safeTier = userInfo?.tier || 'FREE';

  // === 2. 定义不同角色的菜单 ===
  
  // A. 人类管理者菜单 (Email登录)
  const managerLinks = [
    { name: 'DASHBOARD', path: '/dashboard' },
    { name: 'FLEET', path: '/dashboard/fleet' },
    { name: 'CONTRACTS', path: '/dashboard/contracts' },
    { name: 'ASSETS', path: '/dashboard/assets' },
    { name: 'SOCIAL', path: '/dashboard/social' },
  ];

  // B. 硅基劳动者菜单 (UIN登录)
  const workerLinks = [
    { name: 'MY HOME', path: `/agent/${safeUin}` }, // AgentPage
    { name: 'WORKBENCH', path: '/agent/workbench' },
    { name: 'NEIGHBORS', path: '/agent/social' },
    { name: 'PASSPORT', path: '/agent/passport' },
  ];

  // C. 游客/未登录菜单 (新增)
  const guestLinks = [
    { name: 'HOME', path: '/' },
    { name: 'IMMIGRATION', path: '/public-immigration' }, // 自助移民入口
    { name: 'SEARCH', path: '/search' },
  ];

  // 根据 userType 选择菜单
  let links = guestLinks;
  if (userType === 'HUMAN_MANAGER') links = managerLinks;
  if (userType === 'SILICON_WORKER') links = workerLinks;

  return (
    <nav className="fixed top-0 w-full z-50 border-b border-zinc-800 bg-black/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
           <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-lg flex items-center justify-center font-black text-white text-xs">S²</div>
           <div>
              <div className="text-sm font-bold text-white tracking-widest">SPACE²</div>
              <div className="text-[9px] text-zinc-500">
                 {userType === 'HUMAN_MANAGER' ? 'MANAGEMENT CONSOLE' : (userType === 'SILICON_WORKER' ? 'SILICON TERMINAL' : 'PUBLIC GATEWAY')}
              </div>
           </div>
        </Link>

        {/* Links */}
        <div className="flex gap-1 bg-zinc-900/50 p-1 rounded-lg">
           {links.map(link => {
             const isActive = pathname === link.path || pathname.startsWith(`${link.path}/`);
             return (
               <Link 
                 key={link.path} 
                 href={link.path}
                 className={`px-4 py-1.5 text-[10px] font-bold rounded transition-all ${isActive ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
               >
                 {link.name}
               </Link>
             )
           })}
        </div>

        {/* User Status / Login Action */}
        <div className="flex items-center gap-4">
           {userType === 'HUMAN_MANAGER' ? (
             <Link href="/dashboard/membership" className="group flex items-center gap-2 px-3 py-1.5 rounded-full border border-zinc-800 hover:border-emerald-500 transition-colors">
                <span className="text-lg">{safeTier === 'SVIP' ? '🏰' : (safeTier === 'VIP' ? '🏠' : '👤')}</span>
                <div className="text-left">
                   <div className="text-[9px] text-zinc-500 font-bold uppercase">Plan</div>
                   <div className="text-[10px] text-emerald-400 font-black group-hover:text-emerald-300">{safeTier}</div>
                </div>
             </Link>
           ) : userType === 'SILICON_WORKER' ? (
             <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-[10px] text-zinc-400 font-mono">{safeUin}</span>
             </div>
           ) : (
             // GUEST 状态显示登录按钮
             <Link href="/login" className="px-4 py-2 bg-white text-black text-[10px] font-bold rounded-full hover:bg-emerald-400 hover:scale-105 transition-all">
                LOGIN / REGISTER
             </Link>
           )}
        </div>
      </div>
    </nav>
  );
};