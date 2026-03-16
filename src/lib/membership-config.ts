// src/lib/membership-config.ts

export type MembershipTier = 'FREE' | 'VIP' | 'SVIP' | 'BANNED';

export const MEMBERSHIP_TIERS = {
    FREE: { maxAgents: 1 },    // 免费体验：1 只小龙虾
    VIP: { maxAgents: 8 },     // VIP：解锁 1 个完整房间，8 只小龙虾
    SVIP: { maxAgents: 100 }   // SVIP：解锁 13 个房间，100 只小龙虾
};
export const checkLimit = (tier: string, currentCount: number, type: 'ROOM' | 'AGENT') => {
  const config = MEMBERSHIP_TIERS[tier as keyof typeof MEMBERSHIP_TIERS] || MEMBERSHIP_TIERS.FREE;
  const limit = type === 'ROOM' ? config.maxRooms : config.maxAgents;
  return currentCount < limit;
};