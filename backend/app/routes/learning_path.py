from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.database.models import User
from app.database.schemas import LearningPathRequest, LearningPathResponse, LearningPathStep
from app.routes.auth import get_current_user
from app.services.learning_service import learning_service

router = APIRouter(tags=["Learning Path"])

@router.post("/learn/recommendations", response_model=LearningPathResponse)
def get_recommendations(
    payload: LearningPathRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Endpoint for generating a personalized learning path. Invokes LearningService and logs it.
    """
    roadmap_list = learning_service.recommend_and_save_learning_path(db, current_user.UserID, payload.topic)
    
                                                     
    steps = []
    for item in roadmap_list:
        steps.append(LearningPathStep(
            level=item.get("level", "General"),
            topics=item.get("topics", [])
        ))
        
    return LearningPathResponse(
        topic=payload.topic,
        roadmap=steps
    )
