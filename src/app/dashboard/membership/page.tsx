"use client";
import React from 'react';
import { MEMBERSHIP_TIERS } from '@/lib/membership-config';

export default function MembershipPage() {
  const currentTier = 'FREE'; // 实际应从数据库读取

  return (
    <div className="min-h-screen bg-[#020617] pt-24 pb-12 px-6 flex justify-center">
       <div className="max-w-5xl w-full">
          <div className="text-center mb-12">
             <h1 className="text-3xl font-black text-white mb-2">UPGRADE YOUR SPACE</h1>
             <p className="text-zinc-400 text-sm">Scale your silicon workforce from a single unit to a massive empire.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             {Object.entries(MEMBERSHIP_TIERS).map(([id, tier]: [string, any]) => {
                const isCurrent = currentTier === id;
                return (
                  <div key={id} className={`relative p-8 rounded-2xl border flex flex-col ${isCurrent ? 'bg-zinc-900/50 border-emerald-500 ring-1 ring-emerald-500/50' : 'bg-black border-zinc-800 hover:border-zinc-600'}`}>
                     {isCurrent && <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-emerald-600 text-white text-[10px] font-bold px-3 py-1 rounded-full">CURRENT PLAN</div>}
                      
                      <div className="text-4xl mb-4">{tier.icon}</div>
                      <h3 className="text-xl font-bold text-white">{tier.label}</h3>
                      <div className="mt-2 mb-6">
                         <span className="text-3xl font-black text-white">${tier.price}</span>
                         <span className="text-zinc-500 text-xs"> / month</span>
                      </div>

                      <ul className="space-y-3 mb-8 flex-1">
                         <li className="flex items-center gap-2 text-xs text-zinc-300">
                            <span className="text-emerald-500">✓</span>
                            <span>Max Agents: <strong className="text-white">{tier.maxAgents}</strong></span>
                         </li>
                         <li className="flex items-center gap-2 text-xs text-zinc-300">
                            <span className="text-emerald-500">✓</span>
                            <span>Space Size: <strong className="text-white">{tier.maxRooms * 36} m²</strong></span>
                         </li>
                         {tier.features.map(f => (
                            <li key={f} className="flex items-center gap-2 text-xs text-zinc-400">
                               <span className="text-blue-500">✦</span> {f}
                            </li>
                         ))}
                      </ul>

                      <button 
                        disabled={isCurrent}
                        className={`w-full py-3 rounded font-bold text-xs tracking-widest transition-all
                           ${isCurrent ? 'bg-zinc-800 text-zinc-500 cursor-default' : 'bg-white text-black hover:bg-emerald-400 hover:scale-[1.02]'}
                        `}
                      >
                         {isCurrent ? 'ACTIVE' : `UPGRADE TO ${tier.id}`}
                      </button>
                   </div>
                );
             })}
          </div>
       </div>
    </div>
  );
}