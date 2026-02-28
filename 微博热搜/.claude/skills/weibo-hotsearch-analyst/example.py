#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
微博热搜产品创意分析器 - 示例脚本

本脚本展示如何使用Claude Code Skills进行微博热搜产品创意分析。
实际使用时，Claude会自动调用WebSearch等工具获取信息。

使用前请确保：
1. 安装依赖：pip install requests beautifulsoup4
2. 配置Claude Code环境
"""

import json
import requests
import sys
import os
from datetime import datetime
from typing import List, Dict, Any

# 设置Windows终端编码
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# =====================================
# 微博热搜API配置（用户提供的接口）
WEIBO_API_URL = "https://apis.tianapi.com/weibohot/index?key=b7f975b4f1c279a2df08ee5699fc4450"
# =====================================

class WeiboHotsearchAnalyst:
    """微博热搜产品创意分析器"""

    def __init__(self, api_url: str):
        self.api_url = api_url
        self.hot_topics = []

    def fetch_hotsearch(self) -> List[Dict]:
        """获取微博热搜榜单"""
        try:
            response = requests.get(self.api_url, timeout=10)
            response.raise_for_status()
            data = response.json()

            # 天行API返回格式: {"code": 200, "msg": "success", "result": {"list": [...]}}
            if data.get('code') == 200:
                self.hot_topics = data.get('result', {}).get('list', [])
            else:
                print(f"API返回错误: {data.get('msg')}")
                self.hot_topics = []

            # 转换为统一格式
            normalized_topics = []
            for i, item in enumerate(self.hot_topics, 1):
                normalized_topics.append({
                    'rank': i,
                    'keyword': item.get('hotword', ''),
                    'heat': item.get('hotwordnum', '').strip(),
                    'tag': item.get('hottag', ''),
                    'url': f"https://s.weibo.com/weibo/{item.get('hotword', '')}"
                })

            self.hot_topics = normalized_topics
            return self.hot_topics
        except Exception as e:
            print(f"获取热搜失败: {e}")
            return []

    def search_topic_background(self, topic: str) -> Dict[str, Any]:
        """
        搜索话题背景信息
        注意：实际使用时，Claude会自动调用WebSearch工具
        """
        # 这里模拟搜索结果，实际会调用WebSearch
        return {
            "topic": topic,
            "news": [],
            "timeline": [],
            "public_opinion": ""
        }

    def analyze_product_idea(self, topic_info: Dict) -> Dict[str, Any]:
        """
        AI分析生成产品创意
        评分公式：综合评分 = 有趣度 × 0.8 + 有用度 × 0.2
        """
        topic = topic_info.get('keyword', topic_info.get('topic', ''))

        # 模拟AI分析结果，实际由Claude生成
        idea = {
            "topic": topic,
            "rank": topic_info.get('rank', 0),
            "product_name": "",
            "core_features": [],
            "target_users": "",
            "fun_score": 0,
            "usefulness_score": 0,
            "total_score": 0,
            "analysis_rationale": "",
            "timeline": []
        }
        return idea

    def generate_html_report(self, analysis_results: List[Dict]) -> str:
        """生成HTML分析报告"""
        excellent = [r for r in analysis_results if r['total_score'] > 80]
        good = [r for r in analysis_results if 60 <= r['total_score'] <= 80]
        normal = [r for r in analysis_results if r['total_score'] < 60]

        html = f'''<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>微博热搜产品创意分析报告 - {datetime.now().strftime('%Y-%m-%d')}</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; line-height: 1.6; background: #f5f5f5; color: #333; }}
        .container {{ max-width: 1200px; margin: 0 auto; padding: 20px; }}
        header {{ text-align: center; padding: 40px 20px; background: linear-gradient(135deg, #e6162d 0%, #ff6b6b 100%); color: white; border-radius: 12px; margin-bottom: 30px; }}
        header h1 {{ font-size: 2.5em; margin-bottom: 10px; }}
        header p {{ opacity: 0.9; font-size: 1.1em; }}
        .overview {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }}
        .stat-card {{ background: white; padding: 25px; border-radius: 12px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }}
        .stat-card .number {{ font-size: 2.5em; font-weight: bold; color: #e6162d; }}
        .stat-card .label {{ color: #666; margin-top: 5px; }}
        .section-title {{ font-size: 1.5em; margin: 30px 0 20px; padding-bottom: 10px; border-bottom: 3px solid #e6162d; display: flex; align-items: center; gap: 10px; }}
        .section-title .icon {{ font-size: 1.2em; }}
        .topic-card {{ background: white; border-radius: 12px; margin-bottom: 20px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }}
        .topic-card.excellent {{ border-left: 5px solid #28a745; }}
        .topic-card.good {{ border-left: 5px solid #ffc107; }}
        .topic-card.normal {{ border-left: 5px solid #6c757d; }}
        .topic-header {{ padding: 20px 25px; background: #fafafa; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px; }}
        .topic-title {{ font-size: 1.3em; color: #333; }}
        .topic-title span {{ color: #999; font-size: 0.85em; font-weight: normal; }}
        .score-badge {{ padding: 8px 20px; border-radius: 25px; font-weight: bold; font-size: 1.1em; }}
        .score-excellent {{ background: #28a745; color: white; }}
        .score-good {{ background: #ffc107; color: #333; }}
        .score-normal {{ background: #6c757d; color: white; }}
        .topic-body {{ padding: 25px; }}
        .timeline {{ background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }}
        .timeline h4 {{ color: #495057; margin-bottom: 12px; font-size: 1.1em; }}
        .timeline ul {{ list-style: none; padding-left: 0; }}
        .timeline li {{ padding: 8px 0; padding-left: 25px; position: relative; border-left: 2px solid #e6162d; margin-left: 10px; }}
        .timeline li::before {{ content: "•"; position: absolute; left: 8px; color: #e6162d; font-weight: bold; }}
        .product-section {{ background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 20px; border-radius: 8px; }}
        .product-name {{ font-size: 1.4em; color: #e6162d; margin-bottom: 15px; font-weight: bold; }}
        .product-detail {{ margin-bottom: 10px; }}
        .product-detail strong {{ color: #495057; }}
        .score-detail {{ display: flex; gap: 20px; margin: 15px 0; flex-wrap: wrap; }}
        .score-item {{ background: white; padding: 12px 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }}
        .score-item .label {{ font-size: 0.9em; color: #666; }}
        .score-item .value {{ font-size: 1.5em; font-weight: bold; }}
        .score-item.fun .value {{ color: #e6162d; }}
        .score-item.useful .value {{ color: #28a745; }}
        .rationale {{ background: #fff3cd; padding: 15px; border-radius: 8px; margin-top: 15px; border-left: 4px solid #ffc107; }}
        footer {{ text-align: center; padding: 30px; color: #999; font-size: 0.9em; }}
        @media (max-width: 768px) {{ .topic-header {{ flex-direction: column; align-items: flex-start; }} }}
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>微博热搜产品创意分析报告</h1>
            <p>基于 {datetime.now().strftime('%Y-%m-%d %H:%M')} 数据分析</p>
        </header>

        <div class="overview">
            <div class="stat-card">
                <div class="number">{len(analysis_results)}</div>
                <div class="label">分析话题数</div>
            </div>
            <div class="stat-card">
                <div class="number">{len(excellent)}</div>
                <div class="label">优秀创意 (>80分)</div>
            </div>
            <div class="stat-card">
                <div class="number">{len(good)}</div>
                <div class="label">良好创意 (60-80分)</div>
            </div>
        </div>

        <h2 class="section-title"><span class="icon">🏆</span> 优秀创意</h2>
        {self._render_topics(excellent)}

        <h2 class="section-title"><span class="icon">👍</span> 良好创意</h2>
        {self._render_topics(good)}

        <h2 class="section-title"><span class="icon">📋</span> 其他创意</h2>
        {self._render_topics(normal)}

        <footer>
            <p>本报告由 Claude Code Skills 自动生成，仅供参考</p>
        </footer>
    </div>
</body>
</html>'''
        return html

    def _render_topics(self, topics: List[Dict]) -> str:
        """渲染话题列表HTML"""
        if not topics:
            return '<p style="color: #999; padding: 20px;">暂无相关内容</p>'

        html = ''
        for topic in topics:
            score_class = 'excellent' if topic['total_score'] > 80 else ('good' if topic['total_score'] >= 60 else 'normal')
            score_badge = 'score-excellent' if topic['total_score'] > 80 else ('score-good' if topic['total_score'] >= 60 else 'score-normal')
            score_label = '优秀' if topic['total_score'] > 80 else ('良好' if topic['total_score'] >= 60 else '一般')

            timeline_html = ''
            if topic.get('timeline'):
                timeline_html = f'''
            <div class="timeline">
                <h4>事件脉络</h4>
                <ul>
                    {"".join([f"<li>{t}</li>" for t in topic['timeline']])}
                </ul>
            </div>'''

            features_html = ''
            if topic.get('core_features'):
                features_html = f"<p><strong>核心功能：</strong>{'、'.join(topic['core_features'])}</p>"

            topic_name = topic['topic']
            rank_num = topic['rank']
            html += f'''
        <article class="topic-card {score_class}">
            <div class="topic-header">
                <h3 class="topic-title">#{topic_name}# <span>排名 #{rank_num}#</span></h3>
                <span class="score-badge {score_badge}">{topic['total_score']:.1f}分 - {score_label}</span>
            </div>
            <div class="topic-body">
                {timeline_html}
                <div class="product-section">
                    <h4 class="product-name">{topic.get('product_name', '待生成产品创意')}</h4>
                    {features_html}
                    <p><strong>目标用户：</strong>{topic.get('target_users', '待分析')}</p>
                    <div class="score-detail">
                        <div class="score-item fun">
                            <div class="label">有趣度 (权重80%)</div>
                            <div class="value">{topic['fun_score']:.1f}分</div>
                        </div>
                        <div class="score-item useful">
                            <div class="label">有用度 (权重20%)</div>
                            <div class="value">{topic['usefulness_score']:.1f}分</div>
                        </div>
                    </div>
                    <div class="rationale">
                        <strong>分析依据：</strong>{topic.get('analysis_rationale', '暂无分析')}
                    </div>
                </div>
            </div>
        </article>'''
        return html

    def run_analysis(self) -> str:
        """运行完整分析流程"""
        print("=" * 50)
        print("微博热搜产品创意分析器")
        print("=" * 50)

        # 1. 获取热搜
        print("\n[1/4] 正在获取微博热搜榜单...")
        topics = self.fetch_hotsearch()
        if not topics:
            print("获取热搜失败，请检查API配置")
            return ""

        print(f"成功获取 {len(topics)} 条热搜")

        # 2. 搜索背景（Claude会自动调用WebSearch）
        print("\n[2/4] 正在搜索热点背景信息...")
        topics_info = []
        for i, topic in enumerate(topics[:15], 1):  # 分析前15条
            print(f"  搜索中: {topic.get('keyword', topic.get('topic', f'话题#{i}'))}...")
            info = self.search_topic_background(topic)
            topics_info.append(info)

        # 3. AI分析创意（Claude会自动分析）
        print("\n[3/4] 正在AI分析生成产品创意...")
        results = []
        for info in topics_info:
            result = self.analyze_product_idea(info)
            results.append(result)

        # 4. 生成报告
        print("\n[4/4] 正在生成HTML报告...")
        html_report = self.generate_html_report(results)

        # 保存报告
        filename = f"weibo_analysis_{datetime.now().strftime('%Y%m%d_%H%M%S')}.html"
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(html_report)

        print(f"\n分析完成！报告已保存至: {filename}")
        return filename


def main():
    """主函数"""
    analyst = WeiboHotsearchAnalyst(WEIBO_API_URL)
    analyst.run_analysis()


if __name__ == "__main__":
    main()
