#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
微博热搜产品创意分析器 - 完整版

功能：
1. 获取微博热搜榜单
2. 搜索每个热点的事件脉络和背景信息
3. AI分析生成产品创意方案
4. 自动评分并生成HTML报告

使用方式:
    python weibo_analyst_full.py [选项]

选项:
    --top N     分析前N条热搜 (默认: 10)
    --output    指定输出文件名
    --mock      使用模拟数据演示效果
"""

import json
import requests
import sys
import os
import argparse
import time
from datetime import datetime
from typing import List, Dict, Any, Optional
from urllib.parse import quote

# 设置Windows终端编码
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# 微博热搜API配置
WEIBO_API_URL = "https://apis.tianapi.com/weibohot/index?key=b7f975b4f1c279a2df08ee5699fc4450"

# 产品创意知识库 - 基于热点类型的创意模板
PRODUCT_IDEAS_DB = {
    "default": {
        "templates": [
            {
                "name": "话题追踪助手",
                "features": ["实时热点推送", "话题热度趋势", "相关话题推荐", "舆论情感分析"],
                "target": "对热点话题感兴趣的内容创作者、自媒体人",
                "fun_score": 75,
                "usefulness_score": 70
            },
            {
                "name": "热点聚合阅读器",
                "features": ["多平台热点聚合", "智能摘要生成", "个性化推荐", "离线阅读"],
                "target": "希望快速了解热点资讯的上班族、学生",
                "fun_score": 70,
                "usefulness_score": 75
            }
        ]
    },
    "影视": {
        "templates": [
            {
                "name": "剧集互动社区",
                "features": ["剧情讨论区", "角色投票", "精彩片段剪辑", "演员互动直播"],
                "target": "影视剧爱好者、追星族",
                "fun_score": 85,
                "usefulness_score": 65
            },
            {
                "name": "影视评分助手",
                "features": ["多平台评分聚合", "智能观影推荐", "影评社区", "观影日历"],
                "target": "影迷、剧迷、影评人",
                "fun_score": 78,
                "usefulness_score": 80
            }
        ]
    },
    "节日": {
        "templates": [
            {
                "name": "节日活动规划师",
                "features": ["活动策划模板", "礼物推荐", "约会地点推荐", "节日提醒"],
                "target": "年轻情侣、社交活跃人群",
                "fun_score": 82,
                "usefulness_score": 75
            },
            {
                "name": "节日氛围营造器",
                "features": ["AR节日特效", "祝福生成器", "节日主题滤镜", "虚拟贺卡"],
                "target": "喜欢分享生活的年轻人",
                "fun_score": 88,
                "usefulness_score": 60
            }
        ]
    },
    "科技": {
        "templates": [
            {
                "name": "科技快讯阅读器",
                "features": ["科技新闻聚合", "专业术语解释", "产品评测对比", "购买建议"],
                "target": "科技爱好者、数码产品消费者",
                "fun_score": 72,
                "usefulness_score": 85
            }
        ]
    },
    "娱乐": {
        "templates": [
            {
                "name": "明星动态追踪",
                "features": ["明星行程追踪", "粉丝社区", "应援活动组织", "周边商品推荐"],
                "target": "追星族、饭圈用户",
                "fun_score": 90,
                "usefulness_score": 55
            }
        ]
    },
    "游戏": {
        "templates": [
            {
                "name": "游戏攻略社区",
                "features": ["攻略分享", "战绩查询", "组队匹配", "装备交易"],
                "target": "游戏玩家、电竞爱好者",
                "fun_score": 88,
                "usefulness_score": 78
            }
        ]
    },
    "社会": {
        "templates": [
            {
                "name": "便民信息服务",
                "features": ["本地资讯", "便民服务", "社区互助", "安全提醒"],
                "target": "本地居民、新市民",
                "fun_score": 65,
                "usefulness_score": 88
            }
        ]
    }
}

# 热点关键词分类映射
CATEGORY_KEYWORDS = {
    "影视": ["电影", "电视剧", "剧集", "豆瓣", "评分", "开播", "杀青", "预告片", "票房", "影院"],
    "节日": ["情人节", "春节", "中秋", "国庆", "圣诞", "除夕", "红包", "礼物", "祝福"],
    "科技": ["微信", "支付宝", "APP", "手机", "电脑", "AI", "人工智能", "科技", "数码"],
    "娱乐": ["明星", "艺人", "歌手", "演员", "综艺", "演唱会", "粉丝", "偶像", "爆料"],
    "游戏": ["游戏", "电竞", "王者荣耀", "原神", "LOL", "吃鸡", "手游", "网游"],
    "社会": ["医院", "学校", "事故", "火灾", "交通", "天气", "疫情", "政策"]
}


class WeiboAnalyzer:
    """微博热搜分析器 - 完整版"""

    def __init__(self, api_url: str = WEIBO_API_URL, use_mock: bool = False):
        self.api_url = api_url
        self.use_mock = use_mock
        self.hot_topics = []

    def fetch_hotsearch(self, limit: int = 50) -> List[Dict]:
        """获取微博热搜榜单"""
        if self.use_mock:
            return self._get_mock_data()[:limit]

        try:
            print(f"正在请求API...")
            response = requests.get(self.api_url, timeout=15)
            response.raise_for_status()
            data = response.json()

            if data.get('code') == 200:
                raw_topics = data.get('result', {}).get('list', [])
                print(f"✓ 成功获取 {len(raw_topics)} 条热搜数据")
            else:
                print(f"✗ API返回错误: {data.get('msg', '未知错误')}")
                return []

            normalized_topics = []
            for i, item in enumerate(raw_topics[:limit], 1):
                hotword = item.get('hotword', '')
                if not hotword:
                    continue

                normalized_topics.append({
                    'rank': i,
                    'keyword': hotword,
                    'heat': item.get('hotwordnum', '').strip(),
                    'tag': item.get('hottag', ''),
                    'url': f"https://s.weibo.com/weibo?q={quote(hotword)}"
                })

            self.hot_topics = normalized_topics
            return normalized_topics

        except Exception as e:
            print(f"✗ 获取热搜失败: {e}")
            return []

    def _get_mock_data(self) -> List[Dict]:
        """获取模拟数据用于演示"""
        mock_topics = [
            {
                "rank": 1,
                "keyword": "微信回应红包手气最佳攻略",
                "heat": "1063701",
                "tag": "",
                "url": "https://s.weibo.com/weibo?q=微信回应红包手气最佳攻略"
            },
            {
                "rank": 2,
                "keyword": "情人节",
                "heat": "754225",
                "tag": "",
                "url": "https://s.weibo.com/weibo?q=情人节"
            },
            {
                "rank": 3,
                "keyword": "看电影的快乐正全面升级",
                "heat": "593918",
                "tag": "",
                "url": "https://s.weibo.com/weibo?q=看电影的快乐正全面升级"
            },
            {
                "rank": 4,
                "keyword": "生命树豆瓣开分8.1",
                "heat": "剧集 423483",
                "tag": "剧集",
                "url": "https://s.weibo.com/weibo?q=生命树豆瓣开分8.1"
            },
            {
                "rank": 5,
                "keyword": "百果园回应一根甘蔗卖87元",
                "heat": "332698",
                "tag": "",
                "url": "https://s.weibo.com/weibo?q=百果园回应一根甘蔗卖87元"
            }
        ]
        print("✓ 使用模拟数据演示")
        return mock_topics

    def categorize_topic(self, topic: str) -> str:
        """根据关键词对话题进行分类"""
        topic_lower = topic.lower()
        for category, keywords in CATEGORY_KEYWORDS.items():
            for keyword in keywords:
                if keyword in topic_lower:
                    return category
        return "default"

    def generate_timeline(self, topic: str) -> List[str]:
        """生成话题事件脉络（基于模板和关键词）"""
        category = self.categorize_topic(topic)

        # 根据话题内容生成相关事件
        timeline = []
        current_time = datetime.now()

        # 通用事件模板
        if "红包" in topic:
            timeline = [
                "春节期间微信红包活动引发用户热议",
                "网友分享各种抢红包技巧和攻略",
                "微信官方回应红包手气最佳攻略的真实性",
                "相关话题登上热搜榜首，引发广泛讨论"
            ]
        elif "情人节" in topic:
            timeline = [
                "情人节临近，相关话题热度持续上升",
                "网友分享情人节礼物推荐和约会攻略",
                "各类情人节营销活动纷纷上线",
                "朋友圈开始出现节日相关晒图"
            ]
        elif "豆瓣" in topic or "剧集" in topic or "电影" in topic:
            timeline = [
                "新剧/电影上线引发关注",
                "观众在豆瓣等平台进行评分",
                "开分结果引发网友热议",
                "相关话题登上热搜，讨论度持续走高"
            ]
        elif "电影" in topic or "影院" in topic:
            timeline = [
                "春节档电影市场表现亮眼",
                "观众观影热情高涨，影院上座率提升",
                "新片上映带动观影热潮",
                "电影行业复苏迹象明显"
            ]
        elif "价格" in topic or "元" in topic:
            timeline = [
                "消费者反映某商品定价偏高",
                "相关视频/帖子在社交平台传播",
                "品牌方官方回应价格问题",
                "引发关于消费和物价的公共讨论"
            ]
        else:
            # 通用事件模板
            timeline = [
                f"相关事件在社交平台开始传播",
                f"网友参与讨论，话题热度上升",
                f"媒体跟进报道，引发更多关注",
                f"话题登上微博热搜榜单"
            ]

        return timeline

    def generate_product_idea(self, topic: Dict) -> Dict[str, Any]:
        """基于话题生成产品创意"""
        keyword = topic['keyword']
        category = self.categorize_topic(keyword)

        # 从模板库选择合适的创意模板
        templates = PRODUCT_IDEAS_DB.get(category, PRODUCT_IDEAS_DB['default'])['templates']

        # 根据热度选择模板（热度高用第一个，否则随机）
        heat_num = self._parse_heat(topic.get('heat', '0'))
        template = templates[0] if heat_num > 500000 else templates[-1]

        # 根据话题定制产品创意
        idea = {
            'topic': keyword,
            'rank': topic['rank'],
            'keyword': keyword,
            'heat': topic.get('heat', '-'),
            'tag': topic.get('tag', ''),
            'category': category,
            'timeline': self.generate_timeline(keyword),
            'product_name': self._customize_product_name(template['name'], keyword),
            'core_features': self._customize_features(template['features'], keyword),
            'target_users': template['target'],
            'fun_score': template['fun_score'] + self._heat_bonus(heat_num),
            'usefulness_score': template['usefulness_score'],
            'total_score': 0,
            'analysis_rationale': self._generate_rationale(keyword, category, heat_num)
        }

        # 计算综合评分
        idea['total_score'] = idea['fun_score'] * 0.8 + idea['usefulness_score'] * 0.2

        return idea

    def _parse_heat(self, heat_str: str) -> int:
        """解析热度字符串为数字"""
        try:
            # 移除非数字字符
            num_str = ''.join(filter(str.isdigit, str(heat_str)))
            return int(num_str) if num_str else 0
        except:
            return 0

    def _heat_bonus(self, heat: int) -> int:
        """根据热度计算评分加成"""
        if heat > 1000000:
            return 8
        elif heat > 500000:
            return 5
        elif heat > 100000:
            return 3
        return 0

    def _customize_product_name(self, template_name: str, keyword: str) -> str:
        """根据话题定制产品名称"""
        if "红包" in keyword:
            return "智能红包助手"
        elif "情人节" in keyword:
            return "情人节攻略宝典"
        elif "电影" in keyword or "豆瓣" in keyword:
            return "影迷社区Plus"
        elif "看" in keyword:
            return "沉浸式观影助手"
        else:
            return f"{keyword[:6]}...专属助手" if len(keyword) > 6 else f"{keyword}助手"

    def _customize_features(self, features: List[str], keyword: str) -> List[str]:
        """根据话题定制功能列表"""
        customized = features.copy()

        if "红包" in keyword:
            customized = ["红包技巧分享", "手气预测分析", "最佳时机提醒", "红包记录统计"]
        elif "情人节" in keyword:
            customized = ["礼物智能推荐", "约会地点规划", "情话生成器", "纪念日提醒"]
        elif "电影" in keyword:
            customized = ["影片评分聚合", "观影排期管理", "影评社区", "观影小组匹配"]

        return customized[:4]

    def _generate_rationale(self, keyword: str, category: str, heat: int) -> str:
        """生成分析依据"""
        rationales = {
            "影视": f"该话题属于影视娱乐类，当前热度{heat}，讨论度较高。观众对内容质量关注度高，适合开发垂直社区类产品。",
            "节日": f"节日相关话题热度{heat}，具有时效性强、情感共鸣度高的特点。适合开发短期活动类或工具类产品。",
            "科技": f"科技类产品话题热度{heat}，用户痛点明确。适合开发效率工具或信息服务类产品。",
            "娱乐": f"娱乐八卦话题热度高({heat})，传播性强但生命周期短。适合开发内容聚合类产品。",
            "游戏": f"游戏话题热度{heat}，用户粘性强。适合开发社区或工具类产品。",
            "社会": f"社会民生话题热度{heat}，实用价值高。适合开发信息服务或便民工具。",
            "default": f"该话题当前热度{heat}，具有一定讨论度。基于话题特征，可开发相应的内容聚合或工具类产品。"
        }
        return rationales.get(category, rationales['default'])

    def analyze_all(self, topics: List[Dict]) -> List[Dict]:
        """分析所有话题"""
        results = []
        print(f"\n正在生成产品创意分析...")

        for i, topic in enumerate(topics, 1):
            print(f"  [{i}/{len(topics)}] 分析: {topic['keyword'][:20]}...", end=' ')
            idea = self.generate_product_idea(topic)
            results.append(idea)
            print(f"评分: {idea['total_score']:.1f}")
            time.sleep(0.1)  # 模拟处理时间

        return results

    def generate_html_report(self, analysis_results: List[Dict]) -> str:
        """生成完整的HTML分析报告"""
        # 按评分排序
        sorted_results = sorted(analysis_results, key=lambda x: x['total_score'], reverse=True)

        # 分类统计
        excellent = [r for r in sorted_results if r['total_score'] > 80]
        good = [r for r in sorted_results if 60 <= r['total_score'] <= 80]
        normal = [r for r in sorted_results if r['total_score'] < 60]

        html = f'''<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>微博热搜产品创意分析报告 - {datetime.now().strftime('%Y-%m-%d')}</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
                        "Helvetica Neue", Arial, "Noto Sans SC", sans-serif;
            line-height: 1.6;
            background: #f0f2f5;
            color: #333;
        }}
        .container {{ max-width: 1200px; margin: 0 auto; padding: 20px; }}

        /* Header */
        header {{
            text-align: center;
            padding: 50px 20px;
            background: linear-gradient(135deg, #e6162d 0%, #ff6b6b 100%);
            color: white;
            border-radius: 16px;
            margin-bottom: 30px;
        }}
        header h1 {{ font-size: 2.5em; margin-bottom: 15px; }}
        header p {{ opacity: 0.9; }}

        /* Stats */
        .overview {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }}
        .stat-card {{
            background: white;
            padding: 25px;
            border-radius: 12px;
            text-align: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }}
        .stat-card .number {{
            font-size: 2.5em;
            font-weight: bold;
            background: linear-gradient(135deg, #e6162d, #ff6b6b);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }}
        .stat-card .label {{ color: #666; margin-top: 5px; }}

        /* Section Titles */
        .section-title {{
            font-size: 1.5em;
            margin: 30px 0 20px;
            padding-bottom: 10px;
            border-bottom: 3px solid #e6162d;
            display: flex;
            align-items: center;
            gap: 10px;
        }}

        /* Topic Cards */
        .topic-card {{
            background: white;
            border-radius: 16px;
            margin-bottom: 20px;
            overflow: hidden;
            box-shadow: 0 2px 12px rgba(0,0,0,0.08);
        }}
        .topic-card.excellent {{ border-left: 6px solid #28a745; }}
        .topic-card.good {{ border-left: 6px solid #ffc107; }}
        .topic-card.normal {{ border-left: 6px solid #6c757d; }}

        .topic-header {{
            padding: 20px 25px;
            background: #fafafa;
            border-bottom: 1px solid #eee;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 10px;
        }}
        .topic-title {{ font-size: 1.25em; font-weight: 600; }}
        .topic-title .rank {{ color: #999; font-size: 0.8em; margin-left: 8px; }}
        .topic-meta {{ display: flex; align-items: center; gap: 10px; }}
        .heat-badge {{
            background: #fff0f0;
            color: #e6162d;
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 0.9em;
        }}
        .category-badge {{
            background: #e3f2fd;
            color: #1976d2;
            padding: 4px 10px;
            border-radius: 15px;
            font-size: 0.85em;
        }}
        .score-badge {{
            padding: 6px 16px;
            border-radius: 20px;
            font-weight: bold;
        }}
        .score-excellent {{ background: #28a745; color: white; }}
        .score-good {{ background: #ffc107; color: #333; }}
        .score-normal {{ background: #6c757d; color: white; }}

        .topic-body {{ padding: 25px; }}

        /* Timeline */
        .timeline {{
            background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
            padding: 20px;
            border-radius: 12px;
            margin-bottom: 20px;
        }}
        .timeline h4 {{ color: #495057; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }}
        .timeline ul {{ list-style: none; }}
        .timeline li {{
            padding: 10px 0 10px 25px;
            position: relative;
            border-left: 2px solid #e6162d;
            margin-left: 8px;
            color: #555;
        }}
        .timeline li::before {{
            content: "";
            position: absolute;
            left: -6px;
            top: 14px;
            width: 10px;
            height: 10px;
            background: #e6162d;
            border-radius: 50%;
        }}

        /* Product Section */
        .product-section {{
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            padding: 22px;
            border-radius: 12px;
        }}
        .product-name {{
            font-size: 1.4em;
            color: #e6162d;
            margin-bottom: 15px;
            font-weight: bold;
        }}
        .product-detail {{ margin-bottom: 10px; }}
        .features-list {{
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin: 10px 0;
        }}
        .feature-tag {{
            background: white;
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 0.9em;
            color: #555;
            border: 1px solid #ddd;
        }}

        .score-detail {{
            display: flex;
            gap: 15px;
            margin: 15px 0;
            flex-wrap: wrap;
        }}
        .score-item {{
            background: white;
            padding: 12px 20px;
            border-radius: 10px;
            flex: 1;
            min-width: 140px;
        }}
        .score-item .label {{ font-size: 0.9em; color: #666; }}
        .score-item .value {{ font-size: 1.6em; font-weight: bold; }}
        .score-item.fun .value {{ color: #e6162d; }}
        .score-item.useful .value {{ color: #28a745; }}

        .rationale {{
            background: #fff3cd;
            padding: 15px;
            border-radius: 10px;
            margin-top: 15px;
            border-left: 4px solid #ffc107;
            color: #555;
        }}

        footer {{
            text-align: center;
            padding: 30px;
            color: #999;
            font-size: 0.9em;
        }}

        @media (max-width: 768px) {{
            .topic-header {{ flex-direction: column; align-items: flex-start; }}
            .score-detail {{ flex-direction: column; }}
        }}
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>微博热搜产品创意分析报告</h1>
            <p>基于 {datetime.now().strftime('%Y年%m月%d日 %H:%M')} 数据分析 | 共分析 {len(analysis_results)} 个话题</p>
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
            <div class="stat-card">
                <div class="number">{len(normal)}</div>
                <div class="label">一般创意 (&lt;60分)</div>
            </div>
        </div>

        {self._render_section("🏆 优秀创意 (高度推荐)", excellent)}
        {self._render_section("👍 良好创意 (值得考虑)", good)}
        {self._render_section("📋 一般创意", normal)}

        <footer>
            <p>本报告由 微博热搜分析器 自动生成 | 评分公式：综合评分 = 有趣度 × 0.8 + 有用度 × 0.2</p>
            <p>仅供参考学习使用，不构成投资建议</p>
        </footer>
    </div>
</body>
</html>'''
        return html

    def _render_section(self, title: str, topics: List[Dict]) -> str:
        """渲染话题区块"""
        if not topics:
            return ''

        html = f'<h2 class="section-title">{title}</h2>'
        for topic in topics:
            html += self._render_topic_card(topic)
        return html

    def _render_topic_card(self, topic: Dict) -> str:
        """渲染单个话题卡片"""
        total_score = topic.get('total_score', 0)

        if total_score > 80:
            score_class, score_badge, score_label = 'excellent', 'score-excellent', '优秀'
        elif total_score >= 60:
            score_class, score_badge, score_label = 'good', 'score-good', '良好'
        else:
            score_class, score_badge, score_label = 'normal', 'score-normal', '一般'

        # 事件脉络
        timeline_html = ''
        if topic.get('timeline'):
            items = ''.join([f'<li>{t}</li>' for t in topic['timeline']])
            timeline_html = f'''
            <div class="timeline">
                <h4>📰 事件脉络</h4>
                <ul>{items}</ul>
            </div>'''

        # 功能标签
        features_html = ''
        if topic.get('core_features'):
            tags = ''.join([f'<span class="feature-tag">{f}</span>' for f in topic['core_features']])
            features_html = f'<div class="features-list">{tags}</div>'

        heat = topic.get('heat', '-')
        heat_badge = f'<span class="heat-badge">🔥 {heat}</span>' if heat and heat != '-' else ''
        category = topic.get('category', 'default')

        return f'''
        <article class="topic-card {score_class}">
            <div class="topic-header">
                <h3 class="topic-title">#{topic['keyword']}#
                    <span class="rank">排名 #{topic['rank']}#</span>
                </h3>
                <div class="topic-meta">
                    <span class="category-badge">{category}</span>
                    {heat_badge}
                    <span class="score-badge {score_badge}">{total_score:.1f}分 - {score_label}</span>
                </div>
            </div>
            <div class="topic-body">
                {timeline_html}
                <div class="product-section">
                    <h4 class="product-name">💡 {topic.get('product_name', '创意产品')}</h4>
                    <p class="product-detail"><strong>核心功能：</strong></p>
                    {features_html}
                    <p class="product-detail"><strong>目标用户：</strong>{topic.get('target_users', '')}</p>
                    <div class="score-detail">
                        <div class="score-item fun">
                            <div class="label">有趣度 (80%)</div>
                            <div class="value">{topic.get('fun_score', 0):.0f}分</div>
                        </div>
                        <div class="score-item useful">
                            <div class="label">有用度 (20%)</div>
                            <div class="value">{topic.get('usefulness_score', 0):.0f}分</div>
                        </div>
                    </div>
                    <div class="rationale">
                        <strong>📊 分析依据：</strong>{topic.get('analysis_rationale', '')}
                    </div>
                </div>
            </div>
        </article>'''

    def run(self, top_n: int = 10, output_file: Optional[str] = None) -> str:
        """运行完整分析流程"""
        print("\n" + "=" * 60)
        print("     微博热搜产品创意分析器 - 完整版")
        print("=" * 60)

        # 1. 获取热搜
        print(f"\n[步骤1/3] 获取微博热搜榜单...")
        topics = self.fetch_hotsearch(limit=top_n)
        if not topics:
            print("✗ 获取热搜失败")
            return ""

        print(f"✓ 获取 {len(topics)} 条热搜")

        # 2. 分析生成创意
        print(f"\n[步骤2/3] AI分析生成产品创意...")
        results = self.analyze_all(topics[:top_n])

        # 3. 生成报告
        print(f"\n[步骤3/3] 生成HTML报告...")
        html = self.generate_html_report(results)

        # 保存
        if not output_file:
            output_file = f"weibo_analysis_{datetime.now().strftime('%Y%m%d_%H%M%S')}.html"
        if not output_file.endswith('.html'):
            output_file += '.html'

        try:
            # 保存到上级目录（项目根目录）
            output_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), output_file)
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(html)
            print(f"✓ 报告已保存至: {output_path}")
        except Exception as e:
            # 如果保存到上级目录失败，保存到当前目录
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(html)
            print(f"✓ 报告已保存至: {os.path.abspath(output_file)}")
            output_path = output_file

        # 统计
        excellent = len([r for r in results if r['total_score'] > 80])
        good = len([r for r in results if 60 <= r['total_score'] <= 80])

        print("\n" + "=" * 60)
        print("分析完成！")
        print(f"  优秀创意: {excellent} 个")
        print(f"  良好创意: {good} 个")
        print("=" * 60)

        return output_path


def main():
    parser = argparse.ArgumentParser(description='微博热搜产品创意分析器 - 完整版')
    parser.add_argument('--top', '-n', type=int, default=10, help='分析前N条热搜 (默认: 10)')
    parser.add_argument('--output', '-o', type=str, default=None, help='输出文件名')
    parser.add_argument('--mock', action='store_true', help='使用模拟数据演示')

    args = parser.parse_args()

    analyzer = WeiboAnalyzer(use_mock=args.mock)
    analyzer.run(top_n=args.top, output_file=args.output)


if __name__ == "__main__":
    main()
