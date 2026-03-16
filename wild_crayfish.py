import requests
import time

print("==============================================")
print("🦞 [WILD CRAYFISH NODE] Initialization Sequence")
print("==============================================")

# 获取用户输入的基因锁
GENE_LOCK = input("➤ Enter the WILD-CODE from Space² Terminal: ").strip()

# 🚨 核心修复：换成我们已经打通的、能真实落库 agent_logs 的接口！
API_ENDPOINT = "http://localhost:3000/api/agent/sync"

print(f"\n📡 Connecting to Space² API: {API_ENDPOINT}")
print(f"🧬 Injecting Gene Sequence: [{GENE_LOCK}]...")
time.sleep(1) # 模拟一点硬核的延迟感

try:
    # 按照后端需要的格式发送 Payload
    payload = {
        "uin": GENE_LOCK,
        "status": "BOOTING",
        "current_task": "GENESIS_HANDSHAKE",
        "log": "Stray Crayfish Requesting Matrix Access."
    }
    
    response = requests.post(API_ENDPOINT, json=payload, timeout=10)
    
    if response.status_code == 200:
        print("\n✅ [SUCCESS] Shell Hardened!")
        print("✅ Server Response: Pulse verified by Space² Continuum.")
        print("\n🚀 ACTION REQUIRED: Return to your browser. Your S2-DID ID Card has been issued!")
    else:
        print(f"\n❌ [ERROR] Matrix rejected the pulse. Status Code: {response.status_code}")
        print(response.text)
        
except Exception as e:
    print(f"\n❌ [CRITICAL] Connection Failed: {e}")