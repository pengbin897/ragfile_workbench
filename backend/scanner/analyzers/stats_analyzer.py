"""
统计分析器 - 计算文档长度分布、结构复杂度
"""
import math
from typing import List

from models.schemas import FileAnalysis, LengthStats, StructureStats


class StatsAnalyzer:
    """统计分析器"""
    
    def analyze(self, analyses: List[FileAnalysis]) -> dict:
        """
        对所有文件分析结果进行统计
        
        Returns:
            包含 length_stats, structure_stats 的字典
        """
        if not analyses:
            return {
                'length_stats': LengthStats(),
                'structure_stats': StructureStats()
            }
        
        # 收集所有字符数
        char_counts = [a.metrics.char_count for a in analyses if a.file_info.parse_success]
        
        # 计算长度统计
        length_stats = self._calculate_length_stats(char_counts)
        
        # 计算结构复杂度
        structure_stats = self._calculate_structure_stats(analyses)
        
        return {
            'length_stats': length_stats,
            'structure_stats': structure_stats
        }
    
    def _calculate_length_stats(self, char_counts: List[int]) -> LengthStats:
        """计算长度分布统计"""
        if not char_counts:
            return LengthStats()
        
        sorted_counts = sorted(char_counts)
        n = len(sorted_counts)
        
        # 基础统计
        stats = LengthStats(
            min=sorted_counts[0],
            max=sorted_counts[-1],
            mean=sum(sorted_counts) / n,
            median=self._percentile(sorted_counts, 50),
            p25=self._percentile(sorted_counts, 25),
            p75=self._percentile(sorted_counts, 75),
            p90=self._percentile(sorted_counts, 90),
            p99=self._percentile(sorted_counts, 99)
        )
        
        # 标准差
        if n > 1:
            variance = sum((x - stats.mean) ** 2 for x in sorted_counts) / n
            stats.std = math.sqrt(variance)
        
        # 长度分布区间
        for count in char_counts:
            if count < 500:
                stats.under_500 += 1
            elif count < 2000:
                stats.range_500_2000 += 1
            elif count < 5000:
                stats.range_2000_5000 += 1
            elif count < 10000:
                stats.range_5000_10000 += 1
            else:
                stats.over_10000 += 1
        
        return stats
    
    def _percentile(self, sorted_data: List[int], p: float) -> float:
        """计算分位数"""
        if not sorted_data:
            return 0
        n = len(sorted_data)
        idx = (n - 1) * p / 100
        lower = int(idx)
        upper = lower + 1
        if upper >= n:
            return float(sorted_data[-1])
        weight = idx - lower
        return sorted_data[lower] * (1 - weight) + sorted_data[upper] * weight
    
    def _calculate_structure_stats(self, analyses: List[FileAnalysis]) -> StructureStats:
        """计算结构复杂度统计"""
        stats = StructureStats()
        
        if not analyses:
            return stats
        
        total = len(analyses)
        total_tables = 0
        total_images = 0
        total_paragraphs = 0
        
        for a in analyses:
            m = a.metrics
            
            if m.table_count > 0:
                stats.docs_with_tables += 1
                total_tables += m.table_count
            
            if m.image_count > 0:
                stats.docs_with_images += 1
                total_images += m.image_count
            
            if m.heading_count > 0:
                stats.docs_with_headings += 1
            
            total_paragraphs += m.paragraph_count
        
        stats.table_ratio = stats.docs_with_tables / total if total > 0 else 0
        stats.image_ratio = stats.docs_with_images / total if total > 0 else 0
        stats.avg_tables_per_doc = total_tables / total if total > 0 else 0
        stats.avg_images_per_doc = total_images / total if total > 0 else 0
        stats.avg_paragraphs = total_paragraphs / total if total > 0 else 0
        
        return stats
