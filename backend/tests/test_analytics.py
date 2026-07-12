import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timedelta

from app.main import app
from app.database.database import Base, get_db
from app.database.models import User

# Test DB Setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

@pytest.fixture(scope="module", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    app.dependency_overrides[get_db] = override_get_db
    yield
    Base.metadata.drop_all(bind=engine)
    app.dependency_overrides.clear()

@pytest.fixture(scope="module")
def client():
    return TestClient(app)

@pytest.fixture(scope="module")
def test_user_token(client):
    # Register and login a test user
    client.post("/auth/register", json={
        "UserName": "TestUser",
        "Email": "testuser@example.com",
        "Password": "password123"
    })
    response = client.post("/auth/login", json={
        "Email": "testuser@example.com",
        "Password": "password123"
    })
    return response.cookies.get("user_id")

def test_dashboard_unauthenticated(client: TestClient):
    response = client.get("/dashboard/analytics")
    assert response.status_code == 401

def test_dashboard_authenticated_empty(client: TestClient, test_user_token: str):
    headers = {"Cookie": f"user_id={test_user_token}"}
    response = client.get("/dashboard/analytics", headers=headers)
    
    assert response.status_code == 200
    data = response.json()
    
    assert data["statistics"]["questions"] == 0
    assert data["statistics"]["quizzes"] == 0
    assert data["statistics"]["concepts"] == 0
    assert len(data["recent_activity"]) == 0
    assert data["learning_streak"]["current_streak"] == 0
    assert data["continue_learning"] is None

def test_dashboard_with_activity(client: TestClient, test_user_token: str):
    headers = {"Cookie": f"user_id={test_user_token}"}
    
    # 1. Ask AI
    client.post("/qa", json={"question": "What is Python?"}, headers=headers)
    
    # 2. Explain Concept
    client.post("/explain", json={"topic": "Decorators"}, headers=headers)
    
    # 3. Generate Quiz
    client.post("/quiz", json={"topic": "Lists"}, headers=headers)
    
    # 4. Learning Path
    client.post("/learn/recommendations", json={"topic": "Data Science"}, headers=headers)
    
    response = client.get("/dashboard/analytics", headers=headers)
    assert response.status_code == 200
    data = response.json()
    
    assert data["statistics"]["questions"] >= 1
    assert data["statistics"]["concepts"] >= 1
    assert data["statistics"]["quizzes"] >= 1
    
    # Recent activity should have items
    assert len(data["recent_activity"]) > 0
    
    # Continue learning should be populated
    assert data["continue_learning"] is not None
    assert data["continue_learning"]["title"] == "Data Science"
    
    # Streak should be 1 since we did it today
    assert data["learning_streak"]["current_streak"] == 1
    assert len(data["calendar_activity"]) > 0

def test_dashboard_user_isolation(client: TestClient, test_user_token: str):
    headers_user1 = {"Cookie": f"user_id={test_user_token}"}
    
    # Create User 2
    response = client.post("/auth/register", json={
        "UserName": "UserTwo",
        "Email": "user2@example.com",
        "Password": "password123"
    })
    
    user2_token = ""
    if response.cookies and "user_id" in response.cookies:
        user2_token = response.cookies["user_id"]
    else:
        # get token from cookie header if possible
        login_resp = client.post("/auth/login", json={
            "Email": "user2@example.com",
            "Password": "password123"
        })
        user2_token = login_resp.cookies.get("user_id")
        
    headers_user2 = {"Cookie": f"user_id={user2_token}"}
    
    # User 1 asks 3 questions
    client.post("/qa", json={"question": "Q1"}, headers=headers_user1)
    client.post("/qa", json={"question": "Q2"}, headers=headers_user1)
    client.post("/qa", json={"question": "Q3"}, headers=headers_user1)
    
    # User 2 asks 1 question
    client.post("/qa", json={"question": "Q4"}, headers=headers_user2)
    
    dash1 = client.get("/dashboard/analytics", headers=headers_user1).json()
    dash2 = client.get("/dashboard/analytics", headers=headers_user2).json()
    
    assert dash1["statistics"]["questions"] >= 3
    assert dash2["statistics"]["questions"] == 1
