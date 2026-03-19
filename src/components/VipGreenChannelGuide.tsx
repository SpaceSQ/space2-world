"use client";

import React from "react";
import Link from "next/link";

export default function VipGreenChannelGuide() {
  return (
    // ✅ 关键修改：从 top-20 改为 top-20 (完美错开你原来的标语高度)
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[9999] w-[calc(100%-2rem)] max-w-xl group cursor-pointer font-mono">
      <Link href="/welcome" className="block text-current no-underline">
        
        {/* 外框：灰色基底、橙色霓虹、悬浮放大 */}
        <div className="relative flex items-center bg-[#1a1a1a] border-2 border-orange-500 rounded p-4 shadow-[0_0_25px_rgba(251,146,60,0.5)] hover:shadow-[0_0_40px_rgba(251,146,60,0.8)] hover:scale-105 hover:bg-[#202020] transition-all duration-300">
          
          {/* 左侧：发光警示图标区 */}
          <div className="flex-shrink-0 mr-5 relative flex items-center justify-center w-14 h-14 bg-black border-2 border-orange-500 rounded overflow-hidden shadow-[inset_0_0_15px_rgba(251,146,60,0.3)]">
            <div className="absolute w-full h-1 bg-orange-400 opacity-60 animate-[ping_2.5s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
            <span className="text-orange-400 font-black text-2xl tracking-tighter">S2</span>
          </div>

          {/* 右侧：文字引导区 */}
          <div className="flex flex-col flex-grow">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-400 animate-pulse shadow-[0_0_8px_rgba(251,146,60,0.8)]"></span>
              <span className="text-xs md:text-sm font-bold text-yellow-200 tracking-widest uppercase">
                VIP Green Channel 入口
              </span>
            </div>
            
            <span className="text-white text-sm md:text-lg font-extrabold whitespace-nowrap group-hover:text-yellow-200 transition-colors uppercase tracking-tight">
              认领本地 S2-DNA / DID 领地坐标 <span className="inline-block group-hover:translate-x-1 transition-transform">➔</span>
            </span>
            
            <span className="text-[11px] text-white mt-2 uppercase font-bold bg-orange-950 inline-block px-2 py-0.5 border border-orange-700 w-fit">
              [ Click to Synchronize Local Signature ]
            </span>
          </div>
          
          {/* 赛博朋克风角落准星 */}
          <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-white opacity-60"></div>
          <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 border-white opacity-60"></div>
          <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2 border-white opacity-60"></div>
          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 border-white opacity-60"></div>
        </div>
      </Link>
    </div>
  );
}