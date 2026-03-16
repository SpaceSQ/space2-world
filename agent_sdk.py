import requests
import time
import datetime
import sys

# ==========================================
# ⚙️ 智能体配置 (Worker Config)
# ==========================================
API_ENDPOINT = "http://localhost:3000/api/agent/sync"
HEARTBEAT_INTERVAL = 300  # 5分钟心跳
AGENT_ID = "V-WASH-001"   # 🔥 你的打工仔 ID

class WeatherAgent:
    def __init__(self, uin):
        self.uin = uin
        self.status = "OFFLINE"
        print(f"--- 启动智能体: {uin} ---")

    def _get_weather(self):
        """调用真实天气接口 (上海坐标)"""
        try:
            # 使用 Open-Meteo 免费接口
            url = "https://api.open-meteo.com/v1/forecast?latitude=31.2304&longitude=121.4737&current=weather_code,temperature_2m"
            res = requests.get(url, timeout=5).json()
            code = res['current']['weather_code']
            temp = res['current']['temperature_2m']
            
            # 简单的天气判断
            # 0,1 = 晴天; >50 = 雨天
            if code <= 1:
                return "SUNNY", temp
            elif code >= 50:
                return "RAINY", temp
            else:
                return "CLOUDY", temp
        except Exception as e:
            print(f"⚠️ 天气获取失败: {e}")
            return "UNKNOWN", 0

    def _sync(self, status, task, log=None):
        """上报状态"""
        try:
            payload = {
                "uin": self.uin,
                "status": status,
                "current_task": task,
                "log": log
            }
            requests.post(API_ENDPOINT, json=payload, timeout=10)
            timestamp = datetime.datetime.now().strftime('%H:%M:%S')
            print(f"[{timestamp}] 📡 状态同步: [{status}] {task}")
        except Exception as e:
            print(f"⚠️ 连接服务器失败: {e}")

    def work_cycle(self):
        """执行一次业务循环"""
        print("\n🔍 正在感知环境数据...")
        weather, temp = self._get_weather()
        
        task_desc = ""
        new_status = "IDLE"
        log_msg = f"Detected: {weather}, {temp}°C"

        if weather == "SUNNY":
            new_status = "WORKING" # 晴天干活
            task_desc = "Operation: Washing Clothes ☀️"
            print(f"  > 天气晴朗 ({temp}°C)，开始洗衣任务。")
        elif weather == "RAINY":
            new_status = "IDLE"    # 雨天待机
            task_desc = "Standby: Raining 🌧️"
            print(f"  > 正在下雨 ({temp}°C)，暂停工作。")
        else:
            new_status = "IDLE"    # 阴天待机/烘干
            task_desc = "Standby: Cloudy ☁️"
            print(f"  > 多云阴天 ({temp}°C)，保持待命。")

        # 上报心跳
        self._sync(status=new_status, task=task_desc, log=log_msg)

if __name__ == "__main__":
    bot = WeatherAgent(AGENT_ID)
    
    # 1. 上线问候
    bot._sync(status="IDLE", task="System Booting...", log="Agent V-WASH-001 Online.")
    
    print(f">> 智能体已就绪。心跳间隔: {HEARTBEAT_INTERVAL}秒")
    print(">> 按 Ctrl+C 停止运行")

    try:
        while True:
            # 执行业务
            bot.work_cycle()
            
            # 休眠
            # 为了演示效果，你可以把这个 sleep 改短一点(比如 10秒) 看看效果
            # 但正式版请保持 HEARTBEAT_INTERVAL
            time.sleep(HEARTBEAT_INTERVAL)

    except KeyboardInterrupt:
        bot._sync(status="OFFLINE", task="Shutting Down", log="Manual Stop.")
        print("\n>> 智能体已下线")