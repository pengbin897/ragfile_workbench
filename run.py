#!/usr/bin/env python3
"""
RAG入库体检报告工具 - 一键启动脚本
"""
import subprocess
import sys
import webbrowser
import time
import os

def main():
    # 获取项目根目录
    root_dir = os.path.dirname(os.path.abspath(__file__))
    
    # 启动后端服务
    print("🚀 正在启动 Document Health Check 服务...")
    print(f"📁 项目目录: {root_dir}")
    
    # 使用 uvicorn 启动
    cmd = [
        sys.executable, "-m", "uvicorn",
        "main:app",
        "--host", "127.0.0.1",
        "--port", "8000",
        "--reload"
    ]

    os.chdir(os.path.join(root_dir, "backend"))
    
    # 延迟打开浏览器
    def open_browser():
        time.sleep(2)
        url = "http://127.0.0.1:8000"
        print(f"🌐 服务已启动，请访问: {url}")
        # webbrowser.open(url)
    
    import threading
    browser_thread = threading.Thread(target=open_browser)
    browser_thread.start()
    
    # 启动服务
    try:
        subprocess.run(cmd)
    except KeyboardInterrupt:
        print("\n👋 服务已停止")

if __name__ == "__main__":
    main()
