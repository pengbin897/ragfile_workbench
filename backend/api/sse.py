"""
SSE 进度推送
"""
import asyncio
import json
from typing import AsyncGenerator

from sse_starlette.sse import ServerSentEvent

from models.schemas import ScanProgress


async def progress_generator(progress_queue: asyncio.Queue) -> AsyncGenerator[ServerSentEvent, None]:
    """
    生成SSE事件流
    
    Args:
        progress_queue: 进度消息队列
        
    Yields:
        ServerSentEvent
    """
    try:
        while True:
            # 等待进度更新
            progress: ScanProgress = await progress_queue.get()
            
            # 发送事件
            yield ServerSentEvent(
                data=progress.model_dump_json(),
                event="progress"
            )
            
            # 如果完成或出错,结束流
            if progress.status in ["completed", "error"]:
                break
                
    except asyncio.CancelledError:
        pass


def format_progress_message(progress: ScanProgress) -> str:
    """格式化进度消息为JSON"""
    return progress.model_dump_json()
