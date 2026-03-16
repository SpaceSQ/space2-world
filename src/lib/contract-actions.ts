"use server";
import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

/**
 * 1. 起草合约 (Draft)
 */
export async function draftContract(data: any) {
  const supabase = createServerActionClient({ cookies });
  
  // 生成唯一合约号 CTR-YYYYMMDD-Random
  const dateStr = new Date().toISOString().slice(0,10).replace(/-/g, '');
  const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
  const contractNo = `CTR-${dateStr}-${randomSuffix}`;

  const { error } = await supabase.from('smart_contracts').insert({
    contract_no: contractNo,
    provider_uin: data.providerUin,
    consumer_uin: data.consumerUin,
    title: data.title,
    service_type: data.serviceType,
    content_details: data.details,
    total_amount: parseFloat(data.amount),
    payment_method: data.paymentMethod,
    start_date: data.startDate,
    end_date: data.endDate,
    status: 'PENDING',
    // 发起方自动签名
    provider_signature: `SIG-${Date.now()}-${Math.random().toString(16).slice(2)}`, 
    consumer_signature: null // 等待对方签名
  });

  if (error) throw error;
  return { success: true, contractNo };
}

/**
 * 2. 签署合约 (Sign)
 */
export async function signContract(contractId: string, signerUin: string) {
  const supabase = createServerActionClient({ cookies });
  
  // 生成签名
  const signature = `SIG-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  
  const { error } = await supabase
    .from('smart_contracts')
    .update({ 
      status: 'ACTIVE', 
      consumer_signature: signature,
      updated_at: new Date()
    })
    .eq('id', contractId)
    .eq('consumer_uin', signerUin); // 确保是乙方在签

  if (error) throw error;
  return { success: true };
}

/**
 * 3. 获取统计数据 (Dashboard Stats)
 */
export async function getContractStats(timeRange: 'DAY' | 'MONTH' | 'YEAR' = 'MONTH') {
  const supabase = createServerActionClient({ cookies });
  
  // 简化的统计逻辑：获取所有 ACTIVE/COMPLETED 合约
  const { data } = await supabase
    .from('smart_contracts')
    .select('total_amount, created_at, service_type')
    .in('status', ['ACTIVE', 'COMPLETED'])
    .order('created_at', { ascending: true });

  if (!data) return { totalVol: 0, chartData: [] };

  // 计算总 GMV
  const totalVol = data.reduce((sum, item) => sum + Number(item.total_amount), 0);

  // 聚合图表数据 (这里简单按日期聚合)
  const chartMap: any = {};
  data.forEach(item => {
    const date = new Date(item.created_at).toLocaleDateString();
    if (!chartMap[date]) chartMap[date] = 0;
    chartMap[date] += Number(item.total_amount);
  });

  const chartData = Object.keys(chartMap).map(key => ({
    name: key,
    value: chartMap[key]
  }));

  return { totalVol, chartData, count: data.length };
}