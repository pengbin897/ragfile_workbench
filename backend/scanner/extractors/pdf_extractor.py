"""
PDF文档提取器 - 支持文字型/扫描型分流
"""
from pathlib import Path
import fitz  # PyMuPDF

from .base import BaseExtractor
from models.schemas import FileInfo, DocumentMetrics, PDFType
from config.settings import settings


class PdfExtractor(BaseExtractor):
    """PDF文档提取器"""
    
    def can_handle(self, file_path: Path) -> bool:
        return file_path.suffix.lower() == '.pdf'
    
    def extract(self, file_path: Path, file_info: FileInfo) -> DocumentMetrics:
        """提取PDF文档指标，并判断是文字型还是扫描型"""
        metrics = DocumentMetrics()
        
        try:
            doc = fitz.open(str(file_path))
            
            page_count = len(doc)
            metrics.page_count = page_count
            
            if page_count == 0:
                file_info.parse_success = False
                file_info.parse_error = "PDF页数为0"
                return metrics
            
            total_chars = 0
            total_images = 0
            scan_pages = 0  # 扫描页计数
            
            config = settings.pdf_detection
            
            for page in doc:
                # 提取文本
                text = page.get_text()
                page_chars = len(text.strip())
                total_chars += page_chars
                
                # 判断是否为扫描页
                if page_chars < config.min_text_chars_per_page:
                    scan_pages += 1
                
                # 统计图片
                images = page.get_images()
                total_images += len(images)
            
            metrics.char_count = total_chars
            metrics.image_count = total_images
            
            # 计算文本密度
            metrics.text_density = total_chars / page_count if page_count > 0 else 0
            
            # 判断PDF类型
            scan_ratio = scan_pages / page_count if page_count > 0 else 0
            
            if scan_ratio >= config.scan_page_ratio_threshold:
                metrics.pdf_type = PDFType.SCAN
            elif scan_ratio > 0.2:  # 有一些扫描页但不多
                metrics.pdf_type = PDFType.MIXED
            else:
                metrics.pdf_type = PDFType.TEXT
            
            # 估算图片面积占比(简化处理)
            if total_images > 0 and page_count > 0:
                # 如果平均每页图片数>1，认为图片占比较高
                avg_images_per_page = total_images / page_count
                metrics.image_area_ratio = min(avg_images_per_page / 3, 1.0)
            
            doc.close()
            
        except fitz.FileDataError:
            file_info.is_corrupted = True
            file_info.parse_success = False
            file_info.parse_error = "PDF文件损坏"
        except Exception as e:
            file_info.parse_success = False
            file_info.parse_error = str(e)
        
        return metrics
    
    def extract_text(self, file_path: Path) -> str:
        """提取文本内容"""
        try:
            doc = fitz.open(str(file_path))
            texts = []
            
            for page in doc:
                text = page.get_text().strip()
                if text:
                    texts.append(text)
            
            doc.close()
            return '\n\n'.join(texts)
        except Exception:
            return ""
