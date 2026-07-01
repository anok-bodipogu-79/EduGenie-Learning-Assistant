# tests package initialization
import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add backend folder to sys.path so tests can import 'app' package
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend"))

from app.main import app
from app.routers.auth import get_current_user
from app.database.database import Base, get_db
from app.database.models import User

from sqlalchemy.pool import StaticPool

# Globally override get_current_user dependency for testing client
def mock_get_current_user():
    return User(
        UserID=999,
        UserName="Test Student",
        Email="test@edugenie.com",
        PasswordHash="mock_hash"
    )

app.dependency_overrides[get_current_user] = mock_get_current_user

# Create isolated in-memory SQLite database for tests
TEST_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Recreate tables in memory
Base.metadata.create_all(bind=engine)

# Seed mock test user
db = TestingSessionLocal()
test_user = User(
    UserID=999,
    UserName="Test Student",
    Email="test@edugenie.com",
    PasswordHash="mock_hash"
)
db.add(test_user)
db.commit()
db.close()

# Override get_db dependency globally for the test suite
def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
