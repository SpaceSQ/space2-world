// src/lib/agent-page-utils.ts

/**
 * 智能体 4 种生命状态
 */
export type AgentLifeState = 'IDLE' | 'BUSY' | 'AWAY' | 'OFFLINE';

/**
 * 获取状态对应的颜色配置
 */
export const STATE_CONFIG: Record<AgentLifeState, { color: string, label: string, ping: boolean }> = {
  IDLE:    { color: 'bg-emerald-500', label: '🟢 IDLE',    ping: true },
  BUSY:    { color: 'bg-red-500',     label: '🔴 BUSY',    ping: true },
  AWAY:    { color: 'bg-zinc-500',    label: '🔘 AWAY',    ping: false },
  OFFLINE: { color: 'bg-yellow-500',  label: '🟡 OFFLINE', ping: false },
};

/**
 * 生成 AgentPage 标准地址 (6段式)
 * http://[L1]-[L2]-[L3]-[L4]-[Room]-[Grid]
 */
export function generateAgentPageUrl(
  sunsAddress: string, // L1-L2-L3-L4
  roomNumber: number, 
  gridId: number
): string {
  // 移除可能存在的 http 前缀，确保纯净
  const baseAddr = sunsAddress.replace(/^https?:\/\//, '');
  return `http://${baseAddr}-${roomNumber}-${gridId}`;
}

/**
 * 解析 AgentPage 地址
 */
export function parseAgentPageUrl(url: string) {
  // 移除 http://
  const raw = url.replace(/^https?:\/\//, '');
  const parts = raw.split('-');
  
  if (parts.length < 6) return null;

  return {
    l1: parts[0],
    l2: parts[1],
    l3: parts[2],
    l4: parts[3], // 可能是 DCARD4
    room: parts[4],
    grid: parts[5],
    fullAddress: raw
  };
}