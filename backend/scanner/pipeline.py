"""
扫描管线 - 编排整个扫描流程
"""
import uuid
from pathlib import Path
from datetime import datetime
from typing import Callable, Optional, Dict, List, Set
from collections import defaultdict

from models.schemas import (
    FileInfo, FileAnalysis, DocumentMetrics,
    ScanProgress, ScanResult, FileType, DuplicateGroup, 
    PageTypeStats, SimilarGroup, DocumentCategory,
    CategoryStats
)
from config.settings import settings
from .file_scanner import FileScanner
from .extractors.docx_extractor import DocxExtractor
from .extractors.xlsx_extractor import XlsxExtractor
from .extractors.pptx_extractor import PptxExtractor
from .extractors.pdf_extractor import PdfExtractor
from .extractors.text_extractor import TextExtractor
from .analyzers.duplicate_analyzer import DuplicateAnalyzer
from .analyzers.similarity_analyzer import SimilarityAnalyzer
from .analyzers.stats_analyzer import StatsAnalyzer


class ScanPipeline:
    """扫描管线"""
    
    def __init__(self):
        self.file_scanner = FileScanner()
        
        # 初始化提取器
        self.extractors = [
            DocxExtractor(),
            XlsxExtractor(),
            PptxExtractor(),
            PdfExtractor(),
            TextExtractor(),
        ]
        
        # 初始化分析器
        self.duplicate_analyzer = DuplicateAnalyzer()
        self.similarity_analyzer = SimilarityAnalyzer(
            distance_threshold=settings.similarity.simhash_distance_threshold
        )
        self.stats_analyzer = StatsAnalyzer()
        
        # 任务状态存储
        self.tasks: Dict[str, ScanResult] = {}
        self.progress: Dict[str, ScanProgress] = {}
    
    def start_scan(self, scan_path: str, 
                   progress_callback: Optional[Callable[[ScanProgress], None]] = None
                   ) -> str:
        """启动扫描任务"""
        task_id = str(uuid.uuid4())[:8]
        start_time = datetime.now()
        
        # 初始化进度
        progress = ScanProgress(
            task_id=task_id,
            status="scanning",
            message="正在扫描文件夹..."
        )
        self.progress[task_id] = progress
        
        # 重置分析器状态
        self.duplicate_analyzer.reset()
        self.similarity_analyzer.reset()
        
        # 收集所有文件分析结果
        analyses: List[FileAnalysis] = []
        format_distribution: Dict[str, int] = defaultdict(int)
        
        # 统计文件总数
        total_files = self.file_scanner.count_files(scan_path)
        progress.total_count = total_files
        
        if progress_callback:
            progress_callback(progress)
        
        processed = 0
        
        # 扫描并处理每个文件
        def on_file_progress(current_file: str, processed_count: int, total: int):
            nonlocal processed
            processed = processed_count
            progress.current_file = Path(current_file).name
            progress.processed_count = processed_count
            progress.total_count = total
            progress.percentage = (processed_count / total * 100) if total > 0 else 0
            progress.message = f"正在处理: {progress.current_file}"
            if progress_callback:
                progress_callback(progress)
        
        for file_info in self.file_scanner.scan(scan_path, on_file_progress):
            # 更新格式分布
            format_distribution[file_info.file_type.value] += 1
            
            # 提取文档指标
            metrics = self._extract_metrics(file_info)
            
            # 计算文件哈希(MD5用于重复检测)
            file_hash = self.duplicate_analyzer.add_file(Path(file_info.path))
            
            # 提取文本
            text = self._extract_text(file_info)
                        
            # 添加到相似度分析器
            if text:
                self.similarity_analyzer.add_document(file_info.path, text)
            
            # 创建分析结果
            analysis = FileAnalysis(
                file_info=file_info,
                metrics=metrics,
                file_hash=file_hash
            )
            
            # 设置分类标签（三档分类）
            analysis = self._set_category(analysis)
            analyses.append(analysis)
        
        # 进入分析阶段
        progress.status = "analyzing"
        progress.message = "正在生成报告..."
        if progress_callback:
            progress_callback(progress)
        
        # 获取重复文件
        duplicates = self.duplicate_analyzer.get_duplicates()
        
        # 获取相似文档组
        similar_groups_raw = self.similarity_analyzer.find_similar_groups()
        similar_groups = [
            SimilarGroup(
                files=g['files'],
                similarity=g['similarity'],
                distance=g['distance']
            )
            for g in similar_groups_raw
        ]
        
        # 统计文档分类
        category_stats = self._calculate_category_stats(analyses)

        # 统计PDF页面类型
        pdf_page_stats = self._calculate_pdf_page_stats(analyses)
        
        # 计算统计分析
        stats = self.stats_analyzer.analyze(analyses)
        
        # 筛选需特殊处理的文件
        ocr_files = [a for a in analyses if a.needs_ocr]
        review_files = [a for a in analyses if a.needs_review]
        
        # 计算耗时
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        
        # 创建最终结果
        result = ScanResult(
            task_id=task_id,
            scan_path=scan_path,
            scan_time=start_time,
            duration_seconds=duration,
            total_files=len(analyses),
            total_size=sum(a.file_info.size for a in analyses),
            format_distribution=dict(format_distribution),
            pdf_page_stats=pdf_page_stats,
            category_stats=category_stats,
            duplicate_groups=duplicates,
            similar_groups=similar_groups,
            length_stats=stats['length_stats'],
            structure_stats=stats['structure_stats'],
            files=analyses,
            ocr_files=ocr_files,
            review_files=review_files,
        )
        
        self.tasks[task_id] = result
        
        # 完成
        progress.status = "completed"
        progress.percentage = 100
        progress.message = "扫描完成"
        if progress_callback:
            progress_callback(progress)
        
        return task_id
    
    def _extract_metrics(self, file_info: FileInfo) -> DocumentMetrics:
        """使用合适的提取器提取文档指标"""
        file_path = Path(file_info.path)
        
        for extractor in self.extractors:
            if extractor.can_handle(file_path):
                return extractor.extract(file_path, file_info)
        
        return DocumentMetrics()
    
    def _extract_text(self, file_info: FileInfo) -> str:
        """提取文本内容"""
        file_path = Path(file_info.path)
        
        for extractor in self.extractors:
            if extractor.can_handle(file_path):
                return extractor.extract_text(file_path)
        
        return ""
    
    def _set_category(self, analysis: FileAnalysis) -> FileAnalysis:
        """
        设置文档三档分类：
        - SIMPLE: 纯文字，无表格无图片
        - MEDIUM: 含表格或图片
        - COMPLEX: 扫描PDF/解析失败
        """
        metrics = analysis.metrics
        file_info = analysis.file_info
        
        # 复杂：解析失败
        if not file_info.parse_success:
            analysis.category = DocumentCategory.COMPLEX
            analysis.quality_tag = "Parse_Failed"
            analysis.needs_review = True
            return analysis
        
        # 复杂：扫描型PDF
        if file_info.file_type == FileType.PDF:
            if metrics.pdf_type and metrics.pdf_type.value == 'scan':
                analysis.category = DocumentCategory.COMPLEX
                analysis.quality_tag = "Scan_PDF"
                analysis.needs_ocr = True
                return analysis
        
        # 中等：含表格或图片
        has_table = metrics.table_count > 0
        has_image = metrics.image_count > 0
        
        if has_table or has_image:
            analysis.category = DocumentCategory.MEDIUM
            if has_table and has_image:
                analysis.quality_tag = "Table_Image"
            elif has_table:
                analysis.quality_tag = "With_Table"
            else:
                analysis.quality_tag = "With_Image"
            return analysis
        
        # 简单：纯文字
        analysis.category = DocumentCategory.SIMPLE
        analysis.quality_tag = "Pure_Text"
        return analysis
    
    def _calculate_category_stats(self, analyses: List[FileAnalysis]) -> CategoryStats:
        """统计三档分类"""
        simple_files = []
        medium_files = []
        complex_files = []
        
        for a in analyses:
            path = a.file_info.path
            if a.category == DocumentCategory.SIMPLE:
                simple_files.append(path)
            elif a.category == DocumentCategory.MEDIUM:
                medium_files.append(path)
            else:
                complex_files.append(path)
        
        return CategoryStats(
            simple_count=len(simple_files),
            medium_count=len(medium_files),
            complex_count=len(complex_files),
            simple_files=simple_files,
            medium_files=medium_files,
            complex_files=complex_files,
        )
    
    def _calculate_pdf_page_stats(self, analyses: List[FileAnalysis]) -> PageTypeStats:
        """统计PDF页面类型分布"""
        text_pages = 0
        scan_pages = 0
        low_density_pages = 0
        total_pages = 0
        
        for a in analyses:
            if a.file_info.file_type == FileType.PDF:
                pages = a.metrics.page_count
                total_pages += pages
                
                if a.metrics.pdf_type:
                    if a.metrics.pdf_type.value == 'text':
                        text_pages += pages
                    elif a.metrics.pdf_type.value == 'scan':
                        scan_pages += pages
                    else:
                        low_density_pages += pages
        
        return PageTypeStats(
            text_pages=text_pages,
            scan_pages=scan_pages,
            low_density_pages=low_density_pages,
            total_pages=total_pages,
            text_ratio=text_pages / total_pages if total_pages > 0 else 0,
            scan_ratio=scan_pages / total_pages if total_pages > 0 else 0
        )
    
    def get_result(self, task_id: str) -> Optional[ScanResult]:
        """获取扫描结果"""
        return self.tasks.get(task_id)
    
    def get_progress(self, task_id: str) -> Optional[ScanProgress]:
        """获取扫描进度"""
        return self.progress.get(task_id)
