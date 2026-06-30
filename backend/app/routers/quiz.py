from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database.database import get_db
from app.database.models import User
from app.database.schemas import QuizRequest, QuizQuestionSchema
from app.routers.auth import get_current_user
from app.services.quiz_service import quiz_service

router = APIRouter(tags=["Quiz"])

@router.post("/quiz", response_model=List[QuizQuestionSchema])
def generate_quiz(
    payload: QuizRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Endpoint for generating an MCQ quiz. Invokes QuizService to save to database and returns a list of questions.
    """
    questions = quiz_service.generate_and_save_quiz(db, current_user.UserID, payload.topic)
    return questions
