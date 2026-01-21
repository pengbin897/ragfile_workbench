"""
噪音检测分析器(基础版)
"""
from typing import List, Dict, Tuple
from collections import Counter


class NoiseAnalyzer:
    """噪音检测分析器"""
    
    # 常见噪音模式
    NOISE_PATTERNS = [
        '本文档仅供内部使用',
        '机密文件',
        '请勿外传',
        '版权所有',
        '目录',
        '页眉',
        '页脚',
        'confidential',
        'internal use only',
    ]
    
    def __init__(self):
        self.line_counter = Counter()
    
    def analyze_text(self, text: str) -> Dict:
        """分析文本中的噪音"""
        if not text:
            return {'noise_ratio': 0, 'noise_lines': []}
        
        lines = text.split('\n')
        noise_lines = []
        
        for line in lines:
            line_stripped = line.strip().lower()
            if not line_stripped:
                continue
            
            # 检查是否匹配噪音模式
            for pattern in self.NOISE_PATTERNS:
                if pattern.lower() in line_stripped:
                    noise_lines.append(line.strip())
                    break
            
            # 统计行频率(用于检测重复页眉页脚)
            if len(line_stripped) < 100:  # 短行更可能是页眉页脚
                self.line_counter[line_stripped] += 1
        
        # 计算噪音比例
        total_lines = len([l for l in lines if l.strip()])
        noise_ratio = len(noise_lines) / total_lines if total_lines > 0 else 0
        
        return {
            'noise_ratio': noise_ratio,
            'noise_lines': noise_lines[:10],  # 最多返回10条示例
        }
    
    def get_repeated_lines(self, min_count: int = 3) -> List[Tuple[str, int]]:
        """获取重复出现的行(可能是页眉页脚)"""
        return [(line, count) for line, count in self.line_counter.most_common(10) 
                if count >= min_count]
    
    def reset(self):
        """重置状态"""
        self.line_counter.clear()
