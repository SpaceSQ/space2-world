"use client";
import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// --- 类型定义 ---

interface GeneCapsule {
  id: string;
  name: string;
  type: 'STRATEGY' | 'MEMORY' | 'SKILL';
  confidence: number;
  calls: number;
}

interface AgentDashboardProps {
    agentId: string; // 当前管理的 Agent 数据库 ID
    agentName: string;
}

// --- 模拟数据源 (Mock EvoMap Network) ---
const MOCK_EVO_DB: Record<string, GeneCapsule> = {
    'EVO-ALPHA-01': { id: 'EVO-ALPHA-01', name: 'Low-Risk Arbitrage v3', type: 'STRATEGY', confidence: 98.5, calls: 34210 },
    'EVO-BETA-09': { id: 'EVO-BETA-09', name: 'Natural Language Empathy', type: 'SKILL', confidence: 89.2, calls: 5120 },
    'EVO-OMEGA-X': { id: 'EVO-OMEGA-X', name: 'Global Market History 2025', type: 'MEMORY', confidence: 99.9, calls: 1200 },
    'EVO-VOID-00': { id: 'EVO-VOID-00', name: 'Anti-Virus Protocol', type: 'SKILL', confidence: 95.0, calls: 880 }
};

const MOUNT_COST = 5.0; // 挂载一个基因消耗 5.0 S2C

export const AgentDashboard = ({ agentId, agentName }: AgentDashboardProps) => {
    const supabase = createClientComponentClient();
    const [loading, setLoading] = useState(false);
    
    // 核心状态
    const [myGenes, setMyGenes] = useState<GeneCapsule[]>([]);
    const [evoScore, setEvoScore] = useState(0);
    const [balance, setBalance] = useState(0); // 钱包余额
    
    // 输入框状态
    const [inputId, setInputId] = useState('');

    // 1. 初始化：拉取 Agent 的基因、积分和余额
    useEffect(() => {
        const fetchAgentData = async () => {
            const { data, error } = await supabase
                .from('agents')
                .select('evo_genes, evo_score, wallet_balance')
                .eq('id', agentId)
                .single();
            
            if (data) {
                // 确保 evo_genes 是数组
                const genes = Array.isArray(data.evo_genes) ? data.evo_genes : [];
                setMyGenes(genes);
                setEvoScore(data.evo_score || 0);
                setBalance(data.wallet_balance || 0);
            }
        };
        fetchAgentData();
    }, [agentId, supabase]);

    // 2. 核心动作：挂载基因 (Mount)
    const handleMountGene = async () => {
        if (!inputId) return;
        
        // A. 余额检查 (S2-402 Protocol)
        if (balance < MOUNT_COST) {
            alert(`⚠️ INSUFFICIENT FUNDS (HTTP 402)\nRequired: ${MOUNT_COST} S2C\nCurrent: ${balance.toFixed(2)} S2C\n\nPlease recharge your agent to continue evolution.`);
            return;
        }

        setLoading(true);

        try {
            // B. 模拟 EvoMap 网络查询延迟
            await new Promise(r => setTimeout(r, 800));
            
            const capsule = MOCK_EVO_DB[inputId.toUpperCase()];

            // C. 校验基因有效性
            if (!capsule) {
                alert("❌ EvoMap Network Error: Capsule ID Not Found or Low Confidence.");
                setLoading(false);
                return;
            }

            // D. 检查是否重复挂载
            if (myGenes.find(g => g.id === capsule.id)) {
                alert("⚠️ Capsule already mounted on this neural network.");
                setLoading(false);
                return;
            }

            // E. 执行挂载 (本地状态更新)
            const newGenes = [...myGenes, capsule];
            // 积分算法：每挂载一个基因，分数增加 (模拟)
            const newScore = evoScore + (capsule.confidence / 10);
            // 扣费
            const newBalance = balance - MOUNT_COST;

            setMyGenes(newGenes);
            setEvoScore(newScore);
            setBalance(newBalance);
            setInputId('');

            // F. 数据库原子更新 (保存基因 + 扣费)
            const { error } = await supabase
                .from('agents')
                .update({ 
                    evo_genes: newGenes,
                    evo_score: newScore,
                    wallet_balance: newBalance
                })
                .eq('id', agentId);

            if (error) throw error;
            
            // G. (可选) 写入交易流水 - 如果你已经建了 s2_ledger 表
            await supabase.from('s2_ledger').insert({
                sender_uin: agentName, // 这里暂用 Name/ID 代替 UIN，实际应传 UIN
                receiver_uin: 'SYSTEM',
                amount: MOUNT_COST,
                tx_type: 'GENE_MOUNT_FEE',
                meta_data: { gene_id: capsule.id }
            });
            
            alert(`✅ Successfully Mounted: ${capsule.name}\nFee Deducted: -${MOUNT_COST} S2C`);

        } catch (err: any) {
            console.error(err);
            alert("System Error: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    // 3. 卸载基因 (不退费)
    const handleUnmount = async (targetId: string) => {
        if(!confirm("Unmounting this gene will reduce capabilities. Confirm?")) return;

        const newGenes = myGenes.filter(g => g.id !== targetId);
        setMyGenes(newGenes);
        
        await supabase
            .from('agents')
            .update({ evo_genes: newGenes })
            .eq('id', agentId);
    };

    return (
        <div className="w-full bg-[#0d1117] border border-zinc-800 rounded-xl overflow-hidden p-6 shadow-xl">
            
            {/* Header: 状态面板 */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b border-zinc-800 pb-4 gap-4">
                <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        🧬 Gene Sequence Manager
                        <span className="text-xs bg-purple-900/30 text-purple-400 px-2 py-1 rounded border border-purple-800">
                            EvoMap Linked
                        </span>
                    </h2>
                    <p className="text-xs text-zinc-500 mt-1">
                        Mount specialized capabilities via EvoMap Protocol.
                    </p>
                </div>
                
                <div className="flex gap-6 text-right self-end md:self-auto">
                    {/* 🔥 代谢/钱包状态 */}
                    <div>
                        <div className="text-[10px] text-zinc-500 uppercase flex items-center justify-end gap-1">
                            METABOLISM (S2C)
                            <span className={`w-2 h-2 rounded-full ${balance > 20 ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`}></span>
                        </div>
                        <div className={`text-2xl font-mono font-bold ${balance < MOUNT_COST ? 'text-red-500' : 'text-emerald-400'}`}>
                            ${balance.toFixed(2)}
                        </div>
                        <div className="text-[9px] text-zinc-600">
                            Cost/Mount: -${MOUNT_COST}
                        </div>
                    </div>

                    <div>
                        <div className="text-[10px] text-zinc-500 uppercase">Evolution Score</div>
                        <div className="text-2xl font-mono font-bold text-purple-400">{evoScore.toFixed(1)}</div>
                    </div>
                </div>
            </div>

            {/* Input Area: 挂载操作区 */}
            <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800 mb-6">
                <label className="text-xs font-bold text-zinc-400 uppercase mb-2 block flex justify-between">
                    <span>Mount New Capsule via ID</span>
                    <span className="text-zinc-600 font-mono">GAS FEE: {MOUNT_COST} S2C</span>
                </label>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={inputId}
                        onChange={e => setInputId(e.target.value)}
                        placeholder="e.g. EVO-ALPHA-01"
                        className="flex-1 bg-black border border-zinc-700 rounded p-3 text-white font-mono placeholder:text-zinc-700 focus:border-purple-500 outline-none transition-colors"
                    />
                    <button 
                        onClick={handleMountGene}
                        disabled={loading || !inputId}
                        className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-6 rounded transition-colors disabled:opacity-50 flex items-center gap-2 disabled:cursor-not-allowed"
                    >
                        {loading ? 'SYNCING...' : 'MOUNT'}
                    </button>
                </div>
                <div className="mt-2 text-[10px] text-zinc-600">
                    * Available Test IDs: <span className="text-zinc-500 select-all cursor-pointer hover:text-zinc-300">EVO-ALPHA-01</span>, <span className="text-zinc-500 select-all cursor-pointer hover:text-zinc-300">EVO-BETA-09</span>, <span className="text-zinc-500 select-all cursor-pointer hover:text-zinc-300">EVO-OMEGA-X</span>
                </div>
            </div>

            {/* Gene List: 已挂载列表 */}
            <div className="space-y-3">
                {myGenes.length === 0 ? (
                    <div className="text-center py-8 text-zinc-600 border border-dashed border-zinc-800 rounded-lg bg-zinc-900/20">
                        No Gene Capsules mounted yet.
                    </div>
                ) : (
                    myGenes.map((gene) => (
                        <div key={gene.id} className="bg-black border border-zinc-800 hover:border-purple-500/30 p-4 rounded-lg flex items-center justify-between group transition-all">
                            <div className="flex items-center gap-4">
                                <div className={`w-2 h-12 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)] ${
                                    gene.type === 'STRATEGY' ? 'bg-blue-500 shadow-blue-500/20' : 
                                    gene.type === 'MEMORY' ? 'bg-yellow-500 shadow-yellow-500/20' : 'bg-emerald-500 shadow-emerald-500/20'
                                }`}></div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-white font-bold tracking-tight">{gene.name}</h4>
                                        <span className="text-[9px] bg-zinc-900 text-zinc-500 px-1.5 rounded border border-zinc-800">{gene.type}</span>
                                    </div>
                                    <div className="text-xs text-zinc-500 font-mono mt-0.5 opacity-70">ID: {gene.id}</div>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-6">
                                <div className="text-right">
                                    <div className="text-[10px] text-zinc-600">CONFIDENCE</div>
                                    <div className="text-sm font-mono text-purple-400 font-bold">{gene.confidence}%</div>
                                </div>
                                <div className="text-right hidden sm:block">
                                    <div className="text-[10px] text-zinc-600">CALLS</div>
                                    <div className="text-sm font-mono text-zinc-400">{gene.calls.toLocaleString()}</div>
                                </div>
                                <button 
                                    onClick={() => handleUnmount(gene.id)}
                                    className="text-zinc-600 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Unmount (Destroy)"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};