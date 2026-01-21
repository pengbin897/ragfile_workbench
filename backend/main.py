"""
RAG入库体检报告工具 - FastAPI 后端
"""
import os
import sys

# 添加当前目录到路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware

from api.routes import router as api_router

app = FastAPI(
    title="Document Health Check",
    description="RAG入库文档体检报告工具",
    version="1.0.0"
)

# CORS配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册API路由
app.include_router(api_router, prefix="/api")

# 静态文件服务
web_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "web")
print("web dir is:", web_path)
if os.path.exists(web_path):
    app.mount("/static", StaticFiles(directory=web_path), name="static")


@app.get("/")
async def root():
    """返回前端页面"""
    index_path = os.path.join(web_path, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "Document Health Check API", "docs": "/docs"}


@app.get("/css/{path:path}")
async def serve_css(path: str):
    """服务CSS文件"""
    css_path = os.path.join(web_path, "css", path)
    if os.path.exists(css_path):
        return FileResponse(css_path, media_type="text/css")
    return {"error": "CSS file not found"}


@app.get("/js/{path:path}")
async def serve_js(path: str):
    """服务JS文件"""
    js_path = os.path.join(web_path, "js", path)
    if os.path.exists(js_path):
        return FileResponse(js_path, media_type="application/javascript")
    return {"error": "JS file not found"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8080)
