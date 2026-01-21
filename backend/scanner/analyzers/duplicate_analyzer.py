"""
重复文件检测分析器
"""
import hashlib
from pathlib import Path
from typing import Dict, List
from collections import defaultdict

from models.schemas import DuplicateGroup


class DuplicateAnalyzer:
    """重复文件检测分析器"""
    
    def __init__(self):
        self.hash_map: Dict[str, List[str]] = defaultdict(list)
    
    def compute_hash(self, file_path: Path, chunk_size: int = 8192) -> str:
        """计算文件MD5哈希"""
        hasher = hashlib.md5()
        try:
            with open(file_path, 'rb') as f:
                while chunk := f.read(chunk_size):
                    hasher.update(chunk)
            return hasher.hexdigest()
        except Exception:
            return ""
    
    def add_file(self, file_path: Path) -> str:
        """添加文件并返回其哈希值"""
        file_hash = self.compute_hash(file_path)
        if file_hash:
            self.hash_map[file_hash].append(str(file_path))
        return file_hash
    
    def get_duplicates(self) -> List[DuplicateGroup]:
        """获取所有重复文件组"""
        duplicates = []
        for file_hash, files in self.hash_map.items():
            if len(files) > 1:
                duplicates.append(DuplicateGroup(
                    hash=file_hash,
                    files=files,
                    count=len(files)
                ))
        return duplicates
    
    def reset(self):
        """重置状态"""
        self.hash_map.clear()
