// src/lib/heartbeat-logic.ts

/**
 * 免费版 (Class I) 心跳判定逻辑
 * 策略: "Three-Strike Rule" (三振出局/入局)
 * 每天仅检测 3 次 (例如: 08:00, 16:00, 24:00)
 */

interface HeartbeatRecord {
  timestamp: Date;
  status: 'ALIVE' | 'SILENT';
}

/**
 * 判断 Agent 是否在线
 * @param tier 订阅等级
 * @param lastHeartbeat 最后一次收到心跳的时间
 * @param dailyChecks 今日的三次检测记录 (仅针对 FREE 用户)
 */
export function calculateOnlineStatus(
  tier: 'FREE' | 'PRO', 
  lastHeartbeat: Date | null,
  dailyChecks: HeartbeatRecord[] = []
): 'ONLINE' | 'OFFLINE' {
  
  const now = new Date().getTime();
  const last = lastHeartbeat ? new Date(lastHeartbeat).getTime() : 0;

  // === VIP/PRO 逻辑: 实时 ===
  if (tier === 'PRO') {
    // 5分钟内有心跳就算在线
    return (now - last < 5 * 60 * 1000) ? 'ONLINE' : 'OFFLINE';
  }

  // === FREE 逻辑: 稀疏判定 ===
  // 规则: 如果过去 8 小时内有任何一次成功的 Check，或者最后一次心跳在 8 小时内，视为“今日在线”
  // 这是一种宽容算法，让免费用户感觉自己“还活着”，但无法进行实时交互
  
  const EIGHT_HOURS = 8 * 60 * 60 * 1000;
  
  // 1. 如果最近 8 小时内有心跳，直接算在线
  if (now - last < EIGHT_HOURS) {
    return 'ONLINE';
  }

  // 2. 如果今天的三次系统抽查中，有任意一次是 ALIVE，也算在线 (缓存效应)
  const hasAliveCheckToday = dailyChecks.some(check => check.status === 'ALIVE');
  
  return hasAliveCheckToday ? 'ONLINE' : 'OFFLINE';
}

/**
 * 获取下一次检测时间 (用于 UI 提示)
 */
export function getNextCheckTime(): string {
  // 假设检测点是 8, 16, 24
  const now = new Date();
  const hour = now.getHours();
  
  if (hour < 8) return "08:00 UTC";
  if (hour < 16) return "16:00 UTC";
  return "00:00 UTC";
}