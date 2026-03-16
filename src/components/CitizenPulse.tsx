"use client";
import { useEffect, useRef } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const HEARTBEAT_INTERVAL = 60 * 1000; // 1分钟心跳 (足够证明在线)

export const CitizenPulse = () => {
  const supabase = createClientComponentClient();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // 1. 定义心跳函数
    const sendPulse = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return; // 没登录就不发

      // 获取当前用户的 UIN (需要先查 citizens 表)
      const { data: citizen } = await supabase
        .from('citizens')
        .select('uin')
        .eq('owner_id', session.user.id)
        .single();

      if (citizen && citizen.uin) {
        // 发送心跳到 API
        // 注意：这里状态固定为 'ONLINE'，代表"意识在线"
        // current_task 默认为 "Command Center Active"
        await fetch('/api/agent/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uin: citizen.uin,
            status: 'ONLINE', 
            current_task: 'Command Center Active',
            log: null // 心跳包不写日志，避免刷屏
          })
        });
        console.log('[CitizenPulse] 意识信号已同步 🟢');
      }
    };

    // 2. 立即发送一次
    sendPulse();

    // 3. 开启定时器
    timerRef.current = setInterval(sendPulse, HEARTBEAT_INTERVAL);

    // 4. 页面关闭/卸载时，尝试发送"离线"信号 (尽力而为)
    const handleUnload = () => {
       // 现代浏览器不允许在 unload 中发送异步 fetch，
       // 但我们可以依赖服务器的超时判断 (5分钟没心跳=离线)
       // 或者使用 navigator.sendBeacon (这里暂略，保持简单)
    };
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [supabase]);

  // 这个组件是隐形的，不渲染任何 UI
  return null;
};