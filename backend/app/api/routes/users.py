"""
User Routes
API endpoints for user management
"""
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from typing import List, Optional

from app.repositories.user_repository import get_user_repository
from app.api.routes.auth import require_admin, get_current_user
from app.models.user import UserRole

router = APIRouter()


class UserResponse(BaseModel):
    id: str
    email: str
    username: str
    role: str
    description: Optional[str] = None
    created_at: str


class UserUpdateRequest(BaseModel):
    username: Optional[str] = None
    description: Optional[str] = None
    role: Optional[UserRole] = None


@router.get("/", response_model=List[UserResponse])
async def list_users(
    skip: int = 0,
    limit: int = 100,
    admin_user: dict = Depends(require_admin)
):
    """
    List all users (Admin only)
    
    Returns paginated list of users.
    """
    user_repo = get_user_repository()
    users = await user_repo.list_users(skip=skip, limit=limit)
    
    return [
        {
            "id": user["id"],
            "email": user["email"],
            "username": user["username"],
            "role": user.get("role", "student"),
            "description": user.get("description"),
            "created_at": user["created_at"].isoformat() if user.get("created_at") else None
        }
        for user in users
    ]


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get user by ID
    
    Users can view their own profile, admins can view any profile.
    """
    user_repo = get_user_repository()
    user = await user_repo.get_user_by_id(user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check authorization
    if current_user["id"] != user_id and current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this user"
        )
    
    return {
        "id": user["id"],
        "email": user["email"],
        "username": user["username"],
        "role": user.get("role", "student"),
        "description": user.get("description"),
        "created_at": user["created_at"].isoformat() if user.get("created_at") else None
    }


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    update_data: UserUpdateRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Update user
    
    Users can update their own profile. Admins can update any profile.
    Only admins can change roles.
    """
    user_repo = get_user_repository()
    
    # Check authorization
    is_admin = current_user.get("role") == "admin"
    is_self = current_user["id"] == user_id
    
    if not is_admin and not is_self:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this user"
        )
    
    # Only admins can change roles
    if update_data.role is not None and not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can change user roles"
        )
    
    # Prepare update data
    update_dict = {}
    if update_data.username is not None:
        update_dict["username"] = update_data.username
    if update_data.description is not None:
        update_dict["description"] = update_data.description
    if update_data.role is not None and is_admin:
        update_dict["role"] = update_data.role
    
    if not update_dict:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No update data provided"
        )
    
    # Update user
    updated_user = await user_repo.update_user(user_id, update_dict)
    
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return {
        "id": updated_user["id"],
        "email": updated_user["email"],
        "username": updated_user["username"],
        "role": updated_user.get("role", "student"),
        "description": updated_user.get("description"),
        "created_at": updated_user["created_at"].isoformat() if updated_user.get("created_at") else None
    }


@router.delete("/{user_id}")
async def delete_user(
    user_id: str,
    admin_user: dict = Depends(require_admin)
):
    """
    Delete user (Admin only)
    
    Permanently deletes a user account.
    """
    user_repo = get_user_repository()
    
    # Prevent admin from deleting themselves
    if admin_user["id"] == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    success = await user_repo.delete_user(user_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return {"message": "User deleted successfully"}
