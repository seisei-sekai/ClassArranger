"""
User Repository
Data access layer for user operations in MongoDB
"""
from typing import Optional, List
from datetime import datetime
from bson import ObjectId
from app.core.database import get_database
from app.models.user import UserInDB


class UserRepository:
    """Repository for user data operations"""
    
    def __init__(self):
        self.collection_name = "users"
    
    def _get_collection(self):
        """Get users collection from database"""
        db = get_database()
        return db[self.collection_name]
    
    async def create_user(self, user_data: dict) -> dict:
        """
        Create a new user in MongoDB
        
        Args:
            user_data: Dictionary containing user data
            
        Returns:
            Created user document
        """
        collection = self._get_collection()
        user_data["created_at"] = datetime.utcnow()
        user_data["updated_at"] = datetime.utcnow()
        
        result = await collection.insert_one(user_data)
        created_user = await collection.find_one({"_id": result.inserted_id})
        
        # Convert ObjectId to string for response
        created_user["id"] = str(created_user["_id"])
        return created_user
    
    async def get_user_by_email(self, email: str) -> Optional[dict]:
        """
        Get user by email
        
        Args:
            email: User email
            
        Returns:
            User document or None
        """
        collection = self._get_collection()
        user = await collection.find_one({"email": email})
        
        if user:
            user["id"] = str(user["_id"])
        
        return user
    
    async def get_user_by_id(self, user_id: str) -> Optional[dict]:
        """
        Get user by ID
        
        Args:
            user_id: User ID (string format)
            
        Returns:
            User document or None
        """
        collection = self._get_collection()
        
        try:
            user = await collection.find_one({"_id": ObjectId(user_id)})
            if user:
                user["id"] = str(user["_id"])
            return user
        except Exception:
            return None
    
    async def update_user(self, user_id: str, update_data: dict) -> Optional[dict]:
        """
        Update user data
        
        Args:
            user_id: User ID
            update_data: Dictionary of fields to update
            
        Returns:
            Updated user document or None
        """
        collection = self._get_collection()
        update_data["updated_at"] = datetime.utcnow()
        
        try:
            result = await collection.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": update_data}
            )
            
            if result.modified_count > 0:
                return await self.get_user_by_id(user_id)
            
            return None
        except Exception:
            return None
    
    async def delete_user(self, user_id: str) -> bool:
        """
        Delete user
        
        Args:
            user_id: User ID
            
        Returns:
            True if deleted, False otherwise
        """
        collection = self._get_collection()
        
        try:
            result = await collection.delete_one({"_id": ObjectId(user_id)})
            return result.deleted_count > 0
        except Exception:
            return False
    
    async def list_users(self, skip: int = 0, limit: int = 100) -> List[dict]:
        """
        List all users with pagination
        
        Args:
            skip: Number of records to skip
            limit: Maximum number of records to return
            
        Returns:
            List of user documents
        """
        collection = self._get_collection()
        cursor = collection.find().skip(skip).limit(limit)
        
        users = []
        async for user in cursor:
            user["id"] = str(user["_id"])
            users.append(user)
        
        return users
    
    async def count_users(self) -> int:
        """
        Count total number of users
        
        Returns:
            Total user count
        """
        collection = self._get_collection()
        return await collection.count_documents({})
    
    async def user_exists(self, email: str) -> bool:
        """
        Check if user with given email exists
        
        Args:
            email: User email
            
        Returns:
            True if exists, False otherwise
        """
        collection = self._get_collection()
        count = await collection.count_documents({"email": email})
        return count > 0


# Singleton instance
_user_repository = None


def get_user_repository() -> UserRepository:
    """Get user repository instance"""
    global _user_repository
    if _user_repository is None:
        _user_repository = UserRepository()
    return _user_repository
