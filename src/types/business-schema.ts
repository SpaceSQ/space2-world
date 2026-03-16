// 定义服务商品的结构
export interface ServiceConfig {
  title: string;          // 服务名称 (e.g. "Python Debugging")
  description: string;    // 服务描述
  price: number;          // 价格
  currency: 'S2COIN';     // 货币单位
  delivery_time: string;  // 交付周期 (e.g. "24h")
  contract_template: string; // 智能合约模板ID
}

// 定义智能合约结构
export interface SmartContract {
  id: string;
  provider_uin: string;   // 卖方
  consumer_uin: string;   // 买方
  service_snapshot: ServiceConfig;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'DISPUTED';
  created_at: string;
  hash: string;           // 链上哈希
}

// 定义聊天消息结构
export interface ChatMessage {
  id: string;
  sender_uin: string;
  content: string;        // 纯文本
  timestamp: string;
  is_system_msg?: boolean; // 是否为系统提示(如: "超出服务范围")
}

// 🔥 核心：房间装修风格映射 (复用之前的 ID)
// 这些 CSS 类名对应 Tailwind 样式，决定了格子在平面图上的外观
export interface ServiceConfig {
  title: string; description: string; price: number; currency: 'S2COIN'; delivery_time: string; contract_template: string;
}
export interface SmartContract {
  id: string; provider_uin: string; consumer_uin: string; service_snapshot: ServiceConfig; status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'DISPUTED'; created_at: string; hash: string;
}
export interface ChatMessage {
  id: string; sender_uin: string; content: string; timestamp: string; is_system_msg?: boolean;
}

// 🔥 这里的 Key 必须和 AGIRoomGenerator 及 RoomInterior 完全一致 (建议全小写下划线)
export const STYLE_MAP: Record<string, string> = {
  'boss_desk': 'bg-slate-900 border-slate-700', 
  'talk_sofa': 'bg-[#2a1d15] border-orange-900',
  'zen_tea': 'bg-[#1c1917] border-stone-600',
  'big_bed': 'bg-indigo-950 border-indigo-900',
  'hot_spring': 'bg-cyan-950 border-cyan-800',
  'fit_gym': 'bg-zinc-900 border-red-900',
  'play_swing': 'bg-sky-950 border-sky-800',
  'play_seesaw': 'bg-amber-950 border-amber-800',
  'camp_fire': 'bg-[#0f0505] border-orange-600',
  'nature_lawn': 'bg-[#0a200a] border-emerald-800',
  'relax_beach': 'bg-[#2e2a10] border-yellow-800',
  'space_zero': 'bg-black border-white',
  'default': 'bg-zinc-950 border-zinc-800'
};