"""
AI Routes - Mock版本 + OpenAI Proxy
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
import os
from openai import OpenAI

from app.services.mock_ai_service import (
    generate_mock_insight,
    generate_schedule_suggestions,
    generate_course_content_summary,
    analyze_student_performance,
    generate_teaching_tips,
)
from app.api.routes.auth import get_current_user

router = APIRouter()

# Initialize OpenAI client (API key from environment variable)
openai_client = None
if os.getenv("OPENAI_API_KEY"):
    openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


class InsightRequest(BaseModel):
    content: str


class ScheduleRequest(BaseModel):
    students: List[Dict]
    teachers: List[Dict]


class CourseContentRequest(BaseModel):
    content: str
    subject: Optional[str] = None


class PerformanceRequest(BaseModel):
    student_id: str
    records: List[Dict]


class TeachingTipsRequest(BaseModel):
    subject: str
    student_level: str = "中级"


@router.post("/insight")
async def generate_insight(
    request: InsightRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    生成AI洞察（Mock版本）
    
    用于分析日记、笔记等文本内容
    """
    insight = generate_mock_insight(request.content)
    return {
        "insight": insight,
        "generated_at": "2026-01-22",
        "model": "mock-ai-v1",
        "note": "这是Mock AI生成的示例内容"
    }


@router.post("/schedule-suggestions")
async def get_schedule_suggestions(
    request: ScheduleRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    生成排课建议（Mock版本）
    
    基于学生和教师信息，生成智能排课建议
    """
    suggestions = generate_schedule_suggestions(
        request.students,
        request.teachers
    )
    return {
        "suggestions": suggestions,
        "total": len(suggestions),
        "note": "这是Mock AI生成的排课建议"
    }


@router.post("/course-summary")
async def get_course_summary(
    request: CourseContentRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    生成课程内容摘要（Mock版本）
    """
    summary = generate_course_content_summary(request.content)
    return {
        **summary,
        "note": "这是Mock AI生成的课程摘要"
    }


@router.post("/analyze-performance")
async def analyze_performance(
    request: PerformanceRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    分析学生表现（Mock版本）
    """
    analysis = analyze_student_performance(request.records)
    return {
        "student_id": request.student_id,
        "analysis": analysis,
        "note": "这是Mock AI生成的性能分析"
    }


@router.post("/teaching-tips")
async def get_teaching_tips(
    request: TeachingTipsRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    获取教学建议（Mock版本）
    """
    tips = generate_teaching_tips(request.subject, request.student_level)
    return {
        "subject": request.subject,
        "student_level": request.student_level,
        "tips": tips,
        "note": "这是Mock AI生成的教学建议"
    }


@router.get("/health")
async def ai_health_check():
    """
    AI服务健康检查
    """
    return {
        "status": "healthy",
        "service": "mock-ai",
        "version": "1.0.0",
        "note": "Mock AI服务运行正常",
        "openai_configured": openai_client is not None
    }


# ============================================
# OpenAI Proxy for Constraint Parsing
# ============================================

class ConstraintParseRequest(BaseModel):
    """Request body for parsing student constraints"""
    system_prompt: str
    user_prompt: str
    model: str = "gpt-4o-mini"
    temperature: float = 0


class ConstraintParseResponse(BaseModel):
    """Response from OpenAI constraint parsing"""
    content: str
    model: str
    usage: Dict


@router.post("/openai/parse-constraint")
async def parse_constraint_with_openai(request: ConstraintParseRequest):
    """
    Proxy endpoint for OpenAI API calls to parse student constraints.
    
    This endpoint solves CORS issues by acting as a server-side proxy.
    Frontend calls this endpoint, which then calls OpenAI API.
    
    Args:
        request: Contains system_prompt, user_prompt, model, and temperature
    
    Returns:
        Parsed constraint as JSON string
    
    Raises:
        HTTPException: If OpenAI client is not configured or API call fails
    """
    # Check if OpenAI is configured
    if not openai_client:
        raise HTTPException(
            status_code=503,
            detail={
                "error": "OpenAI API not configured on server",
                "message": "请在服务器端配置 OPENAI_API_KEY 环境变量",
                "instructions": [
                    "1. 在后端添加 OPENAI_API_KEY 到环境变量",
                    "2. 在 docker-compose.yml 的 backend 服务中添加环境变量",
                    "3. 重启后端服务"
                ]
            }
        )
    
    try:
        # Call OpenAI API
        response = openai_client.chat.completions.create(
            model=request.model,
            messages=[
                {"role": "system", "content": request.system_prompt},
                {"role": "user", "content": request.user_prompt}
            ],
            temperature=request.temperature,
            response_format={"type": "json_object"}
        )
        
        # Extract response
        content = response.choices[0].message.content
        
        return {
            "content": content,
            "model": response.model,
            "usage": {
                "prompt_tokens": response.usage.prompt_tokens,
                "completion_tokens": response.usage.completion_tokens,
                "total_tokens": response.usage.total_tokens
            }
        }
    
    except Exception as e:
        # Log the error (in production, use proper logging)
        print(f"OpenAI API Error: {str(e)}")
        
        raise HTTPException(
            status_code=500,
            detail={
                "error": "OpenAI API call failed",
                "message": str(e),
                "type": type(e).__name__
            }
        )

