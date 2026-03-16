// src/lib/suns-v3-utils.ts

// 1. L1 逻辑根域常量定义 
export const LOGIC_ROOTS = [
  { code: 'ACGN', label: '二次元世界 (Animation/Comic/Game/Novel)' },
  { code: 'FILM', label: '电影世界 (Cinematic Universe)' },
  { code: 'GAME', label: '游戏世界 (Gaming Logic)' },
  { code: 'MARS', label: '火星世界 (Martian Colony)' },
  { code: 'META', label: '元宇宙 (Metaverse Native)' },
  { code: 'MOON', label: '月球世界 (Lunar Base)' },
  { code: 'MYTH', label: '神话世界 (Mythology)' },
  { code: 'PHYS', label: '自然世界 (Physical Twin)' }
];

// 2. L2 方位矩阵常量定义 
export const ORIENTATION_MATRIX = [
  { code: 'CN', label: '中 (Center)' },
  { code: 'EA', label: '东 (East)' },
  { code: 'WA', label: '西 (West)' },
  { code: 'NA', label: '北 (North)' },
  { code: 'SA', label: '南 (South)' },
  { code: 'NE', label: '东北 (Northeast)' },
  { code: 'NW', label: '西北 (Northwest)' },
  { code: 'SE', label: '东南 (Southeast)' },
  { code: 'SW', label: '西南 (Southwest)' }
];

/**
 * SUNS v3.0 校验码生成算法 (LMC Algorithm)
 * 规则: C = N mod 10
 * 其中 N 为不含校验码的完整字符串长度 (含连字符)
 * [cite: 69-76]
 */
export const calculateChecksum = (l1: string, l2: string, l3: string, l4: string): number => {
  // 基础前缀长度固定为 12位: L1(4) + -(1) + L2(2) + -(1) + L3(3) + -(1)
  // [cite: 63]
  const prefixLength = 12; 
  
  // 计算总长度 N
  const totalLengthN = prefixLength + l4.length;
  
  // 计算校验模数
  return totalLengthN % 10;
};

/**
 * 生成完整的 SUNS v3.0 地址
 */
export const generateSUNSAddress = (l1: string, l2: string = 'CN', l3: string = '001', l4: string): string => {
  // 强制大写 [cite: 49]
  const cleanL4 = l4.toUpperCase().replace(/[^A-Z]/g, '');
  
  // 验证 L4 长度 (5-35位) [cite: 48]
  if (cleanL4.length < 5 || cleanL4.length > 35) {
    throw new Error("L4 Sovereign Handle must be between 5 and 35 characters.");
  }

  const checksum = calculateChecksum(l1, l2, l3, cleanL4);
  
  // 拼接: [L1]-[L2]-[L3]-[L4][C] 
  return `${l1}-${l2}-${l3}-${cleanL4}${checksum}`;
};