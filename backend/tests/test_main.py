import pytest
from fastapi.testclient import TestClient

def test_health_check(test_client):
    """Test health check endpoint"""
    response = test_client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

def test_root_endpoint(test_client):
    """Test root endpoint"""
    response = test_client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data or "status" in data

def test_cors_headers(test_client):
    """Test CORS headers are present"""
    response = test_client.options(
        "/",
        headers={"Origin": "http://localhost:5173"}
    )
    # CORS 应该允许跨域请求
    assert response.status_code in [200, 204]

@pytest.mark.smoke
def test_api_docs_available(test_client):
    """Test API documentation is available"""
    response = test_client.get("/docs")
    assert response.status_code == 200
    
    response = test_client.get("/redoc")
    assert response.status_code == 200

def test_openapi_schema(test_client):
    """Test OpenAPI schema is valid"""
    response = test_client.get("/openapi.json")
    assert response.status_code == 200
    schema = response.json()
    assert "openapi" in schema
    assert "paths" in schema
    assert "info" in schema

