"""
文件夹扫描器
"""
import os
from pathlib import Path
from datetime import datetime
from typing import List, Generator, Callable, Optional

from models.schemas import FileInfo, FileType
from config.settings import settings


class FileScanner:
    """文件夹递归扫描器"""
    
    def __init__(self):
        self.supported_extensions = settings.supported_extensions
    
    def scan(self, root_path: str, 
             progress_callback: Optional[Callable[[str, int, int], None]] = None
             ) -> Generator[FileInfo, None, None]:
        """
        递归扫描文件夹
        
        Args:
            root_path: 根目录路径
            progress_callback: 进度回调函数(current_file, processed, total)
        
        Yields:
            FileInfo对象
        """
        root = Path(root_path)
        if not root.exists():
            raise ValueError(f"路径不存在: {root_path}")
        if not root.is_dir():
            raise ValueError(f"路径不是目录: {root_path}")
        
        # 先收集所有文件
        all_files = list(self._collect_files(root))
        total = len(all_files)
        
        for idx, file_path in enumerate(all_files):
            if progress_callback:
                progress_callback(str(file_path), idx + 1, total)
            
            file_info = self._create_file_info(file_path)
            if file_info:
                yield file_info
    
    def _collect_files(self, root: Path) -> Generator[Path, None, None]:
        """收集所有文件路径"""
        for dirpath, dirnames, filenames in os.walk(root):
            # 跳过隐藏目录
            dirnames[:] = [d for d in dirnames if not d.startswith('.')]
            
            for filename in filenames:
                # 跳过隐藏文件
                if filename.startswith('.'):
                    continue
                
                file_path = Path(dirpath) / filename
                ext = file_path.suffix.lower()
                
                # 只处理支持的格式
                if ext in self.supported_extensions or ext in ['.txt', '.md']:
                    yield file_path
    
    def _create_file_info(self, file_path: Path) -> Optional[FileInfo]:
        """创建文件信息对象"""
        try:
            stat = file_path.stat()
            ext = file_path.suffix.lower()
            
            # 确定文件类型
            file_type = self._get_file_type(ext)
            
            return FileInfo(
                path=str(file_path),
                name=file_path.name,
                extension=ext,
                size=stat.st_size,
                modified_time=datetime.fromtimestamp(stat.st_mtime),
                file_type=file_type,
                is_encrypted=False,
                is_corrupted=False,
                parse_success=True,
            )
        except Exception as e:
            # 文件可能已被删除或无权访问
            return None
    
    def _get_file_type(self, ext: str) -> FileType:
        """根据扩展名判断文件类型"""
        type_str = self.supported_extensions.get(ext, 'other')
        
        type_map = {
            'docx': FileType.DOCX,
            'xlsx': FileType.XLSX,
            'pptx': FileType.PPTX,
            'pdf': FileType.PDF,
            'txt': FileType.TXT,
            'md': FileType.MD,
            'image': FileType.IMAGE,
        }
        
        return type_map.get(type_str, FileType.OTHER)
    
    def count_files(self, root_path: str) -> int:
        """快速统计文件数量"""
        root = Path(root_path)
        if not root.exists() or not root.is_dir():
            return 0
        return sum(1 for _ in self._collect_files(root))
