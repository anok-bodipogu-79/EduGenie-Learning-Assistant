from fastapi import APIRouter, Depends, HTTPException, Response, Request, status
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.database.models import User
from app.database.schemas import UserCreate, UserLogin, UserResponse
import hashlib

router = APIRouter(prefix="/auth", tags=["auth"])

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    """
    Dependency that attempts to read the 'user_id' from cookie.
    If no cookie exists or is invalid, raises 401 Unauthorized.
    """
    user_id = request.cookies.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please sign in."
        )
    try:
        user = db.query(User).filter(User.UserID == int(user_id)).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User session not found. Please sign in again."
            )
        return user
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid session token."
        )

@router.post("/register", response_model=UserResponse)
def register(user_data: UserCreate, response: Response, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.Email == user_data.Email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    user = User(
        UserName=user_data.UserName,
        Email=user_data.Email,
        PasswordHash=hash_password(user_data.Password)
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    response.set_cookie(key="user_id", value=str(user.UserID), max_age=86400 * 30, path="/")
    return user

@router.post("/login")
def login(user_data: UserLogin, response: Response, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.Email == user_data.Email).first()
    if not user or user.PasswordHash != hash_password(user_data.Password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    response.set_cookie(key="user_id", value=str(user.UserID), max_age=86400 * 30, path="/")
    return {"status": "success", "username": user.UserName, "user_id": user.UserID}

@router.post("/logout")
def logout(response: Response):
    response.delete_cookie("user_id", path="/")
    return {"status": "success", "message": "Logged out successfully"}

@router.get("/me", response_model=UserResponse)
def get_me(user: User = Depends(get_current_user)):
    return user

@router.get("/history")
def get_user_history(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Retrieves the 10 most recent queries and AI responses for the currently logged-in user.
    """
    from app.database.models import UserQuery
    
    queries = (
        db.query(UserQuery)
        .filter(UserQuery.UserID == current_user.UserID)
        .order_by(UserQuery.CreatedAt.desc())
        .limit(10)
        .all()
    )
    
    result = []
    for q in queries:
        resp_text = q.ai_response.ResponseText if q.ai_response else ""
        model_used = q.ai_response.ModelUsed if q.ai_response else "Unknown"
        
        result.append({
            "QueryID": q.QueryID,
            "QueryType": q.QueryType,
            "QueryText": q.QueryText,
            "ResponseText": resp_text,
            "ModelUsed": model_used,
            "CreatedAt": q.CreatedAt.strftime("%Y-%m-%d %H:%M:%S")
        })
    return result
