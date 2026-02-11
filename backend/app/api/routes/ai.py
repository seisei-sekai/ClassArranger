"""
AI Routes - Mock版本 + OpenAI Proxy
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import List, Dict, Optional
import os
import tempfile
import math
from openai import OpenAI
from pydub import AudioSegment

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


# ============================================
# Whisper Audio Transcription with Segmentation
# ============================================

def split_audio_file(file_path: str, max_size_mb: float = 24) -> List[str]:
    """
    Split audio file into segments under max_size_mb.
    
    Args:
        file_path: Path to audio file
        max_size_mb: Maximum size per segment in MB
    
    Returns:
        List of temporary file paths for segments
    """
    try:
        # Load audio file
        audio = AudioSegment.from_file(file_path)
        
        # Get file size
        file_size_mb = os.path.getsize(file_path) / (1024 * 1024)
        
        # If file is small enough, return as is
        if file_size_mb <= max_size_mb:
            return [file_path]
        
        # Calculate number of segments needed
        num_segments = math.ceil(file_size_mb / max_size_mb)
        
        # Calculate segment duration
        total_duration_ms = len(audio)
        segment_duration_ms = total_duration_ms // num_segments
        
        # Split audio
        segment_paths = []
        file_ext = os.path.splitext(file_path)[1]
        
        for i in range(num_segments):
            start_ms = i * segment_duration_ms
            end_ms = (i + 1) * segment_duration_ms if i < num_segments - 1 else total_duration_ms
            
            segment = audio[start_ms:end_ms]
            
            # Export segment
            temp_segment = tempfile.NamedTemporaryFile(suffix=file_ext, delete=False)
            segment.export(temp_segment.name, format=file_ext[1:])  # Remove dot from extension
            segment_paths.append(temp_segment.name)
            temp_segment.close()
        
        return segment_paths
    
    except Exception as e:
        print(f"Audio splitting error: {str(e)}")
        raise


@router.post("/whisper/transcribe")
async def transcribe_audio(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Transcribe audio file using OpenAI Whisper API.
    Supports files up to 100MB by automatic segmentation.
    
    Args:
        file: Audio file (mp3, mp4, mpeg, mpga, m4a, wav, webm)
    
    Returns:
        Transcription text and metadata
    
    Raises:
        HTTPException: If OpenAI client is not configured or transcription fails
    """
    # Check if OpenAI is configured
    if not openai_client:
        raise HTTPException(
            status_code=503,
            detail={
                "error": "OpenAI API not configured",
                "message": "请在服务器端配置 OPENAI_API_KEY 环境变量"
            }
        )
    
    # Validate file type
    allowed_extensions = ['.mp3', '.mp4', '.mpeg', '.mpga', '.m4a', '.wav', '.webm']
    file_ext = os.path.splitext(file.filename)[1].lower()
    
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Invalid file type",
                "message": f"只支持音频格式: {', '.join(allowed_extensions)}",
                "received": file_ext
            }
        )
    
    # Check file size (100MB absolute limit)
    max_size = 100 * 1024 * 1024  # 100MB
    file_content = await file.read()
    file_size = len(file_content)
    
    if file_size > max_size:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "File too large",
                "message": "文件大小不能超过100MB",
                "size": f"{file_size / 1024 / 1024:.2f}MB"
            }
        )
    
    temp_file_path = None
    segment_paths = []
    
    try:
        # Create temporary file for original audio
        with tempfile.NamedTemporaryFile(suffix=file_ext, delete=False) as temp_file:
            temp_file.write(file_content)
            temp_file_path = temp_file.name
        
        # Split audio into segments if necessary (24MB per segment)
        segment_paths = split_audio_file(temp_file_path, max_size_mb=24)
        
        # Transcribe each segment
        transcriptions = []
        total_duration = 0
        detected_language = None
        previous_text = ""  # For context prompt
        
        for i, segment_path in enumerate(segment_paths):
            with open(segment_path, 'rb') as audio_file:
                # Use previous segment's text as prompt for context continuity
                transcript_params = {
                    "model": "whisper-1",
                    "file": audio_file,
                    "response_format": "verbose_json"
                }
                
                # Add prompt for context (helps with continuity across segments)
                if previous_text and i > 0:
                    # Use last 200 chars as prompt
                    transcript_params["prompt"] = previous_text[-200:]
                
                transcript = openai_client.audio.transcriptions.create(**transcript_params)
                
                transcriptions.append(transcript.text)
                total_duration += transcript.duration
                
                if not detected_language:
                    detected_language = transcript.language
                
                previous_text = transcript.text
        
        # Combine all transcriptions
        full_text = " ".join(transcriptions)
        
        # Clean up temporary files
        if temp_file_path and temp_file_path not in segment_paths:
            os.unlink(temp_file_path)
        
        for segment_path in segment_paths:
            try:
                os.unlink(segment_path)
            except:
                pass
        
        return {
            "text": full_text,
            "language": detected_language,
            "duration": total_duration,
            "filename": file.filename,
            "size_mb": f"{file_size / 1024 / 1024:.2f}",
            "segments": len(segment_paths),
            "success": True
        }
    
    except Exception as e:
        # Clean up temporary files if exists
        if temp_file_path:
            try:
                os.unlink(temp_file_path)
            except:
                pass
        
        for segment_path in segment_paths:
            try:
                os.unlink(segment_path)
            except:
                pass
        
        print(f"Whisper API Error: {str(e)}")
        
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Transcription failed",
                "message": str(e),
                "type": type(e).__name__
            }
        )

