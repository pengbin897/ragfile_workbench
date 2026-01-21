"""
提取器基类
"""
from abc import ABC, abstractmethod
from pathlib import Path
from models.schemas import FileInfo, DocumentMetrics


class BaseExtractor(ABC):
    """文档提取器基类"""
    
    @abstractmethod
    def can_handle(self, file_path: Path) -> bool:
        """判断是否能处理该文件"""
        pass
    
    @abstractmethod
    def extract(self, file_path: Path, file_info: FileInfo) -> DocumentMetrics:
        """提取文档指标"""
        pass
    
    def extract_text(self, file_path: Path) -> str:
        """提取文本内容(用于敏感信息检测等)"""
        return ""
