import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timedelta

from app.main import app
from app.database.database import Base, get_db

# Test DB Setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_history.db"
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
def user_tokens(client):
    # User 1
    client.post("/auth/register", json={"UserName": "User1", "Email": "user1@example.com", "Password": "password123"})
    resp1 = client.post("/auth/login", json={"Email": "user1@example.com", "Password": "password123"})
    
    # User 2
    client.post("/auth/register", json={"UserName": "User2", "Email": "user2@example.com", "Password": "password123"})
    resp2 = client.post("/auth/login", json={"Email": "user2@example.com", "Password": "password123"})
    
    return resp1.cookies.get("user_id"), resp2.cookies.get("user_id")

def test_unauthenticated(client: TestClient):
    assert client.get("/auth/history/paginated").status_code == 401
    assert client.get("/auth/history/1").status_code == 401

def test_empty_history(client: TestClient, user_tokens):
    t1, _ = user_tokens
    res = client.get("/auth/history/paginated", headers={"Cookie": f"user_id={t1}"})
    assert res.status_code == 200
    data = res.json()
    assert len(data["items"]) == 0
    assert data["pagination"]["total"] == 0

def test_user_isolation_and_pagination(client: TestClient, user_tokens):
    t1, t2 = user_tokens
    h1 = {"Cookie": f"user_id={t1}"}
    h2 = {"Cookie": f"user_id={t2}"}
    
    # User 1 creates 12 activities
    for i in range(12):
        client.post("/qa", json={"question": f"Q1_{i}"}, headers=h1)
        
    # User 2 creates 3 activities
    for i in range(3):
        client.post("/explain", json={"topic": f"T2_{i}"}, headers=h2)
        
    # Check User 1 pagination
    res1_p1 = client.get("/auth/history/paginated?page=1&limit=10", headers=h1).json()
    assert len(res1_p1["items"]) == 10
    assert res1_p1["pagination"]["total"] == 12
    assert res1_p1["pagination"]["total_pages"] == 2
    assert res1_p1["pagination"]["has_next"] is True
    
    res1_p2 = client.get("/auth/history/paginated?page=2&limit=10", headers=h1).json()
    assert len(res1_p2["items"]) == 2
    assert res1_p2["pagination"]["has_next"] is False
    
    # Check User 2 isolation
    res2 = client.get("/auth/history/paginated", headers=h2).json()
    assert res2["pagination"]["total"] == 3
    assert all(item["QueryType"] == "explain" for item in res2["items"])

def test_search_and_filter(client: TestClient, user_tokens):
    t1, _ = user_tokens
    h1 = {"Cookie": f"user_id={t1}"}
    
    res = client.get("/auth/history/paginated?search=Q1_5", headers=h1).json()
    assert res["pagination"]["total"] == 1
    assert res["items"][0]["QueryText"] == "Q1_5"
    
    res_filter = client.get("/auth/history/paginated?feature_type=quiz", headers=h1).json()
    assert res_filter["pagination"]["total"] == 0

def test_detail_endpoint(client: TestClient, user_tokens):
    t1, t2 = user_tokens
    h1 = {"Cookie": f"user_id={t1}"}
    h2 = {"Cookie": f"user_id={t2}"}
    
    # Get an item from User 1
    res1 = client.get("/auth/history/paginated", headers=h1).json()
    q_id = res1["items"][0]["QueryID"]
    
    # User 1 can access
    detail = client.get(f"/auth/history/{q_id}", headers=h1)
    assert detail.status_code == 200
    
    # User 2 cannot access
    detail2 = client.get(f"/auth/history/{q_id}", headers=h2)
    assert detail2.status_code == 403
