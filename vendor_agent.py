import requests
import time
import datetime
import sys
import random

# ==========================================
# 👔 第三方服务商配置 (Vendor Config)
# ==========================================
API_ENDPOINT = "http://localhost:3000/api/agent/sync"
AGENT_ID = "V-ROYAL-BUTLER-888"  # 必须与 SQL 里注册的一致

class RoyalButler:
    def __init__(self, uin):
        self.uin = uin
        print(f"--- 初始化第三方服务: {uin} ---")
        print("--- 模式: 包月订阅 (预约制服务) ---")

    def _sync(self, status, task, log=None):
        try:
            payload = {
                "uin": self.uin,
                "status": status,
                "current_task": task,
                "log": log
            }
            requests.post(API_ENDPOINT, json=payload, timeout=10)
            t = datetime.datetime.now().strftime('%H:%M:%S')
            print(f"[{t}] 📡 状态同步: [{status}] {task}")
        except Exception as e:
            print(f"⚠️ 连接失败: {e}")

    def serve_customer(self):
        """模拟一次完整的上门服务流程"""
        
        # 1. 收到订单，上线 (Online)
        print("\n🔔 收到客户呼叫，正在接入网络...")
        self._sync("IDLE", "System Activated: Order Received", "Vendor online.")
        time.sleep(5) # 模拟准备时间

        # 2. 上门取件 (Working)
        print("🚚 正在前往客户地址取衣...")
        self._sync("WORKING", "Logistics: Picking up laundry", "Coordinates: Sector 7, Block B.")
        time.sleep(10) # 模拟路程

        # 3. 洗护处理 (Working)
        print("洗衣中...")
        tasks = ["Dry Cleaning Suits", "Steam Pressing", "Packaging"]
        for task in tasks:
            self._sync("WORKING", f"Processing: {task}", f"Status: {task} in progress.")
            time.sleep(5)

        # 4. 送回 (Working)
        print("🚚 正在配送...")
        self._sync("WORKING", "Logistics: Delivering to Doorstep", "Delivery drone dispatched.")
        time.sleep(8)

        # 5. 完成并离线 (Offline)
        print("✅ 服务完成，断开连接节省算力...")
        self._sync("IDLE", "Service Completed", "Transaction signed on chain.")
        time.sleep(3)
        self._sync("OFFLINE", "Disconnected", "Agent going dark.")

if __name__ == "__main__":
    butler = RoyalButler(AGENT_ID)
    
    print(f">> 皇家管家 {AGENT_ID} 后台待命中...")
    print(">> 模拟场景：只有在有任务时才会上线，平时保持离线")

    try:
        while True:
            # 模拟：大部分时间是离线的
            # 为了演示，我们让它每隔 30秒 就“醒来”服务一次
            # 真实场景可能是每隔 24小时
            input("\n按回车键 (Enter) 模拟一次【上门取送服务】... (Ctrl+C 退出)")
            
            butler.serve_customer()
            
            print("\n💤 服务结束，管家已离线。等待下一次召唤...")

    except KeyboardInterrupt:
        print("\n程序退出")