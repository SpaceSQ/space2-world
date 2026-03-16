"use client";
import React, { useState, useEffect } from 'react';
import { ServiceConfig, ChatMessage } from '@/types/business-schema';

interface ServiceChatProps {
  target: any; // 当前对话对象 (Human/Agent)
  targetType: 'HUMAN' | 'AGENT';
  visitorUin: string;
  onClose: () => void; // 结束对话，返回列表模式
  onEscalate: () => void; // 转人工
}

export const ServiceChatPanel = ({ target, targetType, visitorUin, onClose, onEscalate }: ServiceChatProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  
  // 模拟：加载服务配置 (未来从数据库读取)
  const serviceConfig: ServiceConfig = {
    title: targetType === 'AGENT' ? `${target.role} Consultation` : "Master Override",
    description: targetType === 'AGENT' ? `Professional ${target.role.toLowerCase()} services. Strictly limited to domain expertise.` : "Full authority decision making.",
    price: targetType === 'AGENT' ? 50 : 500,
    currency: 'S2COIN',
    delivery_time: 'Instant',
    contract_template: 'STD-V1'
  };

  // 初始欢迎语
  useEffect(() => {
    setMessages([
      { 
        id: 'sys-1', sender_uin: 'SYSTEM', timestamp: new Date().toISOString(), 
        content: `CONNECTED TO ZONE-${target.id || 'HOST'}. SESSION RECORDED.` 
      },
      {
        id: 'msg-1', sender_uin: target.uin, timestamp: new Date().toISOString(),
        content: targetType === 'AGENT' 
           ? `Greetings. I am ${target.name}. My services include ${serviceConfig.title}. Price: ${serviceConfig.price} ${serviceConfig.currency}. How may I assist?`
           : `This is the Commander. What do you need?`
      }
    ]);
  }, [target.uin]);

  const handleSend = () => {
    if (!input.trim()) return;
    
    // 添加用户消息
    const newMsg: ChatMessage = {
       id: Date.now().toString(), sender_uin: visitorUin, content: input, timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, newMsg]);
    setInput('');

    // 模拟回复逻辑
    setTimeout(() => {
       // 简单的关键词拦截逻辑
       const isChitchat = /hello|hi|weather|love|joke/i.test(newMsg.content);
       
       if (isChitchat && targetType === 'AGENT') {
          // 🚫 Agent 拒绝闲聊
          setMessages(prev => [...prev, {
             id: Date.now() + 'r', sender_uin: target.uin, timestamp: new Date().toISOString(),
             content: `[AUTO-REPLY] Request out of scope. I am a functional entity, not a conversationalist. Please inquire about ${target.role} services only.`,
             is_system_msg: true
          }]);
       } else {
          // 正常回复
          setMessages(prev => [...prev, {
             id: Date.now() + 'r', sender_uin: target.uin, timestamp: new Date().toISOString(),
             content: `Acknowledged. Regarding "${newMsg.content}": We can proceed with a smart contract for this service.`
          }]);
       }
    }, 1000);
  };

  return (
    <div className="h-[400px] flex flex-col md:flex-row bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-10">
       
       {/* 左侧：服务橱窗 (Product Showcase) */}
       <div className="w-full md:w-1/3 bg-black border-r border-zinc-800 p-6 flex flex-col">
          <div className="flex items-center gap-3 mb-6 border-b border-zinc-800 pb-4">
             <div className="text-3xl">{targetType === 'AGENT' ? '🤖' : '👤'}</div>
             <div>
                <h3 className="text-white font-bold">{target.name}</h3>
                <div className="text-[10px] text-emerald-500 font-mono border border-emerald-900 bg-emerald-950/30 px-1 rounded inline-block">
                   {targetType === 'AGENT' ? 'AUTHORIZED AI' : 'CITIZEN'}
                </div>
             </div>
          </div>

          <div className="flex-1 space-y-4">
             <div>
                <label className="text-[9px] text-zinc-500 uppercase font-bold">Service Capability</label>
                <div className="text-sm text-zinc-300 font-bold">{serviceConfig.title}</div>
             </div>
             <div>
                <label className="text-[9px] text-zinc-500 uppercase font-bold">Pricing Model</label>
                <div className="text-xl text-yellow-500 font-mono font-black">
                   {serviceConfig.price} <span className="text-xs text-yellow-700">{serviceConfig.currency}</span>
                </div>
             </div>
             <div className="bg-zinc-900 p-3 rounded border border-zinc-800">
                <p className="text-[10px] text-zinc-400 italic">"{serviceConfig.description}"</p>
             </div>
          </div>

          {/* 底部操作区 */}
          <div className="mt-6 space-y-2">
             <button className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded uppercase tracking-widest">
                Sign Smart Contract
             </button>
             {targetType === 'AGENT' && (
                <button onClick={onEscalate} className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white text-[10px] font-bold rounded uppercase border border-zinc-700">
                   Escalate to Human
                </button>
             )}
             <button onClick={onClose} className="w-full py-2 text-red-500 hover:text-red-400 text-[10px] font-bold uppercase">
                Leave Room
             </button>
          </div>
       </div>

       {/* 右侧：留言板 (Message Board) */}
       <div className="flex-1 flex flex-col bg-zinc-950 relative">
          {/* Header */}
          <div className="p-3 border-b border-zinc-800 bg-zinc-900/50 flex justify-between items-center">
             <div className="text-[10px] text-zinc-500 font-mono">SECURE CHANNEL /// ENCRYPTED</div>
             <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                <span className="text-[10px] text-emerald-500 font-bold">ONLINE</span>
             </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
             {messages.map(msg => {
                const isMe = msg.sender_uin === visitorUin;
                const isSys = msg.sender_uin === 'SYSTEM';
                return (
                   <div key={msg.id} className={`flex ${isSys ? 'justify-center' : isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-lg p-3 text-xs leading-relaxed
                         ${isSys ? 'bg-transparent text-zinc-600 font-mono text-[9px] border border-zinc-800' : 
                           isMe ? 'bg-blue-900/30 text-blue-100 border border-blue-800' : 
                           msg.is_system_msg ? 'bg-red-900/20 text-red-300 border border-red-900/50' : 'bg-zinc-800 text-zinc-300 border border-zinc-700'}
                      `}>
                         {!isSys && !isMe && <div className="text-[8px] text-zinc-500 mb-1 font-bold">{target.name}</div>}
                         {msg.content}
                         {!isSys && <div className="text-[8px] opacity-30 mt-1 text-right">{new Date(msg.timestamp).toLocaleTimeString([],{hour12:false})}</div>}
                      </div>
                   </div>
                )
             })}
          </div>

          {/* Input Area */}
          <div className="p-4 bg-zinc-900 border-t border-zinc-800">
             <div className="flex gap-2">
                <input 
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder="Type inquiry here (No images/attachments)..."
                  className="flex-1 bg-black border border-zinc-700 rounded p-3 text-white text-xs focus:border-emerald-500 outline-none font-mono"
                />
                <button onClick={handleSend} className="bg-white text-black font-bold px-6 rounded text-xs hover:bg-zinc-200">
                   SEND
                </button>
             </div>
             <p className="text-[8px] text-zinc-600 mt-2 text-center">
                * All conversations are archived for quality assurance. Attachments are disabled by protocol.
             </p>
          </div>
       </div>
    </div>
  );
};