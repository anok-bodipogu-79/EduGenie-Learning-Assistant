                              
import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

                                                                  
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend"))

from app.main import app
from app.routes.auth import get_current_user
from app.database.database import Base, get_db
from app.database.models import User

from sqlalchemy.pool import StaticPool

                                                                  
def mock_get_current_user():
    return User(
        UserID=999,
        UserName="Test Student",
        Email="test@edugenie.com",
        PasswordHash="mock_hash"
    )

app.dependency_overrides[get_current_user] = mock_get_current_user

                                                     
TEST_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

                           
Base.metadata.create_all(bind=engine)

                     
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

                                                        
def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
