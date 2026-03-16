// src/lib/suns-v2.1.ts

interface SUNSParams {
  l1: string; // 域 (S2/MA/MO)
  l2: string; // 区 (00/RS/ON)
  city: string; // 城市 (L3)
  handle: string; // 个人标识 (L4)
}

interface SUNSResult {
  address: string;
  l3Code: string;
  l4Code: string;
}

export const generateSUNSAddress = (params: SUNSParams): SUNSResult | { error: string } => {
  // 1. 基础清洗
  const l1 = params.l1.toUpperCase();
  const l2 = params.l2.toUpperCase();
  const cityRaw = params.city.toUpperCase().replace(/[^A-Z0-9]/g, ''); 
  const handleRaw = params.handle.toUpperCase().replace(/[^A-Z0-9]/g, '');

  // 2. 长度校验
  if (!cityRaw || cityRaw.length < 2) return { error: 'City too short' };
  if (!handleRaw || handleRaw.length < 3) return { error: 'Handle too short' };

  // 3. 生成 L3 (城市) - 规则: 原名 + 3位数字分区码
  // 简单模拟：计算 hash 映射到 001-999
  let cityHash = 0;
  for (let i = 0; i < cityRaw.length; i++) cityHash += cityRaw.charCodeAt(i);
  const citySuffix = (cityHash % 999).toString().padStart(3, '0');
  const l3Full = `${cityRaw}${citySuffix}`; // e.g., SHANGHAI001 (长度11)

  // 4. 🔥 核心修正：生成 L4 校验位 (基于总长度的奇偶性)
  
  // 第一步：拼接前三段 + L4本体 (不含连字符，只算有效位)
  // 例如: MARS (4) + MMCITY467 (9) + MYHOME (6) = 19位
  const rawString = `${l1}${l2}${l3Full}${handleRaw}`;
  const currentLength = rawString.length;

  // 第二步：计算校验位
  // 目标：加上校验位后，总长度必须是偶数 (Even)
  // 如果 (当前长度 + 1) 是偶数，说明缺 1 位就是偶数，但这里校验位的值只是个标记
  // 按照你的例子：MARS-MMCITY467-MYHOME (19位) -> 加校验位后是 20位 (偶数) -> 取 0
  // 逻辑推导：
  // 目标总长 = currentLength + 1
  // 如果 目标总长 % 2 === 0 (偶数) -> Checksum = '0'
  // 如果 目标总长 % 2 !== 0 (奇数) -> Checksum = '1'
  
  const targetLength = currentLength + 1;
  const checksum = targetLength % 2 === 0 ? '0' : '1';

  // 组合 L4
  const l4Full = `${handleRaw}${checksum}`; // e.g., MYHOME0

  // 5. 格式化输出 (去掉第一个连字符)
  // 格式: MARS-SHANGHAI001-MYHOME0
  const address = `${l1}${l2}-${l3Full}-${l4Full}`;

  return {
    address,
    l3Code: l3Full,
    l4Code: l4Full
  };
};