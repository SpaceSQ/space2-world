import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { generateSUNSAddress } from './suns-v2.1';

const supabase = createClientComponentClient();

// 1. 检查是否已存在公民
export const checkExistingCitizenship = async (userId: string) => {
  const { data, error } = await supabase
    .from('citizens')
    .select('*')
    .eq('owner_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
};

// 2. 注册新公民
export const registerCitizen = async (formData: {
  owner_id: string;
  email: string;
  name: string;      
  birthdate: string; 
  uin: string;       
  l1: string;
  l2: string;
  city: string;
  handle: string;
}) => {
  // 生成/校验 SUNS 地址
  const sunsResult = generateSUNSAddress({
    l1: formData.l1,
    l2: formData.l2,
    city: formData.city,
    handle: formData.handle
  });

  if ('error' in sunsResult) throw new Error(sunsResult.error);

  // 写入数据库
  const { data, error } = await supabase
    .from('citizens')
    .insert({
      owner_id: formData.owner_id,
      name: formData.name, 
      category: 'DIGITAL_HUMAN',
      suns_address: sunsResult.address,
      uin: formData.uin, 
      stats: { 
        birthdate: formData.birthdate,
        energy: 100, intel: 90, logic: 90, speed: 80, stability: 100
      },
      neural_ports: [] 
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// 3. 获取公民档案
export const getCitizenProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('citizens')
    .select('*')
    .eq('owner_id', userId)
    .single();
  
  if (error) return null;
  return data;
};

// 4. 创建硅基智能 (Agent)
export const createAgent = async (agentData: {
  owner_uin: string;
  name: string;
  role: string;
  personality: any;
  visual_model: string;
  uin: string; 
}) => {
  const { data, error } = await supabase
    .from('agents')
    .insert({
      owner_uin: agentData.owner_uin,
      name: agentData.name,
      role: agentData.role,
      personality: agentData.personality,
      visual_model: agentData.visual_model,
      uin: agentData.uin,
      status: 'IDLE' // 默认待机
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// 5. 🔥 切换 Agent 状态 (就是缺了这个！)
export const toggleAgentStatus = async (agentId: string, currentStatus: string) => {
  // 简单的状态切换逻辑：IDLE <-> WORKING
  // 如果是其他状态(如 LEARNING)，也重置为 IDLE
  const newStatus = currentStatus === 'IDLE' ? 'WORKING' : 'IDLE';
  
  const { data, error } = await supabase
    .from('agents')
    .update({ status: newStatus })
    .eq('id', agentId)
    .select()
    .single();

  if (error) throw error;
  return data;
};
// 6. 🔥 更新 Agent 信息 (改名、改角色)
export const updateAgent = async (agentId: string, updates: { name?: string; role?: string }) => {
  const { data, error } = await supabase
    .from('agents')
    .update(updates)
    .eq('id', agentId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// 7. 🔥 销毁 Agent (删除)
export const deleteAgent = async (agentId: string) => {
  const { error } = await supabase
    .from('agents')
    .delete()
    .eq('id', agentId);

  if (error) throw error;
  return true;
};