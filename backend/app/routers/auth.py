from fastapi import APIRouter, Depends, HTTPException, Response, Request, status
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.database.models import User
from app.database.schemas import UserCreate, UserLogin, UserResponse
import hashlib
import hmac
from app.config.settings import settings

router = APIRouter(prefix="/auth", tags=["auth"])

def sign_cookie(user_id: str) -> str:
    signature = hmac.new(settings.SECRET_KEY.encode(), user_id.encode(), hashlib.sha256).hexdigest()
    return f"{user_id}.{signature}"

def verify_cookie(cookie_val: str) -> str:
    if not cookie_val or "." not in cookie_val:
        return None
    user_id, signature = cookie_val.split(".", 1)
    expected_sig = hmac.new(settings.SECRET_KEY.encode(), user_id.encode(), hashlib.sha256).hexdigest()
    if hmac.compare_digest(signature, expected_sig):
        return user_id
    return None

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    """
    Dependency that attempts to read the 'user_id' from cookie.
    If no cookie exists or is invalid, raises 401 Unauthorized.
    """
    cookie_val = request.cookies.get("user_id")
    user_id_str = verify_cookie(cookie_val) if cookie_val else None
    
    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    try:
        user_id = int(user_id_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token format",
        )
        
    user = db.query(User).filter(User.UserID == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User session not found. Please sign in again."
        )
    return user

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
    
    response.set_cookie(
        key="user_id", 
        value=sign_cookie(str(user.UserID)), 
        max_age=86400 * 30, 
        path="/",
        httponly=True,
        secure=True,     # Should be True in production (Render handles HTTPS)
        samesite="lax"
    )
    return user

@router.post("/login")
def login(user_data: UserLogin, response: Response, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.Email == user_data.Email).first()
    if not user or user.PasswordHash != hash_password(user_data.Password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    response.set_cookie(
        key="user_id", 
        value=sign_cookie(str(user.UserID)), 
        max_age=86400 * 30, 
        path="/",
        httponly=True,
        secure=True,
        samesite="lax"
    )
    return {"status": "success", "username": user.UserName, "user_id": user.UserID}

@router.post("/logout")
def logout(response: Response):
    response.delete_cookie("user_id", path="/", httponly=True, secure=True, samesite="lax")
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

@router.get("/history/paginated")
def get_paginated_history(
    page: int = 1,
    limit: int = 10,
    search: str = "",
    feature_type: str = "all",
    sort: str = "desc",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves paginated, filtered, sorted, and searched history.
    """
    from app.database.models import UserQuery
    
    # Base query for the current user
    query = db.query(UserQuery).filter(UserQuery.UserID == current_user.UserID)
    
    # Search
    if search:
        query = query.filter(UserQuery.QueryText.ilike(f"%{search}%"))
        
    # Feature filter
    if feature_type != "all":
        query = query.filter(UserQuery.QueryType == feature_type)
        
    # Sort
    if sort == "desc":
        query = query.order_by(UserQuery.CreatedAt.desc())
    else:
        query = query.order_by(UserQuery.CreatedAt.asc())
        
    # Count total for pagination
    total = query.count()
    total_pages = (total + limit - 1) // limit if limit > 0 else 0
    
    # Safe limits
    if page < 1: page = 1
    if limit < 1: limit = 10
    if limit > 100: limit = 100
    
    # Pagination
    offset = (page - 1) * limit
    queries = query.offset(offset).limit(limit).all()
    
    items = []
    for q in queries:
        resp_text = q.ai_response.ResponseText if q.ai_response else ""
        model_used = q.ai_response.ModelUsed if q.ai_response else "Unknown"
        
        items.append({
            "QueryID": q.QueryID,
            "QueryType": q.QueryType,
            "QueryText": q.QueryText,
            "ResponseText": resp_text,
            "ModelUsed": model_used,
            "CreatedAt": q.CreatedAt.strftime("%Y-%m-%d %H:%M:%S")
        })
        
    pagination = {
        "page": page,
        "limit": limit,
        "total": total,
        "total_pages": total_pages,
        "has_next": page < total_pages,
        "has_previous": page > 1
    }
    
    return {
        "items": items,
        "pagination": pagination
    }

@router.get("/history/{query_id}")
def get_history_detail(
    query_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves the complete detail of a specific history activity.
    Ensures user isolation.
    """
    from app.database.models import UserQuery
    
    query = db.query(UserQuery).filter(
        UserQuery.QueryID == query_id,
        UserQuery.UserID == current_user.UserID
    ).first()
    
    if not query:
        raise HTTPException(status_code=403, detail="Activity not found or access denied.")
        
    resp_text = query.ai_response.ResponseText if query.ai_response else ""
    model_used = query.ai_response.ModelUsed if query.ai_response else "Unknown"
    
    return {
        "QueryID": query.QueryID,
        "QueryType": query.QueryType,
        "QueryText": query.QueryText,
        "ResponseText": resp_text,
        "ModelUsed": model_used,
        "CreatedAt": query.CreatedAt.strftime("%Y-%m-%d %H:%M:%S")
    }
