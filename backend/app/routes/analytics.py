from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, cast, Date
from datetime import datetime, timedelta, date

from app.database.database import get_db
from app.database.models import User, UserQuery, LearningPath
from app.database.schemas import DashboardResponse, DashboardStatistics, DashboardRecentActivityItem, DashboardStreak, DashboardContinueLearning
from app.routes.auth import get_current_user

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)

def get_label_for_query_type(qtype: str) -> str:
    labels = {
        "qa": "Q&A",
        "explain": "Explain Concept",
        "quiz": "Quiz Generation",
        "summarize": "Summarize Notes",
        "learn": "Learning Path"
    }
    return labels.get(qtype, "Learning Activity")

@router.get("/analytics", response_model=DashboardResponse)
def get_dashboard_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
                   
    questions_count = db.query(func.count(UserQuery.QueryID)).filter(
        UserQuery.UserID == current_user.UserID,
        UserQuery.QueryType == 'qa'
    ).scalar()

    quizzes_count = db.query(func.count(UserQuery.QueryID)).filter(
        UserQuery.UserID == current_user.UserID,
        UserQuery.QueryType == 'quiz'
    ).scalar()

    concepts_count = db.query(func.count(UserQuery.QueryID)).filter(
        UserQuery.UserID == current_user.UserID,
        UserQuery.QueryType == 'explain'
    ).scalar()

    stats = DashboardStatistics(
        questions=questions_count or 0,
        quizzes=quizzes_count or 0,
        concepts=concepts_count or 0,
        learning_activities=None                            
    )

                        
    recent_queries = db.query(UserQuery).filter(
        UserQuery.UserID == current_user.UserID
    ).order_by(desc(UserQuery.CreatedAt)).limit(5).all()

    recent_activity = []
    for q in recent_queries:
        recent_activity.append(
            DashboardRecentActivityItem(
                id=q.QueryID,
                activity_type=q.QueryType,
                title=q.QueryText[:100] + ("..." if len(q.QueryText) > 100 else ""),
                description=get_label_for_query_type(q.QueryType),
                timestamp=q.CreatedAt
            )
        )

                                          
                                             
                                                                                                  
    all_dates_query = db.query(UserQuery.CreatedAt).filter(
        UserQuery.UserID == current_user.UserID
    ).order_by(desc(UserQuery.CreatedAt)).all()

                                                         
    activity_dates = []
    for (created_at,) in all_dates_query:
        if isinstance(created_at, str):
            try:
                parsed_date = datetime.fromisoformat(created_at).date()
            except ValueError:
                                                                        
                parsed_date = datetime.strptime(created_at.split(".")[0], "%Y-%m-%d %H:%M:%S").date()
        else:
            parsed_date = created_at.date()
            
        if not activity_dates or activity_dates[-1] != parsed_date:
            activity_dates.append(parsed_date)

                      
    today = datetime.utcnow().date()
    yesterday = today - timedelta(days=1)
    
    current_streak = 0
    if activity_dates:
        check_date = today
        if activity_dates[0] == today:
            current_streak = 1
            idx = 1
            check_date = yesterday
        elif activity_dates[0] == yesterday:
            current_streak = 1
            idx = 1
            check_date = yesterday - timedelta(days=1)
        else:
            current_streak = 0
            idx = -1       
            
        if current_streak > 0:
            for d in activity_dates[idx:]:
                if d == check_date:
                    current_streak += 1
                    check_date -= timedelta(days=1)
                else:
                    break

                                                            
    weekly_activity = []
    monday = today - timedelta(days=today.weekday())
    for i in range(7):
        day_date = monday + timedelta(days=i)
        is_active = day_date in activity_dates
        weekly_activity.append({
            "date": day_date.strftime("%Y-%m-%d"),
            "active": is_active
        })

    streak = DashboardStreak(
        current_streak=current_streak,
        weekly_activity=weekly_activity
    )

                       
    calendar_activity = [d.strftime("%Y-%m-%d") for d in activity_dates]

                          
    latest_path_query = db.query(UserQuery).join(LearningPath, UserQuery.QueryID == LearningPath.QueryID).filter(
        UserQuery.UserID == current_user.UserID,
        UserQuery.QueryType == 'learn'
    ).order_by(desc(UserQuery.CreatedAt)).first()

    continue_learning = None
    if latest_path_query and latest_path_query.learning_paths:
        lp = latest_path_query.learning_paths[0]
        continue_learning = DashboardContinueLearning(
            title=lp.Topic,
            description=f"Level: {lp.Level}"
        )

                                       
    progress = None

    return DashboardResponse(
        statistics=stats,
        recent_activity=recent_activity,
        learning_streak=streak,
        calendar_activity=calendar_activity,
        continue_learning=continue_learning,
        progress=progress
    )
