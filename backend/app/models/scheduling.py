"""
Scheduling Data Models
排课数据模型

多租户架构设计：
- 每个用户（userId）拥有独立的数据作用域
- 所有数据通过 userId 隔离
- 支持并发访问和版本控制
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Literal
from datetime import datetime
from bson import ObjectId


class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v, handler):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, core_schema, handler):
        return {"type": "string"}


# ============================================================================
# 约束系统模型 (Constraint System Models)
# ============================================================================

class Constraint(BaseModel):
    """单个约束"""
    id: str
    kind: str  # time_window, blackout, resource_preference, etc.
    strength: Literal["hard", "soft"] = "soft"
    priority: int = 5
    operator: str = "allow"
    weekdays: Optional[List[int]] = None
    timeRanges: Optional[List[Dict[str, str]]] = None
    resources: Optional[List[str]] = None
    source: List[str] = []
    confidence: float = 1.0
    note: Optional[str] = None


class SchedulingInfo(BaseModel):
    """V4 Schema: 统一的排课信息结构"""
    frequency: int = 1
    duration: int = 24  # slots (2 hours)
    mode: Literal["online", "offline", "hybrid"] = "offline"
    schedulingMode: Literal["recurring", "flexible"] = "recurring"
    isRecurringFixed: bool = True
    campus: Optional[str] = None
    subject: Optional[str] = None


class CourseHours(BaseModel):
    """课时信息"""
    totalHours: float = 0
    usedHours: float = 0
    remainingHours: float = 0


# ============================================================================
# 学生模型 (Student Model)
# ============================================================================

class StudentBase(BaseModel):
    """学生基础数据"""
    name: str
    color: str
    rawData: Optional[str] = ""
    parsedData: Optional[Dict[str, Any]] = None
    
    # V4 Schema
    scheduling: Optional[SchedulingInfo] = None
    constraints: List[Constraint] = []
    
    # Legacy fields (向后兼容)
    frequency: Optional[int] = None
    duration: Optional[int] = None
    mode: Optional[str] = None
    schedulingMode: Optional[str] = None
    isRecurringFixed: Optional[bool] = None
    
    # UI state
    showAvailability: bool = False
    selected: bool = False
    courseVisibility: bool = True
    
    # Metadata
    courseHours: Optional[CourseHours] = None
    constraintsModified: bool = False
    aiParsed: bool = False
    inferredDefaults: Optional[Dict[str, Any]] = None


class StudentInDB(StudentBase):
    """数据库中的学生记录"""
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    userId: str  # 🔥 关键字段：用户隔离
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    version: int = 1  # 版本控制，支持并发更新

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class StudentResponse(StudentBase):
    """API响应的学生数据"""
    id: str
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True


# ============================================================================
# 教师模型 (Teacher Model)
# ============================================================================

class TeacherBase(BaseModel):
    """教师基础数据"""
    name: str
    color: str
    rawData: Optional[str] = ""
    parsedData: Optional[Dict[str, Any]] = None
    availableTimeSlots: Optional[List[int]] = None
    
    # UI state
    showAvailability: bool = False
    selected: bool = False
    courseVisibility: bool = True


class TeacherInDB(TeacherBase):
    """数据库中的教师记录"""
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    userId: str  # 🔥 关键字段：用户隔离
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    version: int = 1

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class TeacherResponse(TeacherBase):
    """API响应的教师数据"""
    id: str
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True


# ============================================================================
# 教室模型 (Classroom Model)
# ============================================================================

class ClassroomBase(BaseModel):
    """教室基础数据"""
    name: str
    capacity: int = 20
    notes: Optional[str] = None
    availableTimeRanges: Optional[Dict[str, Any]] = None


class ClassroomInDB(ClassroomBase):
    """数据库中的教室记录"""
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    userId: str  # 🔥 关键字段：用户隔离
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class ClassroomResponse(ClassroomBase):
    """API响应的教室数据"""
    id: str
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True


# ============================================================================
# 排课课程模型 (Scheduled Course Model)
# ============================================================================

class ScheduledCourseBase(BaseModel):
    """排课课程基础数据"""
    studentId: str
    studentName: str
    teacherId: str
    teacherName: str
    classroomId: str
    classroomName: str
    
    day: int  # 1-7
    startSlot: int  # 0-149 (5-min slots)
    duration: int  # in slots
    
    subject: Optional[str] = None
    campus: Optional[str] = None
    mode: str = "offline"
    
    # Course state
    isVirtual: bool = False
    status: str = "scheduled"  # scheduled, unscheduled
    confirmationStatus: str = "pending"  # pending, confirmed
    
    # Metadata
    color: Optional[str] = None
    score: Optional[float] = None


class ScheduledCourseInDB(ScheduledCourseBase):
    """数据库中的课程记录"""
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    userId: str  # 🔥 关键字段：用户隔离
    scheduleSessionId: str  # 🔥 关键字段：排课会话ID（一次排课生成的所有课程共享同一个sessionId）
    createdAt: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class ScheduledCourseResponse(ScheduledCourseBase):
    """API响应的课程数据"""
    id: str
    scheduleSessionId: str
    createdAt: datetime

    class Config:
        from_attributes = True


# ============================================================================
# 排课元数据模型 (Scheduling Metadata Model)
# ============================================================================

class SchedulingMetadataBase(BaseModel):
    """排课元数据"""
    scheduleSessionId: str
    algorithm: str = "triple-match"
    lastScheduledAt: datetime
    totalCoursesScheduled: int = 0
    totalHoursScheduled: float = 0
    conflictsDetected: int = 0
    stats: Optional[Dict[str, Any]] = None


class SchedulingMetadataInDB(SchedulingMetadataBase):
    """数据库中的排课元数据记录"""
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    userId: str  # 🔥 关键字段：用户隔离
    createdAt: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


# ============================================================================
# 排课调整历史模型 (Adjustment History Model)
# ============================================================================

class AdjustmentRecordBase(BaseModel):
    """排课调整历史记录"""
    conflictId: str
    targetType: str  # student, teacher, classroom
    targetId: str
    targetName: str
    modificationType: str  # manual, smart_recommendation
    modificationData: Dict[str, Any]
    result: str  # success, failed
    errorMessage: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class AdjustmentRecordInDB(AdjustmentRecordBase):
    """数据库中的调整历史记录"""
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    userId: str  # 🔥 关键字段：用户隔离

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


# ============================================================================
# 用户计数器模型 (User Counters Model)
# ============================================================================

class UserCountersInDB(BaseModel):
    """用户的计数器（用于生成学生/教师名称）"""
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    userId: str  # 🔥 关键字段：用户隔离
    studentCounter: int = 0
    teacherCounter: int = 0
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


# ============================================================================
# 批量操作模型 (Batch Operations)
# ============================================================================

class BatchStudentCreate(BaseModel):
    """批量创建学生"""
    students: List[StudentBase]


class BatchTeacherCreate(BaseModel):
    """批量创建教师"""
    teachers: List[TeacherBase]


class BatchClassroomCreate(BaseModel):
    """批量创建教室"""
    classrooms: List[ClassroomBase]


# ============================================================================
# 查询过滤器 (Query Filters)
# ============================================================================

class ScheduledCourseFilter(BaseModel):
    """课程查询过滤器"""
    scheduleSessionId: Optional[str] = None
    studentId: Optional[str] = None
    teacherId: Optional[str] = None
    classroomId: Optional[str] = None
    day: Optional[int] = None
    status: Optional[str] = None
    confirmationStatus: Optional[str] = None
