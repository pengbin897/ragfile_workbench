"""
数据模型定义
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from enum import Enum
from datetime import datetime


class ParseStatus(str, Enum):
    """解析状态"""
    SUCCESS = "success"
    PARTIAL = "partial"  # 部分成功
    FAILED = "failed"


class FileType(str, Enum):
    """文件类型"""
    DOCX = "docx"
    XLSX = "xlsx"
    PPTX = "pptx"
    PDF = "pdf"
    PDF_SCAN = "pdf_scan"  # 扫描型PDF
    TXT = "txt"
    MD = "md"
    IMAGE = "image"
    OTHER = "other"


class PDFType(str, Enum):
    """PDF类型"""
    TEXT = "text"      # 文字型
    SCAN = "scan"      # 扫描型
    MIXED = "mixed"    # 混合型


class DocumentCategory(str, Enum):
    """文档分类（按处理难度）"""
    SIMPLE = "simple"      # 简单：纯文字，无表格图片
    MEDIUM = "medium"      # 中等：含表格或图片
    COMPLEX = "complex"    # 复杂：扫描PDF/解析失败


class FileInfo(BaseModel):
    """文件基础信息"""
    path: str
    name: str
    extension: str
    size: int  # bytes
    modified_time: Optional[datetime] = None
    file_type: FileType
    
    # 解析状态
    is_encrypted: bool = False
    is_corrupted: bool = False
    parse_success: bool = True
    parse_error: Optional[str] = None


class DocumentMetrics(BaseModel):
    """文档指标"""
    # 通用指标
    char_count: int = 0
    word_count: int = 0
    
    # 结构指标
    page_count: int = 0
    paragraph_count: int = 0
    table_count: int = 0
    image_count: int = 0
    
    # Office特有
    sheet_count: int = 0           # Excel
    slide_count: int = 0           # PPT
    heading_count: int = 0         # Word标题数
    merged_cell_count: int = 0     # 合并单元格数
    
    # PDF特有
    pdf_type: Optional[PDFType] = None
    text_density: float = 0.0      # 文本密度(字符/页)
    image_area_ratio: float = 0.0  # 图片面积占比


class FileAnalysis(BaseModel):
    """单个文件的完整分析结果"""
    file_info: FileInfo
    metrics: DocumentMetrics
    
    # 哈希(用于去重)
    file_hash: Optional[str] = None
    
    # 分类标签
    quality_tag: Optional[str] = None   # Clean_Markdown / Scan_PDF / Table_Heavy / Image_Heavy / Parse_Failed
    category: Optional[DocumentCategory] = None  # 三档分类
    needs_ocr: bool = False
    needs_review: bool = False


class DuplicateGroup(BaseModel):
    """重复文件组"""
    hash: str
    files: List[str]  # 文件路径列表
    count: int


class ScanProgress(BaseModel):
    """扫描进度"""
    task_id: str
    status: str  # scanning, analyzing, completed, error
    current_file: Optional[str] = None
    processed_count: int = 0
    total_count: int = 0
    percentage: float = 0.0
    message: str = ""


class LengthStats(BaseModel):
    """长度分布统计"""
    min: int = 0
    max: int = 0
    mean: float = 0.0
    median: float = 0.0  # P50
    std: float = 0.0     # 标准差
    p25: float = 0.0     # 25分位数
    p75: float = 0.0     # 75分位数
    p90: float = 0.0     # 90分位数
    p99: float = 0.0     # 99分位数
    
    # 长度分布区间
    under_500: int = 0      # <500字
    range_500_2000: int = 0 # 500-2000字
    range_2000_5000: int = 0 # 2000-5000字
    range_5000_10000: int = 0 # 5000-10000字
    over_10000: int = 0     # >10000字


class StructureStats(BaseModel):
    """结构复杂度统计"""
    # 表格相关
    docs_with_tables: int = 0         # 含表格文档数
    table_ratio: float = 0.0          # 含表格文档占比
    avg_tables_per_doc: float = 0.0   # 平均每文档表格数
    
    # 图片相关
    docs_with_images: int = 0         # 含图片文档数
    image_ratio: float = 0.0          # 含图片文档占比
    avg_images_per_doc: float = 0.0   # 平均每文档图片数
    
    # 结构化程度
    docs_with_headings: int = 0       # 有标题层级的文档数
    avg_paragraphs: float = 0.0       # 平均段落数


class PageTypeStats(BaseModel):
    """PDF页面类型统计"""
    text_pages: int = 0         # 文字页数量(>200字符)
    scan_pages: int = 0         # 扫描页数量(<50字符且图片>50%)
    low_density_pages: int = 0  # 低密度页数量
    total_pages: int = 0
    
    text_ratio: float = 0.0     # 文字页占比
    scan_ratio: float = 0.0     # 扫描页占比


class SimilarGroup(BaseModel):
    """高相似度文档组"""
    files: List[str] = Field(default_factory=list)  # 文件路径列表
    similarity: float = 0.0     # 最高相似度分数
    distance: int = 0           # SimHash汉明距离


class CategoryStats(BaseModel):
    """文档分类统计"""
    simple_count: int = 0       # 简单文档数
    medium_count: int = 0       # 中等文档数
    complex_count: int = 0      # 复杂文档数
    simple_files: List[str] = Field(default_factory=list)   # 简单文档路径列表
    medium_files: List[str] = Field(default_factory=list)   # 中等文档路径列表
    complex_files: List[str] = Field(default_factory=list)  # 复杂文档路径列表


class ScanResult(BaseModel):
    """完整扫描结果"""
    task_id: str
    scan_path: str
    scan_time: datetime
    duration_seconds: float
    
    # 总览
    total_files: int = 0
    total_size: int = 0  # bytes
    
    # 格式分布
    format_distribution: Dict[str, int] = Field(default_factory=dict)
    
    # PDF页面类型统计
    pdf_page_stats: PageTypeStats = Field(default_factory=PageTypeStats)
    
    # 文档分类统计
    category_stats: CategoryStats = Field(default_factory=CategoryStats)
    

    # 重复文件（MD5完全相同）
    duplicate_groups: List[DuplicateGroup] = Field(default_factory=list)
    
    # 高相似度文档组（SimHash）
    similar_groups: List[SimilarGroup] = Field(default_factory=list)
    
    # 统计分析
    length_stats: LengthStats = Field(default_factory=LengthStats)
    structure_stats: StructureStats = Field(default_factory=StructureStats)
    
    # 所有文件分析结果
    files: List[FileAnalysis] = Field(default_factory=list)
    
    # 需特殊处理的文件清单
    ocr_files: List[FileAnalysis] = Field(default_factory=list)      # 需OCR
    review_files: List[FileAnalysis] = Field(default_factory=list)   # 需人工审核


class ScanRequest(BaseModel):
    """扫描请求"""
    path: str
    
    
class OpenFileRequest(BaseModel):
    """打开文件请求"""
    path: str
