// src/lib/id-generator.ts

/**
 * [绝密] Space² 身份系统核心校验算法 (S2-CheckSum) v2.2
 * 权重数组 (对应位 1-12 和 15-22 的逻辑位置)
 */
const WEIGHTS = [
  3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41,  // 对应前12位
  43, 47, 53, 59, 61, 67, 71, 73               // 对应后8位
];

/**
 * 核心校验算法：生成双位纯字母校验码
 */
export function generateS2CheckSum(part1: string, part2: string): string {
  const rawString = (part1 + part2).toUpperCase();
  if (rawString.length !== 20) {
      throw new Error(`S2CheckSum Error: Invalid input length. Expected 20 characters total.`);
  }

  let sum = 0;
  for (let i = 0; i < 20; i++) {
      const char = rawString[i];
      const value = parseInt(char, 36); 
      sum += (isNaN(value) ? 0 : value) * WEIGHTS[i];
  }

  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const index1 = sum % 26;                 
  const index2 = Math.floor(sum / 26) % 26; 

  return alphabet[index1] + alphabet[index2];
}

/**
 * 获取 6位 日期戳 (YYMMDD)
 */
export function getTodayDateCode(date?: Date): string {
  const d = date || new Date();
  const yy = d.getUTCFullYear().toString().slice(2);
  const mm = (d.getUTCMonth() + 1).toString().padStart(2, '0');
  const dd = d.getUTCDate().toString().padStart(2, '0');
  return `${yy}${mm}${dd}`; 
}

export function generateRandomSequence(): string {
  const chars = '0123456789'; 
  let seq = '';
  for (let i = 0; i < 8; i++) {
      seq += chars[Math.floor(Math.random() * chars.length)];
  }
  return seq;
}

export function formatCustomSequence(seq?: string): string | null {
  if (!seq) return null;
  const cleanSeq = seq.replace(/[^0-9]/g, '');
  if (cleanSeq.length === 0) return null;
  return cleanSeq.padStart(8, '0').slice(0, 8);
}

function extractL4Prefix(sunsAddress: string): string {
  const segments = sunsAddress.split('-');
  const l4Segment = segments.length >= 4 ? segments[3] : sunsAddress;
  return l4Segment.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().padEnd(5, '0').slice(0, 5);
}

// ============================================================================
// 三大物种 ID 生成器 
// ============================================================================

/**
 * 1. 🛡️ Class V: 原生孵化智能体 (Virtual Intelligence)
 */
export function generateSiliconID(sunsAddress: string, customSeq?: string, createdAt: Date = new Date()): string {
  const CLASS_CODE = 'V';
  const originCode = extractL4Prefix(sunsAddress);
  const dateCode = getTodayDateCode(createdAt);
  
  const sequenceCode = formatCustomSequence(customSeq) || generateRandomSequence();

  const part1 = `${CLASS_CODE}${originCode}${dateCode}`; 
  const part2 = sequenceCode; 
  const checkSum = generateS2CheckSum(part1, part2);

  return `${part1}${checkSum}${part2}`; 
}

/**
 * 2. 👑 Class D: 具身数字人身份编号 (Digital Human - 庄园主)
 */
export function generateDigitalHumanID(sunsAddress: string, customSeq?: string, createdAt: Date = new Date()): string {
  const CLASS_CODE = 'D';
  const originCode = extractL4Prefix(sunsAddress);
  const dateCode = getTodayDateCode(createdAt);
  
  const sequenceCode = formatCustomSequence(customSeq) || generateRandomSequence();

  const part1 = `${CLASS_CODE}${originCode}${dateCode}`; 
  const part2 = sequenceCode; 
  const checkSum = generateS2CheckSum(part1, part2);

  return `${part1}${checkSum}${part2}`; 
}

/**
 * 3. 🦞 Class I: 公共野生智能体 (Internet Citizen / Stray Crayfish)
 * 🔥 修复：摒弃原白皮书中的固定区域码 EA0001，与 D类/V类 统一采用 6位当天日期戳！
 */
export function generateFreeAgentID(customSeq?: string, createdAt: Date = new Date()): string {
  const CLASS_CODE = 'I';
  const originCode = 'DCARD'; // 5位属性码
  
  // 🔥 此处将原本写死的 'EA0001' 改为动态的时间戳 (例如：260311)
  const dateCode = getTodayDateCode(createdAt); // 6位时间戳
  
  const sequenceCode = formatCustomSequence(customSeq) || generateRandomSequence();

  const part1 = `${CLASS_CODE}${originCode}${dateCode}`; // 组合后为：IDCARD260311
  const part2 = sequenceCode; // 8位随机尾号
  const checkSum = generateS2CheckSum(part1, part2); // 生成防伪校验码

  return `${part1}${checkSum}${part2}`; // 最终组合 22 位
}