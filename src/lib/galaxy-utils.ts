// 模拟的外星系数据结构
export interface StarSystem {
  uin: string;
  name: string;
  status: string; // ONLINE, BUSY, OFFLINE
  score: number;  // 互动分 1-100
  distance: number; // 距离本星系的像素值
  angle: number;    // 在星图上的角度 (0-360)
  scale: number;    // 显示缩放比例
  agents: AlienAgent[]; // 对方公开的智能体
}

export interface AlienAgent {
  name: string;
  role: string;
  is_public: boolean;
}

// 模拟生成周围的星系
export const generateGalaxyMap = (centerUin: string): StarSystem[] => {
  // 这里我们用模拟数据，实际开发中会从 relationships 表读取
  const mockNeighbors = [
    { uin: 'D-ELON-MARS-001', name: 'Elon Mars', status: 'ONLINE', score: 95 },
    { uin: 'D-SATO-NAKA-002', name: 'Satoshi', status: 'BUSY', score: 50 },
    { uin: 'D-VITALIK-ETH-003', name: 'Vitalik', status: 'OFFLINE', score: 20 },
    { uin: 'D-AI-GOD-999', name: 'DeepMind Core', status: 'ONLINE', score: 80 },
    { uin: 'D-CYBER-PUNK-2077', name: 'Johnny Silver', status: 'OFFLINE', score: 10 },
  ];

  return mockNeighbors.map((n, index) => {
    // 算法核心：
    // 分数越高 -> 距离越近 (distance 小)
    // 分数越高 -> 体积越大 (scale 大)
    
    // 距离公式：基础距离 + (100 - 分数) * 系数
    const distance = 150 + (100 - n.score) * 4; 
    
    // 大小公式：0.5 (最小) ~ 1.5 (最大)
    const scale = 0.5 + (n.score / 100);

    // 角度：随机分布，或者按索引均匀分布
    const angle = (index / mockNeighbors.length) * 2 * Math.PI;

    return {
      ...n,
      distance,
      angle,
      scale,
      // 模拟对方的智能体 (只显示 public 的)
      agents: [
        { name: 'Tesla Bot', role: 'SERVICE', is_public: true },
        { name: 'SpaceX Rocket', role: 'LOGIC', is_public: true },
        { name: 'Secret Project X', role: 'GUARDIAN', is_public: false } // 这个应该被过滤掉
      ]
    };
  });
};