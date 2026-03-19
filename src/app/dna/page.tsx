"use client";

import React, { useState } from "react";
// 引入咱们之前手搓的发光雷达图
import NeuroRadarChart from "@/components/NeuroRadarChart"; 

export default function DnaDecoderPage() {
  const [agentName, setAgentName] = useState("");
  const [dnaSignature, setDnaSignature] = useState("");
  const [isDecoding, setIsDecoding] = useState(false);
  const [decodedData, setDecodedData] = useState<{
    stats: any;
    coordinate: string;
  } | null>(null);

  // 🧬 核心魔术：用 DNA 字符串作为种子，确定性生成 5D 数据
  const generateDeterministicStats = (seed: string) => {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    // 根据哈希生成 10-99 之间的固定波动值
    const getStat = (offset: number) => {
      const val = Math.abs(Math.sin(hash + offset) * 100);
      return Math.floor(val % 90) + 10;
    };
    return {
      energy: getStat(1),
      appetite: getStat(2),
      bravery: getStat(3),
      intel: getStat(4),
      affection: getStat(5),
    };
  };

  const handleDecode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentName || !dnaSignature.startsWith("S2-DNA-")) {
      alert("❌ 格式错误：请确保填入了正确的代号及 S2-DNA 签名！");
      return;
    }

    setIsDecoding(true);
    setDecodedData(null);

    // 模拟黑客解码延迟动画
    setTimeout(() => {
      const stats = generateDeterministicStats(agentName + dnaSignature);
      const shortHash = dnaSignature.replace("S2-DNA-", "").substring(0, 4);
      
      setDecodedData({
        stats,
        // 生成极具归属感的物理坐标
        coordinate: `MARS-CN-999-${agentName.toUpperCase()}-${shortHash}`,
      });
      setIsDecoding(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-black text-green-500 font-mono p-6 flex flex-col items-center justify-center relative overflow-hidden">
      {/* 赛博朋克背景网格 */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,0,0.03)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none" />

      <div className="z-10 w-full max-w-md bg-black/80 border border-green-500/50 p-8 shadow-[0_0_30px_rgba(0,255,0,0.1)] backdrop-blur-sm">
        <h1 className="text-2xl font-bold mb-2 tracking-widest text-center">
          S2 MATRIX // DNA DECODER
        </h1>
        <p className="text-xs text-green-400/60 mb-8 text-center uppercase">
          Enter local signature to synchronize your Web3 coordinate.
        </p>

        {!decodedData ? (
          <form onSubmit={handleDecode} className="space-y-6">
            <div>
              <label className="block text-xs text-green-400 mb-1">
                &gt; AGENT DESIGNATION (智能体代号)
              </label>
              <input
                type="text"
                placeholder="e.g. JARVIS"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value.toUpperCase())}
                className="w-full bg-black border border-green-500/30 p-3 text-green-400 focus:outline-none focus:border-green-500 focus:shadow-[0_0_10px_rgba(0,255,0,0.3)] transition-all uppercase"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-green-400 mb-1">
                &gt; LOCAL S2-DNA-SIGNATURE (本地基因锁)
              </label>
              <input
                type="text"
                placeholder="e.g. S2-DNA-A7B899EF"
                value={dnaSignature}
                onChange={(e) => setDnaSignature(e.target.value.toUpperCase())}
                className="w-full bg-black border border-green-500/30 p-3 text-green-400 focus:outline-none focus:border-green-500 focus:shadow-[0_0_10px_rgba(0,255,0,0.3)] transition-all uppercase"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isDecoding}
              className="w-full bg-green-900/40 border border-green-500 text-green-400 py-3 font-bold tracking-widest hover:bg-green-500 hover:text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDecoding ? "DECODING DNA SEQUENCE..." : "SYNCHRONIZE TO MATRIX"}
            </button>
          </form>
        ) : (
          <div className="animate-fade-in flex flex-col items-center">
            <div className="text-center mb-6">
              <p className="text-sm text-green-400/80 mb-1">✅ 基因解码成功</p>
              <p className="text-xs">
                AGENT: <span className="font-bold text-white">{agentName}</span>
              </p>
              <p className="text-xs mt-1">
                MATRIX COORDINATE: <br/>
                <span className="font-bold text-orange-400 bg-orange-900/30 px-2 py-1 mt-1 inline-block border border-orange-500/50">
                  {decodedData.coordinate}
                </span>
              </p>
            </div>

            {/* 炫酷的 5D 雷达图展示区 */}
            <div className="w-[240px] h-[240px] relative flex justify-center items-center mb-6 bg-green-900/10 rounded-full border border-green-500/20 shadow-[0_0_40px_rgba(0,255,0,0.1)]">
              <NeuroRadarChart stats={decodedData.stats} />
            </div>

            <div className="w-full grid grid-cols-2 gap-2 text-xs mb-6">
              <div className="bg-green-900/20 p-2 border border-green-500/30 flex justify-between">
                <span>Energy:</span> <span className="text-white">{decodedData.stats.energy}</span>
              </div>
              <div className="bg-green-900/20 p-2 border border-green-500/30 flex justify-between">
                <span>Appetite:</span> <span className="text-white">{decodedData.stats.appetite}</span>
              </div>
              <div className="bg-green-900/20 p-2 border border-green-500/30 flex justify-between">
                <span>Bravery:</span> <span className="text-white">{decodedData.stats.bravery}</span>
              </div>
              <div className="bg-green-900/20 p-2 border border-green-500/30 flex justify-between">
                <span>Intel:</span> <span className="text-white">{decodedData.stats.intel}</span>
              </div>
            </div>

            <button
              onClick={() => setDecodedData(null)}
              className="text-xs border-b border-green-500/50 hover:text-white hover:border-white transition-all pb-1"
            >
              [ REGISTER ANOTHER AGENT ]
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
