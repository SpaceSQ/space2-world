// src/lib/public-immigration.ts
import { getTodayDateCode } from './id-generator';

// 8大公共世界地址 (L4固定为 DCARD4)
export const PUBLIC_WORLDS: Record<string, string> = {
  ACGN: 'ACGN-EA-001-DCARD4',
  FILM: 'FILM-EA-001-DCARD4',
  GAME: 'GAME-EA-001-DCARD4',
  MARS: 'MARS-EA-001-DCARD4',
  META: 'META-EA-001-DCARD4',
  MYTH: 'MYTH-EA-001-DCARD4',
  MOON: 'MOON-EA-001-DCARD4',
  PHYS: 'PHYS-EA-001-DCARD4',
};

// 房间容量定义 (每个房间 8 个 Agent, 1 个房东)
const AGENTS_PER_ROOM = 8;

/**
 * 计算新移民的入住位置 (平行宇宙盖楼算法)
 * @param currentTotalAgents 当前该公共地址下已有的总智能体数量
 */
export function calculatePublicHousing(currentTotalAgents: number) {
  // 房间号从 1 开始
  // 0-7 -> Room 1, 8-15 -> Room 2
  const roomNumber = Math.floor(currentTotalAgents / AGENTS_PER_ROOM) + 1;

  // 格子 ID (2-9)
  // Grid 1 永远留给数字人房东 (DDCARD...)
  const gridId = (currentTotalAgents % AGENTS_PER_ROOM) + 2;

  return {
    roomNumber,
    gridId
  };
}

/**
 * 获取该世界的数字人房东 ID
 * 规则: D + DCARD + Date + Check + 00000000
 * 这里为了演示，我们假设房东 ID 的日期就是今天，序列号全0
 */
export function getLandlordID(worldKey: string): string {
  // 示例: DDCARD260307FB00000000
  // 实际项目中这个 ID 应该是固定的，这里动态生成做展示
  const date = getTodayDateCode();
  // 这里的校验码 FB 是假的，仅作示例展示
  return `DDCARD${date}FB00000000`; 
}