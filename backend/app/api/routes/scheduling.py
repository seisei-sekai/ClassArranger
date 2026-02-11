"""
Scheduling Data API Routes
排课数据API路由

提供学生、教师、教室、排课课程的CRUD操作
支持多租户架构，通过JWT token获取userId进行数据隔离
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from datetime import datetime
from bson import ObjectId

from app.models.scheduling import (
    StudentBase, StudentInDB, StudentResponse,
    TeacherBase, TeacherInDB, TeacherResponse,
    ClassroomBase, ClassroomInDB, ClassroomResponse,
    ScheduledCourseBase, ScheduledCourseInDB, ScheduledCourseResponse,
    SchedulingMetadataBase, SchedulingMetadataInDB,
    AdjustmentRecordBase, AdjustmentRecordInDB,
    UserCountersInDB,
    BatchStudentCreate, BatchTeacherCreate, BatchClassroomCreate,
    ScheduledCourseFilter
)
from app.core.config import settings
from app.api.routes.auth import get_current_user
from app.models.user import UserInDB

router = APIRouter()


# ============================================================================
# 获取数据库连接
# ============================================================================

def get_db():
    """获取MongoDB数据库连接"""
    from motor.motor_asyncio import AsyncIOMotorClient
    client = AsyncIOMotorClient(settings.mongodb_url)
    db = client[settings.mongodb_db_name]
    return db


# ============================================================================
# 学生API (Students API)
# ============================================================================

@router.get("/students", response_model=List[StudentResponse])
async def get_students(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """获取当前用户的所有学生"""
    students = []
    cursor = db.students.find({"userId": current_user["id"]})
    async for doc in cursor:
        doc["id"] = str(doc.pop("_id"))
        students.append(StudentResponse(**doc))
    return students


@router.post("/students", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
async def create_student(
    student: StudentBase,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """创建新学生"""
    student_dict = student.model_dump()
    student_dict["userId"] = current_user["id"]
    student_dict["createdAt"] = datetime.utcnow()
    student_dict["updatedAt"] = datetime.utcnow()
    student_dict["version"] = 1
    
    result = await db.students.insert_one(student_dict)
    student_dict["id"] = str(result.inserted_id)
    return StudentResponse(**student_dict)


@router.post("/students/batch", response_model=List[StudentResponse])
async def create_students_batch(
    batch: BatchStudentCreate,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """批量创建学生"""
    students_to_insert = []
    for student in batch.students:
        student_dict = student.model_dump()
        student_dict["userId"] = current_user["id"]
        student_dict["createdAt"] = datetime.utcnow()
        student_dict["updatedAt"] = datetime.utcnow()
        student_dict["version"] = 1
        students_to_insert.append(student_dict)
    
    result = await db.students.insert_many(students_to_insert)
    
    # Fetch inserted students
    students = []
    for idx, inserted_id in enumerate(result.inserted_ids):
        students_to_insert[idx]["id"] = str(inserted_id)
        students.append(StudentResponse(**students_to_insert[idx]))
    
    return students


@router.get("/students/{student_id}", response_model=StudentResponse)
async def get_student(
    student_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """获取单个学生"""
    if not ObjectId.is_valid(student_id):
        raise HTTPException(status_code=400, detail="Invalid student ID")
    
    doc = await db.students.find_one({
        "_id": ObjectId(student_id),
        "userId": str(current_user.id)
    })
    
    if not doc:
        raise HTTPException(status_code=404, detail="Student not found")
    
    doc["id"] = str(doc.pop("_id"))
    return StudentResponse(**doc)


@router.put("/students/{student_id}", response_model=StudentResponse)
async def update_student(
    student_id: str,
    student: StudentBase,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """更新学生（支持并发版本控制）"""
    if not ObjectId.is_valid(student_id):
        raise HTTPException(status_code=400, detail="Invalid student ID")
    
    # 获取当前版本
    existing = await db.students.find_one({
        "_id": ObjectId(student_id),
        "userId": str(current_user.id)
    })
    
    if not existing:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # 更新数据
    update_dict = student.model_dump(exclude_unset=True)
    update_dict["updatedAt"] = datetime.utcnow()
    update_dict["version"] = existing.get("version", 1) + 1
    
    result = await db.students.update_one(
        {"_id": ObjectId(student_id), "userId": str(current_user.id)},
        {"$set": update_dict}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="Update failed")
    
    # 返回更新后的数据
    updated_doc = await db.students.find_one({"_id": ObjectId(student_id)})
    updated_doc["id"] = str(updated_doc.pop("_id"))
    return StudentResponse(**updated_doc)


@router.delete("/students/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_student(
    student_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """删除学生"""
    if not ObjectId.is_valid(student_id):
        raise HTTPException(status_code=400, detail="Invalid student ID")
    
    result = await db.students.delete_one({
        "_id": ObjectId(student_id),
        "userId": str(current_user.id)
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Student not found")
    
    return None


# ============================================================================
# 教师API (Teachers API)
# ============================================================================

@router.get("/teachers", response_model=List[TeacherResponse])
async def get_teachers(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """获取当前用户的所有教师"""
    teachers = []
    cursor = db.teachers.find({"userId": str(current_user.id)})
    async for doc in cursor:
        doc["id"] = str(doc.pop("_id"))
        teachers.append(TeacherResponse(**doc))
    return teachers


@router.post("/teachers", response_model=TeacherResponse, status_code=status.HTTP_201_CREATED)
async def create_teacher(
    teacher: TeacherBase,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """创建新教师"""
    teacher_dict = teacher.model_dump()
    teacher_dict["userId"] = str(current_user.id)
    teacher_dict["createdAt"] = datetime.utcnow()
    teacher_dict["updatedAt"] = datetime.utcnow()
    teacher_dict["version"] = 1
    
    result = await db.teachers.insert_one(teacher_dict)
    teacher_dict["id"] = str(result.inserted_id)
    return TeacherResponse(**teacher_dict)


@router.post("/teachers/batch", response_model=List[TeacherResponse])
async def create_teachers_batch(
    batch: BatchTeacherCreate,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """批量创建教师"""
    teachers_to_insert = []
    for teacher in batch.teachers:
        teacher_dict = teacher.model_dump()
        teacher_dict["userId"] = str(current_user.id)
        teacher_dict["createdAt"] = datetime.utcnow()
        teacher_dict["updatedAt"] = datetime.utcnow()
        teacher_dict["version"] = 1
        teachers_to_insert.append(teacher_dict)
    
    result = await db.teachers.insert_many(teachers_to_insert)
    
    teachers = []
    for idx, inserted_id in enumerate(result.inserted_ids):
        teachers_to_insert[idx]["id"] = str(inserted_id)
        teachers.append(TeacherResponse(**teachers_to_insert[idx]))
    
    return teachers


@router.put("/teachers/{teacher_id}", response_model=TeacherResponse)
async def update_teacher(
    teacher_id: str,
    teacher: TeacherBase,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """更新教师"""
    if not ObjectId.is_valid(teacher_id):
        raise HTTPException(status_code=400, detail="Invalid teacher ID")
    
    existing = await db.teachers.find_one({
        "_id": ObjectId(teacher_id),
        "userId": str(current_user.id)
    })
    
    if not existing:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    update_dict = teacher.model_dump(exclude_unset=True)
    update_dict["updatedAt"] = datetime.utcnow()
    update_dict["version"] = existing.get("version", 1) + 1
    
    await db.teachers.update_one(
        {"_id": ObjectId(teacher_id), "userId": str(current_user.id)},
        {"$set": update_dict}
    )
    
    updated_doc = await db.teachers.find_one({"_id": ObjectId(teacher_id)})
    updated_doc["id"] = str(updated_doc.pop("_id"))
    return TeacherResponse(**updated_doc)


@router.delete("/teachers/{teacher_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_teacher(
    teacher_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """删除教师"""
    if not ObjectId.is_valid(teacher_id):
        raise HTTPException(status_code=400, detail="Invalid teacher ID")
    
    result = await db.teachers.delete_one({
        "_id": ObjectId(teacher_id),
        "userId": str(current_user.id)
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    return None


# ============================================================================
# 教室API (Classrooms API)
# ============================================================================

@router.get("/classrooms", response_model=List[ClassroomResponse])
async def get_classrooms(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """获取当前用户的所有教室"""
    classrooms = []
    cursor = db.classrooms.find({"userId": str(current_user.id)})
    async for doc in cursor:
        doc["id"] = str(doc.pop("_id"))
        classrooms.append(ClassroomResponse(**doc))
    return classrooms


@router.post("/classrooms", response_model=ClassroomResponse, status_code=status.HTTP_201_CREATED)
async def create_classroom(
    classroom: ClassroomBase,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """创建新教室"""
    classroom_dict = classroom.model_dump()
    classroom_dict["userId"] = str(current_user.id)
    classroom_dict["createdAt"] = datetime.utcnow()
    classroom_dict["updatedAt"] = datetime.utcnow()
    
    result = await db.classrooms.insert_one(classroom_dict)
    classroom_dict["id"] = str(result.inserted_id)
    return ClassroomResponse(**classroom_dict)


@router.post("/classrooms/batch", response_model=List[ClassroomResponse])
async def create_classrooms_batch(
    batch: BatchClassroomCreate,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """批量创建教室"""
    classrooms_to_insert = []
    for classroom in batch.classrooms:
        classroom_dict = classroom.model_dump()
        classroom_dict["userId"] = str(current_user.id)
        classroom_dict["createdAt"] = datetime.utcnow()
        classroom_dict["updatedAt"] = datetime.utcnow()
        classrooms_to_insert.append(classroom_dict)
    
    result = await db.classrooms.insert_many(classrooms_to_insert)
    
    classrooms = []
    for idx, inserted_id in enumerate(result.inserted_ids):
        classrooms_to_insert[idx]["id"] = str(inserted_id)
        classrooms.append(ClassroomResponse(**classrooms_to_insert[idx]))
    
    return classrooms


@router.delete("/classrooms/{classroom_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_classroom(
    classroom_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """删除教室"""
    if not ObjectId.is_valid(classroom_id):
        raise HTTPException(status_code=400, detail="Invalid classroom ID")
    
    result = await db.classrooms.delete_one({
        "_id": ObjectId(classroom_id),
        "userId": str(current_user.id)
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Classroom not found")
    
    return None


# ============================================================================
# 排课课程API (Scheduled Courses API)
# ============================================================================

@router.get("/courses", response_model=List[ScheduledCourseResponse])
async def get_courses(
    schedule_session_id: Optional[str] = None,
    student_id: Optional[str] = None,
    teacher_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """获取排课课程（支持过滤）"""
    query = {"userId": str(current_user.id)}
    
    if schedule_session_id:
        query["scheduleSessionId"] = schedule_session_id
    if student_id:
        query["studentId"] = student_id
    if teacher_id:
        query["teacherId"] = teacher_id
    
    courses = []
    cursor = db.scheduled_courses.find(query)
    async for doc in cursor:
        doc["id"] = str(doc.pop("_id"))
        courses.append(ScheduledCourseResponse(**doc))
    
    return courses


@router.post("/courses/batch", response_model=List[ScheduledCourseResponse])
async def create_courses_batch(
    courses: List[ScheduledCourseBase],
    schedule_session_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """批量创建课程（一次排课结果）"""
    courses_to_insert = []
    for course in courses:
        course_dict = course.model_dump()
        course_dict["userId"] = str(current_user.id)
        course_dict["scheduleSessionId"] = schedule_session_id
        course_dict["createdAt"] = datetime.utcnow()
        courses_to_insert.append(course_dict)
    
    if courses_to_insert:
        result = await db.scheduled_courses.insert_many(courses_to_insert)
        
        created_courses = []
        for idx, inserted_id in enumerate(result.inserted_ids):
            courses_to_insert[idx]["id"] = str(inserted_id)
            created_courses.append(ScheduledCourseResponse(**courses_to_insert[idx]))
        
        return created_courses
    
    return []


@router.put("/courses/{course_id}", response_model=ScheduledCourseResponse)
async def update_course(
    course_id: str,
    course: ScheduledCourseBase,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """更新单个课程"""
    if not ObjectId.is_valid(course_id):
        raise HTTPException(status_code=400, detail="Invalid course ID")
    
    update_dict = course.model_dump(exclude_unset=True)
    
    result = await db.scheduled_courses.update_one(
        {"_id": ObjectId(course_id), "userId": str(current_user.id)},
        {"$set": update_dict}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Course not found or no changes")
    
    updated_doc = await db.scheduled_courses.find_one({"_id": ObjectId(course_id)})
    updated_doc["id"] = str(updated_doc.pop("_id"))
    return ScheduledCourseResponse(**updated_doc)


@router.delete("/courses/session/{schedule_session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_course_session(
    schedule_session_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """删除整个排课会话的所有课程"""
    result = await db.scheduled_courses.delete_many({
        "userId": str(current_user.id),
        "scheduleSessionId": schedule_session_id
    })
    
    return None


# ============================================================================
# 计数器API (Counters API)
# ============================================================================

@router.get("/counters")
async def get_counters(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """获取用户的计数器"""
    doc = await db.user_counters.find_one({"userId": str(current_user.id)})
    
    if not doc:
        # 创建默认计数器
        default_counters = {
            "userId": str(current_user.id),
            "studentCounter": 0,
            "teacherCounter": 0,
            "updatedAt": datetime.utcnow()
        }
        await db.user_counters.insert_one(default_counters)
        return {"studentCounter": 0, "teacherCounter": 0}
    
    return {
        "studentCounter": doc.get("studentCounter", 0),
        "teacherCounter": doc.get("teacherCounter", 0)
    }


@router.post("/counters/increment")
async def increment_counter(
    counter_type: str,  # "student" or "teacher"
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """递增计数器"""
    if counter_type not in ["student", "teacher"]:
        raise HTTPException(status_code=400, detail="Invalid counter type")
    
    field = f"{counter_type}Counter"
    
    result = await db.user_counters.find_one_and_update(
        {"userId": current_user["id"]},
        {
            "$inc": {field: 1},
            "$set": {"updatedAt": datetime.utcnow()}
        },
        upsert=True,
        return_document=True
    )
    
    return {
        "studentCounter": result.get("studentCounter", 0),
        "teacherCounter": result.get("teacherCounter", 0)
    }


# ============================================================================
# 调整历史API (Adjustment History API)
# ============================================================================

@router.get("/adjustments")
async def get_adjustment_history(
    conflict_id: Optional[str] = None,
    limit: int = 100,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """获取调整历史"""
    query = {"userId": str(current_user.id)}
    if conflict_id:
        query["conflictId"] = conflict_id
    
    records = []
    cursor = db.adjustment_history.find(query).sort("timestamp", -1).limit(limit)
    async for doc in cursor:
        doc["id"] = str(doc.pop("_id"))
        records.append(doc)
    
    return records


@router.post("/adjustments")
async def create_adjustment_record(
    record: AdjustmentRecordBase,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """创建调整历史记录"""
    record_dict = record.model_dump()
    record_dict["userId"] = str(current_user.id)
    
    result = await db.adjustment_history.insert_one(record_dict)
    record_dict["id"] = str(result.inserted_id)
    
    return record_dict
