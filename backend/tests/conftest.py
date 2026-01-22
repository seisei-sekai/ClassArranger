import pytest
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch
import os

# 设置测试环境
os.environ["TESTING"] = "true"

@pytest.fixture
def mock_firebase():
    """Mock Firebase Admin SDK"""
    with patch('app.core.firebase.auth') as mock_auth, \
         patch('app.core.firebase.firestore') as mock_firestore:
        
        # Mock auth
        mock_auth.verify_id_token.return_value = {
            'uid': 'test-user-id',
            'email': 'test@example.com'
        }
        
        # Mock firestore
        mock_db = Mock()
        mock_firestore.client.return_value = mock_db
        
        yield {
            'auth': mock_auth,
            'firestore': mock_firestore,
            'db': mock_db
        }

@pytest.fixture
def mock_openai():
    """Mock OpenAI API"""
    with patch('openai.ChatCompletion.create') as mock_create:
        mock_create.return_value = Mock(
            choices=[
                Mock(
                    message=Mock(
                        content="This is a test AI response"
                    )
                )
            ]
        )
        yield mock_create

@pytest.fixture
def mock_weaviate():
    """Mock Weaviate client"""
    with patch('app.core.weaviate_client.weaviate.Client') as mock_client:
        mock_instance = Mock()
        mock_client.return_value = mock_instance
        yield mock_instance

@pytest.fixture
def test_client(mock_firebase):
    """Create test client"""
    from app.main import app
    return TestClient(app)

@pytest.fixture
def test_user():
    """Test user data"""
    return {
        'uid': 'test-user-id',
        'email': 'test@example.com',
        'name': 'Test User'
    }

@pytest.fixture
def test_diary():
    """Test diary data"""
    return {
        'title': 'Test Diary',
        'content': 'This is a test diary entry.',
        'tags': ['test', 'example']
    }

@pytest.fixture
def auth_headers(test_user):
    """Authentication headers"""
    return {
        'Authorization': 'Bearer test-token'
    }

