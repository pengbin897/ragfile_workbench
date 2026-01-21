"""
相似度分析器 - 使用SimHash检测高相似文档
"""
from typing import List, Dict, Tuple
from collections import defaultdict
import hashlib
import re


class SimHash:
    """SimHash算法实现"""
    
    def __init__(self, bits: int = 64):
        self.bits = bits
    
    def hash(self, text: str) -> int:
        """计算文本的SimHash值"""
        if not text:
            return 0
        
        # 分词（简单的按空格和标点分割）
        tokens = self._tokenize(text)
        if not tokens:
            return 0
        
        # 初始化权重向量
        v = [0] * self.bits
        
        # 计算每个token的hash并更新权重
        for token in tokens:
            token_hash = self._token_hash(token)
            for i in range(self.bits):
                if token_hash & (1 << i):
                    v[i] += 1
                else:
                    v[i] -= 1
        
        # 生成最终hash
        fingerprint = 0
        for i in range(self.bits):
            if v[i] > 0:
                fingerprint |= (1 << i)
        
        return fingerprint
    
    def _tokenize(self, text: str) -> List[str]:
        """简单分词"""
        # 去除标点，按空格分割，提取n-gram
        text = re.sub(r'[^\w\u4e00-\u9fff]', ' ', text)
        words = text.split()
        
        # 对于中文，也按字符分割
        tokens = []
        for word in words:
            if len(word) <= 2:
                tokens.append(word)
            else:
                # 生成2-gram
                for i in range(len(word) - 1):
                    tokens.append(word[i:i+2])
        
        return tokens
    
    def _token_hash(self, token: str) -> int:
        """计算单个token的hash值"""
        h = hashlib.md5(token.encode('utf-8')).digest()
        # 取前8字节作为64位hash
        value = 0
        for i in range(min(8, len(h))):
            value |= h[i] << (8 * i)
        return value
    
    @staticmethod
    def hamming_distance(hash1: int, hash2: int) -> int:
        """计算两个hash的汉明距离"""
        x = hash1 ^ hash2
        count = 0
        while x:
            count += 1
            x &= x - 1
        return count


class SimilarityAnalyzer:
    """文档相似度分析器"""
    
    def __init__(self, distance_threshold: int = 5):
        """
        Args:
            distance_threshold: 汉明距离阈值，小于等于此值认为相似
        """
        self.simhash = SimHash()
        self.distance_threshold = distance_threshold
        self.file_hashes: Dict[str, int] = {}  # 文件路径 -> SimHash值
    
    def reset(self):
        """重置状态"""
        self.file_hashes = {}
    
    def add_document(self, file_path: str, text: str) -> int:
        """
        添加文档并计算SimHash
        
        Returns:
            文档的SimHash值
        """
        # 截取前10000字符计算（避免超长文档影响性能）
        truncated_text = text[:10000] if len(text) > 10000 else text
        hash_value = self.simhash.hash(truncated_text)
        self.file_hashes[file_path] = hash_value
        return hash_value
    
    def find_similar_groups(self) -> List[Dict]:
        """
        查找高相似度文档组
        
        Returns:
            相似文档组列表，每组包含 files(文件列表)、distance(最小汉明距离)、similarity(相似度估算)
        """
        if len(self.file_hashes) < 2:
            return []
        
        file_list = list(self.file_hashes.keys())
        hash_list = [self.file_hashes[f] for f in file_list]
        n = len(file_list)
        
        # 使用并查集来合并相似文档
        parent = list(range(n))
        min_distance = {}  # 记录每对相似文档的最小距离
        
        def find(x):
            if parent[x] != x:
                parent[x] = find(parent[x])
            return parent[x]
        
        def union(x, y, dist):
            px, py = find(x), find(y)
            if px != py:
                parent[px] = py
                key = (min(px, py), max(px, py))
                if key not in min_distance or dist < min_distance[key]:
                    min_distance[key] = dist
        
        # 计算两两距离
        for i in range(n):
            for j in range(i + 1, n):
                dist = SimHash.hamming_distance(hash_list[i], hash_list[j])
                if dist <= self.distance_threshold:
                    union(i, j, dist)
        
        # 收集分组
        groups = defaultdict(list)
        for i in range(n):
            root = find(i)
            groups[root].append(i)
        
        # 构建结果
        result = []
        for root, indices in groups.items():
            if len(indices) > 1:
                files = [file_list[i] for i in indices]
                # 计算组内最小距离
                min_dist = 64
                for i in range(len(indices)):
                    for j in range(i + 1, len(indices)):
                        dist = SimHash.hamming_distance(hash_list[indices[i]], hash_list[indices[j]])
                        min_dist = min(min_dist, dist)
                
                # 估算相似度 (汉明距离0=100%相似，64=0%相似)
                similarity = 1 - (min_dist / 64)
                
                result.append({
                    'files': files,
                    'distance': min_dist,
                    'similarity': round(similarity, 2)
                })
        
        # 按相似度降序排序
        result.sort(key=lambda x: x['similarity'], reverse=True)
        return result
