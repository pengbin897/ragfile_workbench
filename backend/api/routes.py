"""
API 路由
"""
import os
import asyncio
import subprocess
import platform
from pathlib import Path
from typing import Dict
from concurrent.futures import ThreadPoolExecutor

from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse, Response
from utils.export_utils import generate_export_html
from sse_starlette.sse import EventSourceResponse

from models.schemas import ScanRequest, OpenFileRequest, ScanProgress, ScanResult
from scanner.pipeline import ScanPipeline
from .sse import progress_generator

router = APIRouter()

# 全局扫描管线实例
pipeline = ScanPipeline()

# 进度队列存储
progress_queues: Dict[str, asyncio.Queue] = {}

# 线程池执行器
executor = ThreadPoolExecutor(max_workers=2)


@router.post("/scan/start")
async def start_scan(request: ScanRequest, background_tasks: BackgroundTasks):
    """启动扫描任务"""
    scan_path = request.path
    
    # 验证路径
    if not os.path.exists(scan_path):
        raise HTTPException(status_code=400, detail=f"路径不存在: {scan_path}")
    if not os.path.isdir(scan_path):
        raise HTTPException(status_code=400, detail=f"路径不是目录: {scan_path}")
    
    # 创建进度队列
    task_id = None
    progress_queue = asyncio.Queue()
    
    def run_scan():
        nonlocal task_id
        
        def on_progress(progress: ScanProgress):
            # 将进度放入队列
            asyncio.run_coroutine_threadsafe(
                progress_queue.put(progress),
                loop
            )
        
        task_id = pipeline.start_scan(scan_path, on_progress)
        progress_queues[task_id] = progress_queue
    
    # 获取当前事件循环
    loop = asyncio.get_event_loop()
    
    # 在后台线程中执行扫描
    future = loop.run_in_executor(executor, run_scan)
    
    # 等待任务ID生成
    await asyncio.sleep(0.1)
    
    # 如果task_id还没生成,先返回一个临时ID
    temp_id = "pending"
    
    return {"task_id": temp_id, "status": "started", "message": "扫描任务已启动"}


@router.post("/scan/start_sync")
async def start_scan_sync(request: ScanRequest):
    """同步启动扫描任务(用于SSE)"""
    scan_path = request.path
    
    # 验证路径
    if not os.path.exists(scan_path):
        raise HTTPException(status_code=400, detail=f"路径不存在: {scan_path}")
    if not os.path.isdir(scan_path):
        raise HTTPException(status_code=400, detail=f"路径不是目录: {scan_path}")
    
    # 创建进度队列
    progress_queue = asyncio.Queue()
    loop = asyncio.get_event_loop()
    
    task_id_holder = {"id": None}
    
    def on_progress(progress: ScanProgress):
        task_id_holder["id"] = progress.task_id
        try:
            asyncio.run_coroutine_threadsafe(
                progress_queue.put(progress),
                loop
            )
        except Exception:
            pass
    
    # 在后台线程中执行扫描
    def run_scan():
        return pipeline.start_scan(scan_path, on_progress)
    
    # 启动扫描
    future = loop.run_in_executor(executor, run_scan)
    
    # 等待第一个进度消息获取task_id
    try:
        first_progress = await asyncio.wait_for(progress_queue.get(), timeout=5.0)
        task_id = first_progress.task_id
        progress_queues[task_id] = progress_queue
        
        # 把第一个进度放回队列
        await progress_queue.put(first_progress)
        
        return {"task_id": task_id, "status": "started"}
    except asyncio.TimeoutError:
        raise HTTPException(status_code=500, detail="启动扫描超时")


@router.get("/scan/progress/{task_id}")
async def get_scan_progress(task_id: str):
    """获取扫描进度(SSE流)"""
    queue = progress_queues.get(task_id)
    
    if not queue:
        # 如果没有队列,检查是否已完成
        result = pipeline.get_result(task_id)
        if result:
            # 返回完成状态
            async def completed_generator():
                yield {
                    "event": "progress",
                    "data": ScanProgress(
                        task_id=task_id,
                        status="completed",
                        percentage=100,
                        message="扫描已完成"
                    ).model_dump_json()
                }
            return EventSourceResponse(completed_generator())
        raise HTTPException(status_code=404, detail="任务不存在")
    
    return EventSourceResponse(progress_generator(queue))


@router.get("/scan/result/{task_id}")
async def get_scan_result(task_id: str):
    """获取扫描结果"""
    result = pipeline.get_result(task_id)
    if not result:
        raise HTTPException(status_code=404, detail="扫描结果不存在")
    return result


@router.post("/file/open")
async def open_file(request: OpenFileRequest):
    """打开本地文件"""
    file_path = request.path
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="文件不存在")
    
    try:
        system = platform.system()
        if system == "Darwin":  # macOS
            subprocess.run(["open", file_path], check=True)
        elif system == "Windows":
            os.startfile(file_path)
        else:  # Linux
            subprocess.run(["xdg-open", file_path], check=True)
        
        return {"status": "success", "message": "文件已打开"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"打开文件失败: {str(e)}")


@router.get("/health")
async def health_check():
    """健康检查"""
    return {"status": "ok"}


@router.get("/folder/browse")
async def browse_folder():
    """打开系统文件夹选择对话框"""
    import subprocess
    import sys
    
    try:
        if sys.platform == "darwin":  # macOS
            # 使用AppleScript打开文件夹选择对话框
            script = '''
            tell application "System Events"
                activate
                set folderPath to POSIX path of (choose folder with prompt "选择要扫描的文件夹")
                return folderPath
            end tell
            '''
            result = subprocess.run(
                ["osascript", "-e", script],
                capture_output=True,
                text=True,
                timeout=60
            )
            if result.returncode == 0:
                folder_path = result.stdout.strip()
                return {"status": "success", "path": folder_path}
            else:
                # 用户取消了选择
                return {"status": "cancelled", "path": ""}
        else:
            # 其他平台使用tkinter
            import tkinter as tk
            from tkinter import filedialog
            
            root = tk.Tk()
            root.withdraw()
            root.attributes('-topmost', True)
            
            folder_path = filedialog.askdirectory(
                title="选择要扫描的文件夹"
            )
            
            root.destroy()
            
            if folder_path:
                return {"status": "success", "path": folder_path}
            else:
                return {"status": "cancelled", "path": ""}
                
        return {"status": "cancelled", "path": ""}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"打开文件夹选择器失败: {str(e)}")


@router.get("/report/export/{task_id}")
async def export_report(task_id: str):
    """导出HTML报告"""
    result = pipeline.get_result(task_id)
    if not result:
        raise HTTPException(status_code=404, detail="未找到扫描结果")
    
    # 定位模板目录
    current_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.dirname(current_dir)
    template_dir = os.path.join(backend_dir, "templates")
    
    try:
        html_content = generate_export_html(result, template_dir)
        filename = f"RAG_Assessment_Report_{task_id}.html"
        
        return Response(
            content=html_content,
            media_type="text/html",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"生成报告失败: {str(e)}")
