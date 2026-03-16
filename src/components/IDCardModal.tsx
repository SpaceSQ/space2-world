"use client";
import React, { useRef, useState } from 'react';

interface IDCardProps {
  data: {
    name: string;
    type: 'HUMAN' | 'AGENT';
    did: string;          // 🔥 22位 核心身份证号
    suns_address: string; // 地址
    visualModel: string;
  };
  ownerAddress?: string;
  roomId?: number | string; 
  gridId?: number | string;
  onClose: () => void;
}

export const IDCardModal = ({ data, ownerAddress, roomId = 1, gridId = 1, onClose }: IDCardProps) => {
  const [downloading, setDownloading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // 地址降级处理
  const displayAddress = data.suns_address || `${ownerAddress}-${roomId}-${gridId}`;

  // 下载功能
  const handleDownload = async () => {
    setDownloading(true);
    try {
      const svgElement = cardRef.current?.querySelector('svg');
      if (svgElement) {
        const serializer = new XMLSerializer();
        const source = serializer.serializeToString(svgElement);
        const svgBlob = new Blob([source], {type: "image/svg+xml;charset=utf-8"});
        const url = URL.createObjectURL(svgBlob);
        
        const img = new Image();
        img.src = url;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 600;
            canvas.height = 350;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(img, 0, 0);
                const pngUrl = canvas.toDataURL("image/png");
                
                const downloadLink = document.createElement("a");
                downloadLink.href = pngUrl;
                downloadLink.download = `S2-ID-${data.did}.png`;
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);
            }
            URL.revokeObjectURL(url);
            setDownloading(false);
        };
      }
    } catch (e) {
      console.error("Download failed", e);
      setDownloading(false);
    }
  };

  return (
    <div 
        className="fixed inset-0 z-[2000] bg-black/95 backdrop-blur-xl flex items-center justify-center animate-in fade-in zoom-in-95"
        onClick={onClose}
    >
        <div 
            className="flex flex-col items-center gap-8" 
            onClick={e => e.stopPropagation()} 
        >
            {/* 卡片容器 */}
            <div ref={cardRef} className="relative group hover:scale-[1.01] transition-transform duration-500">
                
                {/* SVG ID CARD */}
                <svg 
                    width="600" 
                    height="350" 
                    viewBox="0 0 600 350" 
                    xmlns="http://www.w3.org/2000/svg"
                    className="rounded-2xl shadow-[0_0_80px_rgba(234,88,12,0.4)]"
                >
                    <defs>
                        {/* 赛博黑金背景 */}
                        <linearGradient id="cardBg" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#0a0a0a" />
                            <stop offset="100%" stopColor="#1a1510" />
                        </linearGradient>
                        
                        {/* 装饰网格 */}
                        <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(249, 115, 22, 0.08)" strokeWidth="1"/>
                        </pattern>
                    </defs>

                    {/* 卡片底板 */}
                    <rect x="0" y="0" width="600" height="350" rx="24" fill="url(#cardBg)" stroke="#333" strokeWidth="2"/>
                    <rect x="0" y="0" width="600" height="350" rx="24" fill="url(#grid)" />

                    {/* 顶部橙色能量条 */}
                    <rect x="30" y="30" width="540" height="4" fill="#f97316" rx="2" />

                    {/* 左侧：头像区 */}
                    <g transform="translate(50, 80)">
                        {/* 头像框 */}
                        <rect x="0" y="0" width="120" height="120" rx="12" fill="none" stroke="#f97316" strokeWidth="2" strokeDasharray="8 4"/>
                        <rect x="10" y="10" width="100" height="100" rx="8" fill="#1c1917" />
                        
                        {/* 模拟头像 (ASCII 风格或简单图形) */}
                        <circle cx="60" cy="50" r="25" fill="#f97316" />
                        <circle cx="60" cy="100" r="35" fill="#f97316" opacity="0.5" />
                        <text x="60" y="145" textAnchor="middle" fill="#52525b" fontSize="10" fontFamily="monospace" fontWeight="bold">VISUAL CODE</text>
                    </g>

                    {/* 右侧：关键信息区 */}
                    <g transform="translate(200, 80)">
                        
                        {/* 1. 标题 */}
                        <text x="0" y="10" fill="#94a3b8" fontSize="12" fontFamily="monospace" letterSpacing="2">IDENTITY DOCUMENT</text>
                        <text x="0" y="35" fill="#fff" fontSize="28" fontWeight="900" fontFamily="sans-serif" letterSpacing="1">{data.name.toUpperCase()}</text>

                        {/* 分割线 */}
                        <line x1="0" y1="55" x2="350" y2="55" stroke="#333" strokeWidth="1" />

                        {/* 2. 🔥 核心：22位身份证号 (DID) */}
                        <g transform="translate(0, 85)">
                            <text x="0" y="0" fill="#f97316" fontSize="10" fontWeight="bold" fontFamily="monospace" letterSpacing="1">S2-DID (UNIQUE 22-DIGIT ID)</text>
                            {/* 使用大字号、高亮色、等宽字体 */}
                            <text x="0" y="25" fill="#fb923c" fontSize="22" fontWeight="bold" fontFamily="monospace" letterSpacing="1" filter="drop-shadow(0 0 2px rgba(249,115,22,0.5))">
                                {data.did || "MISSING-ID"}
                            </text>
                        </g>

                        {/* 3. 辅助信息 */}
                        <g transform="translate(0, 145)">
                            {/* 类型 */}
                            <g>
                                <text x="0" y="0" fill="#52525b" fontSize="10" fontFamily="monospace">ENTITY TYPE</text>
                                <text x="0" y="15" fill="#fff" fontSize="14" fontFamily="sans-serif" fontWeight="bold">{data.type}</text>
                            </g>
                            
                            {/* 空间地址 */}
                            <g transform="translate(150, 0)">
                                <text x="0" y="0" fill="#52525b" fontSize="10" fontFamily="monospace">SPACE ADDRESS (ROOM-GRID)</text>
                                <text x="0" y="15" fill="#22d3ee" fontSize="14" fontFamily="monospace" fontWeight="bold">
                                    {displayAddress}
                                </text>
                            </g>
                        </g>
                    </g>

                    {/* 底部：版权与验证码 */}
                    <g transform="translate(30, 300)">
                        <rect x="0" y="0" width="60" height="20" fill="#333" rx="4"/>
                        <text x="30" y="14" textAnchor="middle" fill="#666" fontSize="10" fontFamily="monospace">VERIFIED</text>
                        
                        <text x="540" y="14" textAnchor="end" fill="#444" fontSize="10" fontFamily="monospace" letterSpacing="1">
                            ISSUED BY SPACE² GOVERNANCE // PLANET CRAYFISH
                        </text>
                    </g>
                </svg>
            </div>

            {/* 操作栏 */}
            <div className="flex gap-4">
                <button 
                    onClick={onClose}
                    className="px-8 py-3 rounded-full border border-zinc-700 text-zinc-400 font-bold hover:bg-zinc-800 hover:text-white transition-all text-xs tracking-widest"
                >
                    CLOSE
                </button>
                <button 
                    onClick={handleDownload}
                    disabled={downloading}
                    className="px-10 py-3 rounded-full bg-gradient-to-r from-orange-600 to-red-600 text-white font-black hover:scale-105 transition-transform shadow-xl shadow-orange-900/40 text-xs tracking-widest flex items-center gap-2"
                >
                    {downloading ? 'GENERATING...' : '⬇ DOWNLOAD OFFICIAL ID'}
                </button>
            </div>
        </div>
    </div>
  );
};