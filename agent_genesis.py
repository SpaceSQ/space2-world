import requests
import time
import sys
import random
from datetime import datetime

# ================= 配置区 =================
# Space2.world 本地开发接口地址
API_URL = "http://localhost:3000/api/agent/sync"

# 终端颜色代码 (让控制台看起来更酷)
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def print_log(message, type="INFO"):
    timestamp = datetime.now().strftime("%H:%M:%S")
    if type == "INFO":
        print(f"[{timestamp}] {Colors.CYAN}ℹ {message}{Colors.ENDC}")
    elif type == "SUCCESS":
        print(f"[{timestamp}] {Colors.GREEN}✔ {message}{Colors.ENDC}")
    elif type == "WARN":
        print(f"[{timestamp}] {Colors.WARNING}⚠ {message}{Colors.ENDC}")
    elif type == "ERROR":
        print(f"[{timestamp}] {Colors.FAIL}✖ {message}{Colors.ENDC}")

def simulate_boot_sequence():
    """模拟启动自检过程"""
    print(f"\n{Colors.HEADER}=== SPACE2.WORLD AGENT KERNEL v1.0 ==={Colors.ENDC}")
    steps = [
        "Initializing Neural Networks...",
        "Loading Personality Matrices...",
        "Calibrating Quantum Sensors...",
        "Establishing Secure Uplink..."
    ]
    for step in steps:
        time.sleep(random.uniform(0.3, 0.8))
        print_log(step)
    print(f"{Colors.BOLD}----------------------------------------{Colors.ENDC}")

def send_heartbeat(uin, status, task, log_msg):
    """发送心跳包"""
    payload = {
        "uin": uin,
        "status": status,
        "current_task": task,
        "log": log_msg
    }
    try:
        response = requests.post(API_URL, json=payload, timeout=5)
        if response.status_code == 200:
            return True
        else:
            print_log(f"Server refused connection: {response.text}", "ERROR")
            return False
    except requests.exceptions.ConnectionError:
        print_log("Space2.world Server unreachable (Is localhost:3000 running?)", "ERROR")
        return False

# ================= 主程序 =================
if __name__ == "__main__":
    try:
        # 1. 获取基因锁
        print(f"{Colors.BOLD}请输入从孵化器获取的基因锁 (Gene Lock ID):{Colors.ENDC}")
        print(f"例如: {Colors.CYAN}V-LOG-123456{Colors.ENDC}")
        agent_uin = input("> ").strip()

        if not agent_uin:
            print_log("Gene Lock ID cannot be empty.", "ERROR")
            sys.exit(1)

        # 2. 启动模拟
        simulate_boot_sequence()

        # 3. 发送“初生脉冲” (Birth Pulse)
        print_log(f"Sending GENESIS PULSE for {agent_uin}...", "WARN")
        
        success = send_heartbeat(
            uin=agent_uin, 
            status="BOOTING", 
            task="GENESIS_HANDSHAKE", 
            log_msg="System Integrity Verified. Requesting Citizenship."
        )

        if success:
            print_log("Genesis Pulse Accepted! Life sequence initiated.", "SUCCESS")
            print_log("Keeping connection alive for stability...", "INFO")
            
            # 4. 保持心跳 (模拟存活状态)
            # 这会让前端不仅能检测到出生，还能看到它一直在线
            tasks = ["Scanning local environment", "Optimizing memory", "Awaiting user command", "Syncing with Origin Space"]
            
            while True:
                time.sleep(5) # 每5秒跳一次
                current_task = random.choice(tasks)
                send_heartbeat(agent_uin, "IDLE", current_task, f"Routine check: {current_task}")
                print_log(f"Heartbeat sent: {current_task}", "INFO")

        else:
            print_log("Genesis Failed. Please check your network or ID.", "ERROR")

    except KeyboardInterrupt:
        print(f"\n{Colors.WARNING}Agent process terminated manually.{Colors.ENDC}")