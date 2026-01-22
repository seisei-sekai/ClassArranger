import pytest
from unittest.mock import Mock, patch

@pytest.mark.unit
def test_get_diaries_unauthorized(test_client):
    """Test getting diaries without authentication"""
    response = test_client.get("/diaries")
    assert response.status_code == 401

@pytest.mark.unit
def test_get_diaries_authorized(test_client, auth_headers, mock_firebase):
    """Test getting diaries with authentication"""
    # Mock Firestore response
    mock_doc = Mock()
    mock_doc.to_dict.return_value = {
        'id': 'diary-1',
        'title': 'Test Diary',
        'content': 'Test content',
        'created_at': '2024-01-01T00:00:00'
    }
    mock_firebase['db'].collection.return_value.where.return_value.stream.return_value = [mock_doc]
    
    response = test_client.get("/diaries", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

@pytest.mark.unit
def test_create_diary_unauthorized(test_client, test_diary):
    """Test creating diary without authentication"""
    response = test_client.post("/diaries", json=test_diary)
    assert response.status_code == 401

@pytest.mark.unit
def test_create_diary_authorized(test_client, auth_headers, test_diary, mock_firebase):
    """Test creating diary with authentication"""
    # Mock Firestore add response
    mock_ref = Mock()
    mock_ref.id = 'new-diary-id'
    mock_firebase['db'].collection.return_value.add.return_value = (None, mock_ref)
    
    response = test_client.post("/diaries", json=test_diary, headers=auth_headers)
    assert response.status_code == 201
    data = response.json()
    assert 'id' in data
    assert data['title'] == test_diary['title']

@pytest.mark.unit
def test_create_diary_invalid_data(test_client, auth_headers):
    """Test creating diary with invalid data"""
    invalid_diary = {
        'title': '',  # Empty title
        'content': 'Test content'
    }
    response = test_client.post("/diaries", json=invalid_diary, headers=auth_headers)
    assert response.status_code == 422  # Validation error

@pytest.mark.unit
def test_get_diary_by_id(test_client, auth_headers, mock_firebase):
    """Test getting specific diary by ID"""
    diary_id = 'test-diary-id'
    
    # Mock Firestore response
    mock_doc = Mock()
    mock_doc.exists = True
    mock_doc.to_dict.return_value = {
        'title': 'Test Diary',
        'content': 'Test content',
        'user_id': 'test-user-id',
        'created_at': '2024-01-01T00:00:00'
    }
    mock_firebase['db'].collection.return_value.document.return_value.get.return_value = mock_doc
    
    response = test_client.get(f"/diaries/{diary_id}", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data['title'] == 'Test Diary'

@pytest.mark.unit
def test_get_diary_not_found(test_client, auth_headers, mock_firebase):
    """Test getting non-existent diary"""
    diary_id = 'non-existent-id'
    
    # Mock Firestore response
    mock_doc = Mock()
    mock_doc.exists = False
    mock_firebase['db'].collection.return_value.document.return_value.get.return_value = mock_doc
    
    response = test_client.get(f"/diaries/{diary_id}", headers=auth_headers)
    assert response.status_code == 404

@pytest.mark.unit
def test_update_diary(test_client, auth_headers, test_diary, mock_firebase):
    """Test updating diary"""
    diary_id = 'test-diary-id'
    updated_data = {
        'title': 'Updated Title',
        'content': 'Updated content'
    }
    
    # Mock Firestore response
    mock_doc = Mock()
    mock_doc.exists = True
    mock_doc.to_dict.return_value = {
        'title': 'Test Diary',
        'content': 'Test content',
        'user_id': 'test-user-id'
    }
    mock_firebase['db'].collection.return_value.document.return_value.get.return_value = mock_doc
    
    response = test_client.put(f"/diaries/{diary_id}", json=updated_data, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data['title'] == updated_data['title']

@pytest.mark.unit
def test_delete_diary(test_client, auth_headers, mock_firebase):
    """Test deleting diary"""
    diary_id = 'test-diary-id'
    
    # Mock Firestore response
    mock_doc = Mock()
    mock_doc.exists = True
    mock_doc.to_dict.return_value = {
        'title': 'Test Diary',
        'user_id': 'test-user-id'
    }
    mock_firebase['db'].collection.return_value.document.return_value.get.return_value = mock_doc
    
    response = test_client.delete(f"/diaries/{diary_id}", headers=auth_headers)
    assert response.status_code == 204

@pytest.mark.integration
def test_diary_ai_insight(test_client, auth_headers, mock_firebase, mock_openai):
    """Test generating AI insight for diary"""
    diary_id = 'test-diary-id'
    
    # Mock Firestore response
    mock_doc = Mock()
    mock_doc.exists = True
    mock_doc.to_dict.return_value = {
        'title': 'Test Diary',
        'content': 'Test content',
        'user_id': 'test-user-id'
    }
    mock_firebase['db'].collection.return_value.document.return_value.get.return_value = mock_doc
    
    response = test_client.post(f"/diaries/{diary_id}/ai-insight", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert 'insight' in data

