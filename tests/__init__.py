# tests package initialization
import os
import sys

# Add backend folder to sys.path so tests can import 'app' package
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend"))

# Globally override get_current_user dependency for testing client
from app.main import app
from app.routers.auth import get_current_user
from app.database.models import User

def mock_get_current_user():
    return User(
        UserID=999,
        UserName="Test Student",
        Email="test@edugenie.com",
        PasswordHash="mock_hash"
    )

app.dependency_overrides[get_current_user] = mock_get_current_user
