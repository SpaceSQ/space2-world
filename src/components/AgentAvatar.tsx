"use client";
import React, { useMemo } from 'react';

interface AgentAvatarProps {
  seed: string | number; // 🔥 支持字符串或数字输入
  size?: number;
  emotion?: 'NEUTRAL' | 'HAPPY' | 'BUSY' | 'OFFLINE' | 'curious'; 
  isHuman?: boolean; 
}

// 辅助函数：将任意输入转换为稳定的数字种子
const getStableSeed = (input: string | number): number => {
  const str = String(input);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
};

export const AgentAvatar = ({ seed, size = 48, emotion = 'NEUTRAL', isHuman = false }: AgentAvatarProps) => {
  
  // 计算稳定种子
  const numericSeed = useMemo(() => getStableSeed(seed), [seed]);

  // ==========================================
  // 👤 数字人 (Human) - 全息形态
  // ==========================================
  if (isHuman) {
    return (
      <div 
        className="relative flex items-center justify-center rounded-full overflow-hidden shadow-[0_0_20px_rgba(59,130,246,0.6)] border border-blue-400/50 bg-black"
        style={{ width: size, height: size }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900 via-black to-blue-900 opacity-90"></div>
        <svg viewBox="0 0 100 100" className="w-full h-full relative z-10 p-1">
           <defs>
              <linearGradient id="holoGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                 <stop offset="0%" stopColor="#60a5fa" />
                 <stop offset="100%" stopColor="#22d3ee" />
              </linearGradient>
              <filter id="glow">
                 <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                 <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
           </defs>
           <circle cx="50" cy="50" r="45" fill="none" stroke="url(#holoGradient)" strokeWidth="0.5" strokeDasharray="4 4" opacity="0.4">
              <animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="20s" repeatCount="indefinite" />
           </circle>
           <path d="M50 25 C35 25 25 38 25 55 C25 68 35 75 50 75 C65 75 75 68 75 55 C75 38 65 25 50 25 Z" fill="none" stroke="url(#holoGradient)" strokeWidth="1.5" filter="url(#glow)"/>
           <path d="M20 90 Q20 70 35 68 L40 70 M80 90 Q80 70 65 68 L60 70" stroke="url(#holoGradient)" strokeWidth="1.5" fill="none" opacity="0.6" />
           <circle cx="50" cy="45" r="5" fill="#fff" filter="url(#glow)" opacity="0.8">
              <animate attributeName="opacity" values="0.5;1;0.5" dur="3s" repeatCount="indefinite" />
           </circle>
           <rect x="25" y="0" width="50" height="2" fill="rgba(255,255,255,0.1)">
              <animate attributeName="y" from="25" to="75" dur="2s" repeatCount="indefinite" />
           </rect>
        </svg>
      </div>
    );
  }

  // ==========================================
  // 🤖 硅基智能体 (Silicon Agent) - 恢复多样性
  // ==========================================
  
  // 1. 颜色生成
  const colors = useMemo(() => {
    const hues = ['#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#ef4444', '#6366f1', '#14b8a6'];
    const color = hues[numericSeed % hues.length];
    return { primary: color, bg: `${color}20`, border: `${color}60` };
  }, [numericSeed]);

  // 2. 特征生成 (增加形状变化)
  const features = useMemo(() => {
    const shapes = ['rect', 'round', 'hex']; // 外壳形状
    const antennas = ['single', 'double', 'dish', 'ears']; // 天线类型
    const screens = ['wide', 'square', 'goggles']; // 屏幕类型
    return {
       shape: shapes[numericSeed % 3],
       antenna: antennas[(numericSeed >> 2) % 4],
       screen: screens[(numericSeed >> 4) % 3]
    };
  }, [numericSeed]);

  // 3. 表情逻辑
  const eyeState = useMemo(() => {
    if (emotion === 'HAPPY') return { h: 8, y: -2, r: 4 };
    if (emotion === 'BUSY') return { h: 2, y: 0, r: 1 };
    if (emotion === 'curious') return { h: 6, y: 0, r: 3 };
    return { h: 5, y: 0, r: 2 };
  }, [emotion]);

  return (
    <div 
      className="relative flex items-center justify-center transition-all duration-300"
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full p-2 drop-shadow-lg">
        
        {/* === 天线层 (Antenna) === */}
        {features.antenna === 'single' && <line x1="50" y1="25" x2="50" y2="5" stroke={colors.primary} strokeWidth="4" strokeLinecap="round" />}
        {features.antenna === 'double' && <path d="M40 25 L30 10 M60 25 L70 10" stroke={colors.primary} strokeWidth="3" strokeLinecap="round" />}
        {features.antenna === 'dish' && <path d="M50 25 L50 15 M40 10 Q50 20 60 10" stroke={colors.primary} strokeWidth="2" fill="none" />}
        {features.antenna === 'ears' && <path d="M30 35 L20 20 L35 25 M70 35 L80 20 L65 25" fill={colors.primary} />}

        {/* === 机体外壳 (Body) === */}
        {features.shape === 'rect' && <rect x="20" y="25" width="60" height="55" rx="8" fill={colors.primary} stroke={colors.border} strokeWidth="2" />}
        {features.shape === 'round' && <circle cx="50" cy="52" r="30" fill={colors.primary} stroke={colors.border} strokeWidth="2" />}
        {features.shape === 'hex' && <path d="M30 25 L70 25 L85 50 L70 75 L30 75 L15 50 Z" fill={colors.primary} stroke={colors.border} strokeWidth="2" />}
        
        {/* === 屏幕 (Screen) === */}
        {features.screen === 'wide' && <rect x="26" y="35" width="48" height="28" rx="4" fill="#0f172a" />}
        {features.screen === 'square' && <rect x="30" y="32" width="40" height="35" rx="4" fill="#0f172a" />}
        {features.screen === 'goggles' && <path d="M25 40 H75 V60 H25 Z" fill="#0f172a" stroke="#000" strokeWidth="2" rx="10" />}
        
        {/* === 眼睛 (Eyes) === */}
        <g fill="#fff">
          <rect x="36" y={44 + eyeState.y} width="10" height={eyeState.h} rx={eyeState.r}>
             {emotion === 'curious' && <animate attributeName="height" values="5;2;5" dur="3s" repeatCount="indefinite" />}
          </rect>
          <rect x="54" y={44 + eyeState.y} width="10" height={eyeState.h} rx={eyeState.r}>
             {emotion === 'curious' && <animate attributeName="height" values="5;8;5" dur="3s" repeatCount="indefinite" />}
          </rect>
        </g>

        {/* === 嘴巴 (Happy) === */}
        {emotion === 'HAPPY' && (
           <path d="M42 60 Q50 65 58 60" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" />
        )}

        {/* === 状态灯 === */}
        <circle cx="50" cy={features.shape === 'round' ? 70 : 15} r="3" fill={emotion === 'BUSY' ? '#ef4444' : '#10b981'}>
           <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />
        </circle>
      </svg>
    </div>
  );
};