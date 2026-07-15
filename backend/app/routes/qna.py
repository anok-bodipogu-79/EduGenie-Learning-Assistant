from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.database.models import User, UserQuery, AIResponse
from app.database.schemas import QARequest, QAResponse
from app.routes.auth import get_current_user
from app.services.gemini_service import gemini_service

router = APIRouter(tags=["Q&A"])

@router.post("/qa", response_model=QAResponse)
def ask_question(
    payload: QARequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Endpoint for asking educational questions (Q&A). Logs search history and returns AI response.
    """
                        
    query = UserQuery(
        UserID=current_user.UserID,
        QueryType="qa",
        QueryText=payload.question
    )
    db.add(query)
    db.commit()
    db.refresh(query)

                        
    answer = gemini_service.ask_question(payload.question)

                         
    model_used = "Gemini" if gemini_service.has_key else "Mock Engine"
    ai_resp = AIResponse(
        QueryID=query.QueryID,
        ResponseText=answer,
        ModelUsed=model_used
    )
    db.add(ai_resp)
    db.commit()

    return QAResponse(answer=answer)
