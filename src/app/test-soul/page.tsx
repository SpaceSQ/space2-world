// app/test-soul/page.tsx
"use client";
import React from 'react';
import AgentSoulDossier from '../../components/AgentSoulDossier';

export default function TestSoulPage() {
  return (
    <div className="min-h-screen bg-[#020408] flex items-center justify-center p-4 md:p-10">
      <div className="w-full max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-black text-white italic">LABORATORY <span className="text-orange-500">TEST ARENA</span></h1>
          <p className="text-zinc-500 font-mono text-sm mt-2">Checking UI rendering for Neuro-Radar and SOUL Matrix...</p>
        </div>
        
        {/* 直接挂载我们刚才写的聚合面板 */}
        <AgentSoulDossier agentUin="V-TEST-001-ALPHA" />
        
      </div>
    </div>
  );
}
