
import json
import os
from datetime import datetime
from jinja2 import Environment, FileSystemLoader
from models.schemas import ScanResult

def format_size(size_bytes: int) -> str:
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    else:
        return f"{size_bytes / (1024 * 1024):.1f} MB"

def generate_export_html(result: ScanResult, template_dir: str) -> str:
    """
    根据扫描结果生成HTML导出报告
    """
    # 初始化Jinja2环境
    env = Environment(loader=FileSystemLoader(template_dir))
    template = env.get_template('report_template.html')

    # 1. 概况数据 (Overview)
    total_size_mb = f"{result.total_size / (1024 * 1024):.1f}"
    
    # 需OCR文件 (Scan PDF)
    ocr_files = result.ocr_files or []
    ocr_count = len(ocr_files)
    
    # 解析失败/需审核文件
    # review_files 可能包含 failed 和 complex，这里严格筛选 parse_success=False
    review_files = result.review_files or []
    failed_count = sum(1 for f in review_files if not f.file_info.parse_success)
    
    # 计算可解析率
    parse_success_rate = 0
    if result.total_files > 0:
        # 简单认为：只要不是明确的 failed 就是 success (包含 scan_pdf 虽然要 ocr 但属于可处理范畴，这里failed单纯指解析报错)
        # 或者更严格：success = 总数 - failed
        parse_success_rate = int(((result.total_files - failed_count) / result.total_files) * 100)

    # 2. 长度统计 (Length Stats)
    # result.length_stats 是 LengthStats 对象
    length_stats = {
        'min_len': f"{result.length_stats.min:,}",
        'p25': f"{result.length_stats.p25:,}",
        'p50': f"{result.length_stats.median:,}",
        'p75': f"{result.length_stats.p75:,}",
        'p90': f"{result.length_stats.p90:,}",
        'max_len': f"{result.length_stats.max:,}"
    }

    # 3. 结构统计 (Structure Stats)
    # result.structure_stats 是 StructureStats 对象
    structure_stats = {
        'docs_with_table': f"{result.structure_stats.docs_with_tables:,}",
        'docs_with_image': f"{result.structure_stats.docs_with_images:,}"
    }

    # 4. 风险统计 (Risk Stats)
    risk_stats = {
        'ocr_count': ocr_count,
        'failed_count': failed_count,
        'similar_groups': len(result.similar_groups),
    }

    # 5. Top 10 复杂文件 (脱敏)
    # 策略：按文件大小降序，优先展示非 Simple 类型的文件
    all_files = result.files or []
    
    # 按大小降序
    sorted_by_size = sorted(all_files, key=lambda f: f.file_info.size, reverse=True)
    
    # 优先选出 非Simple 的 (Complex / Medium)
    complex_candidates = [f for f in sorted_by_size if f.category.value != 'simple']
    
    # 取前10个
    top_candidates = complex_candidates[:10]
    # 如果不足10个，用剩余的大文件补足
    if len(top_candidates) < 10:
        remaining = [f for f in sorted_by_size if f not in top_candidates]
        top_candidates.extend(remaining[:(10 - len(top_candidates))])
        
    top_files_data = []
    for idx, f in enumerate(top_candidates):
        # 格式化 metrics 字符串
        metrics_parts = []
        metrics_parts.append(f"{f.metrics.char_count} chars")
        if f.metrics.image_count > 0:
            metrics_parts.append(f"{f.metrics.image_count} imgs")
        if f.metrics.table_count > 0:
            metrics_parts.append(f"{f.metrics.table_count} tables")
        if f.metrics.page_count > 0:
            metrics_parts.append(f"{f.metrics.page_count} pages")
            
        metrics_str = ", ".join(metrics_parts) if metrics_parts else "No metrics"
        
        # 扩展名处理
        ext = f.file_info.extension.lstrip('.').upper()
        if not ext:
            ext = "FILE"
            
        top_files_data.append({
            'id': f"FILE_{str(idx+1).zfill(4)}_{ext}",
            'type': f.file_info.file_type.value,
            'size': format_size(f.file_info.size),
            'tag': f.quality_tag,
            'metrics': metrics_str
        })

    # 6. 图表数据 (Charts Data)
    # 格式分布
    fmt_dist = [{'name': k, 'value': v} for k, v in result.format_distribution.items() if v > 0]
    
    # 长度分布
    ls = result.length_stats
    len_dist = [
        {'name': '<500', 'value': ls.under_500},
        {'name': '500-2K', 'value': ls.range_500_2000},
        {'name': '2K-5K', 'value': ls.range_2000_5000},
        {'name': '5K-10K', 'value': ls.range_5000_10000},
        {'name': '>10K', 'value': ls.over_10000}
    ]
    
    charts_data = json.dumps({
        'format': fmt_dist,
        'length': len_dist
    })

    # 渲染HTML
    html_content = template.render(
        generated_time=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        total_files=f"{result.total_files:,}",
        total_size_mb=total_size_mb,
        parse_success_rate=parse_success_rate,
        length_stats=length_stats,
        structure_stats=structure_stats,
        risk_stats=risk_stats,
        top_files=top_files_data,
        charts_data=charts_data
    )
    
    return html_content
