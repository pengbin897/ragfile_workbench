"""
纯文本文件提取器
"""
from pathlib import Path
import chardet

from .base import BaseExtractor
from models.schemas import FileInfo, DocumentMetrics


class TextExtractor(BaseExtractor):
    """纯文本文件提取器"""
    
    def can_handle(self, file_path: Path) -> bool:
        return file_path.suffix.lower() in ['.txt', '.md', '.markdown', '.rst', '.log']
    
    def extract(self, file_path: Path, file_info: FileInfo) -> DocumentMetrics:
        """提取文本文件指标"""
        metrics = DocumentMetrics()
        
        try:
            # 检测编码
            with open(file_path, 'rb') as f:
                raw_data = f.read()
            
            detected = chardet.detect(raw_data)
            encoding = detected.get('encoding', 'utf-8') or 'utf-8'
            
            try:
                text = raw_data.decode(encoding)
            except (UnicodeDecodeError, LookupError):
                # 尝试常用编码
                for enc in ['utf-8', 'gbk', 'gb2312', 'latin-1']:
                    try:
                        text = raw_data.decode(enc)
                        break
                    except:
                        continue
                else:
                    file_info.parse_success = False
                    file_info.parse_error = "无法识别文件编码"
                    return metrics
            
            # 字符统计
            metrics.char_count = len(text)
            metrics.word_count = len(text.split())
            
            # 行数统计
            lines = text.split('\n')
            metrics.paragraph_count = len([l for l in lines if l.strip()])
            
            # 对于Markdown,统计标题数
            if file_path.suffix.lower() in ['.md', '.markdown']:
                heading_count = 0
                for line in lines:
                    if line.strip().startswith('#'):
                        heading_count += 1
                metrics.heading_count = heading_count
            
        except Exception as e:
            file_info.parse_success = False
            file_info.parse_error = str(e)
        
        return metrics
    
    def extract_text(self, file_path: Path) -> str:
        """提取文本内容"""
        try:
            with open(file_path, 'rb') as f:
                raw_data = f.read()
            
            detected = chardet.detect(raw_data)
            encoding = detected.get('encoding', 'utf-8') or 'utf-8'
            
            try:
                return raw_data.decode(encoding)
            except:
                return raw_data.decode('utf-8', errors='ignore')
        except Exception:
            return ""
