"""
Mock AI Service
用于演示和开发环境，不需要OpenAI API
"""
import random
from typing import List, Dict


def generate_mock_insight(content: str) -> str:
    """生成Mock AI洞察"""
    insights = [
        f"根据您的内容'{content[:20]}...'，建议您可以尝试以下几点：\n1. 保持积极的学习态度\n2. 制定合理的学习计划\n3. 定期复习已学内容",
        f"分析您的描述，我注意到几个关键点：\n- 学习进度良好\n- 可以适当增加练习量\n- 建议多做实践项目",
        f"基于AI分析，您的学习状态不错！\n建议：\n1. 继续保持当前节奏\n2. 可以尝试更有挑战性的内容\n3. 多与同学交流学习经验",
        f"从您的记录来看：\n- 学习态度认真\n- 时间管理较好\n建议下一步：多做综合性练习题",
    ]
    return random.choice(insights)


def generate_schedule_suggestions(
    students: List[Dict], teachers: List[Dict]
) -> List[Dict]:
    """生成Mock排课建议"""
    suggestions = []
    
    for i, student in enumerate(students[:3]):  # 只返回前3个建议
        if i < len(teachers):
            teacher = teachers[i % len(teachers)]
            suggestions.append({
                "student": student.get("name", "学生"),
                "teacher": teacher.get("name", "教师"),
                "time": f"周{random.randint(1, 5)} {random.randint(9, 18)}:00",
                "subject": random.choice(["数学", "英语", "物理", "化学"]),
                "confidence": round(random.uniform(0.75, 0.95), 2),
                "reason": "基于学生水平和教师专长的智能匹配"
            })
    
    return suggestions


def generate_course_content_summary(content: str) -> Dict:
    """生成课程内容摘要（Mock版本）"""
    return {
        "summary": f"本次课程主要内容：{content[:50]}...",
        "key_points": [
            "知识点1：基础概念理解",
            "知识点2：实践应用方法",
            "知识点3：常见问题解答"
        ],
        "difficulty_level": random.choice(["初级", "中级", "高级"]),
        "estimated_duration": f"{random.randint(1, 3)}小时",
        "prerequisites": ["基础知识", "逻辑思维"],
        "next_steps": ["完成课后练习", "复习关键概念", "准备下次课程"]
    }


def analyze_student_performance(records: List[Dict]) -> Dict:
    """分析学生表现（Mock版本）"""
    if not records:
        return {
            "overall_score": 0,
            "strengths": [],
            "weaknesses": [],
            "recommendations": ["暂无数据"]
        }
    
    return {
        "overall_score": round(random.uniform(70, 95), 1),
        "strengths": [
            "学习态度认真",
            "作业完成及时",
            "课堂参与度高"
        ],
        "weaknesses": [
            "个别知识点需要加强",
            "可以提高答题速度"
        ],
        "recommendations": [
            "保持当前学习节奏",
            "针对薄弱环节加强练习",
            "定期进行总结回顾"
        ],
        "trend": "上升",
        "comparison": "优于平均水平15%"
    }


def generate_teaching_tips(subject: str, student_level: str) -> List[str]:
    """生成教学建议（Mock版本）"""
    tips = {
        "数学": [
            "从基础概念开始，逐步深入",
            "多做例题，注重解题思路",
            "鼓励学生独立思考"
        ],
        "英语": [
            "注重听说读写均衡发展",
            "创造语言应用场景",
            "定期进行词汇和语法复习"
        ],
        "物理": [
            "理论结合实验，增强理解",
            "注重物理思维的培养",
            "多做应用题，联系实际"
        ],
        "default": [
            "因材施教，关注学生个体差异",
            "及时反馈，鼓励学生进步",
            "创造互动式学习环境"
        ]
    }
    
    return tips.get(subject, tips["default"])

