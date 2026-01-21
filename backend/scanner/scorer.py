"""
风险评分器
"""
from typing import List

from models.schemas import FileAnalysis, RiskLevel, PDFType, FileType
from config.settings import settings


class Scorer:
    """风险评分器"""
    
    def score(self, analysis: FileAnalysis) -> FileAnalysis:
        """对文件分析结果进行评分"""
        score = 100
        reasons = []
        
        file_info = analysis.file_info
        metrics = analysis.metrics
        
        weights = settings.scoring_weights
        
        # 1. 解析成功率检查
        if not file_info.parse_success:
            error_msg = file_info.parse_error or '未知错误'
            if '损坏' in error_msg or 'corrupt' in error_msg.lower():
                # 真正的文件损坏
                score -= 25
                reasons.append("文件损坏或无法读取")
            else:
                # 其他解析问题，轻微扣分
                score -= 10
                reasons.append(f"解析异常: {error_msg[:40]}")
        elif file_info.is_corrupted:
            score -= 30
            reasons.append("文件已损坏")
        elif file_info.is_encrypted:
            score -= 20
            reasons.append("文件已加密，无法读取内容")
        
        # 2. PDF扫描件风险
        if file_info.file_type == FileType.PDF:
            if metrics.pdf_type == PDFType.SCAN:
                score -= 20
                reasons.append("扫描型PDF，需OCR处理")
            elif metrics.pdf_type == PDFType.MIXED:
                score -= 10
                reasons.append("混合型PDF，部分页面为扫描件")
        
        # 3. 表格复杂度风险 - 只有极大量合并单元格才扣分
        if metrics.table_count > 0 and metrics.merged_cell_count > 50:
            score -= 5
            reasons.append(f"表格复杂，存在{metrics.merged_cell_count}个合并单元格")
        
        # 确保分数在0-100范围内
        score = max(0, min(100, score))
        
        # 确定风险等级
        thresholds = settings.scoring_thresholds
        if score >= thresholds.green:
            risk_level = RiskLevel.GREEN
        elif score >= thresholds.yellow:
            risk_level = RiskLevel.YELLOW
        else:
            risk_level = RiskLevel.RED
        
        # 更新分析结果
        analysis.score = score
        analysis.risk_level = risk_level
        analysis.risk_reasons = reasons
        
        return analysis
    
    def calculate_health_score(self, analyses: List[FileAnalysis]) -> int:
        """计算整体健康评分"""
        if not analyses:
            return 0
        
        total_score = sum(a.score for a in analyses)
        return int(total_score / len(analyses))
