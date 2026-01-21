"""
配置管理
"""
from pydantic import BaseModel
from typing import Dict


class PDFDetectionConfig(BaseModel):
    """PDF类型检测配置"""
    min_text_chars_per_page: int = 50     # 每页最少字符数(低于此视为扫描页)
    text_page_threshold: int = 200         # 文字页阈值(高于此为文字页)
    scan_page_ratio_threshold: float = 0.7  # 扫描页占比阈值
    min_image_area_ratio: float = 0.5      # 扫描页图片面积占比阈值


class SimilarityConfig(BaseModel):
    """相似度检测配置"""
    simhash_distance_threshold: int = 5    # SimHash汉明距离阈值(≤此值判定为相似)
    max_text_length: int = 10000           # 计算SimHash时截取的最大文本长度


class ExcelConfig(BaseModel):
    """Excel处理配置"""
    large_row_threshold: int = 5000        # 大型Excel行数阈值


class Settings(BaseModel):
    """全局配置"""
    # PDF检测配置
    pdf_detection: PDFDetectionConfig = PDFDetectionConfig()
    
    # 相似度检测配置
    similarity: SimilarityConfig = SimilarityConfig()

    # Excel配置
    excel: ExcelConfig = ExcelConfig()
    
    # 支持的文件扩展名
    supported_extensions: Dict[str, str] = {
        ".docx": "docx",
        ".doc": "docx",
        ".xlsx": "xlsx",
        ".xls": "xlsx",
        ".pptx": "pptx",
        ".ppt": "pptx",
        ".pdf": "pdf",
        ".txt": "txt",
        ".md": "md",
        ".jpg": "image",
        ".jpeg": "image",
        ".png": "image",
        ".gif": "image",
        ".bmp": "image",
    }
    
    # 服务配置
    host: str = "127.0.0.1"
    port: int = 8080


# 全局配置实例
settings = Settings()
