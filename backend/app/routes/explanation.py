from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.database.models import User, UserQuery, AIResponse
from app.database.schemas import ExplainRequest, ExplainResponse
from app.routes.auth import get_current_user
from app.services.lamini_service import lamini_service

router = APIRouter(tags=["Explanation"])

@router.post("/explain", response_model=ExplainResponse)
def explain_topic(
    payload: ExplainRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Endpoint for topic explanation. Uses LaMini-Flan-T5 (with Gemini fallback). Logs history to DB.
    """
                        
    query = UserQuery(
        UserID=current_user.UserID,
        QueryType="explain",
        QueryText=payload.topic
    )
    db.add(query)
    db.commit()
    db.refresh(query)

                        
    explanation = lamini_service.explain_topic(payload.topic)

                         
    model_used = "LaMini-Flan-T5" if lamini_service.is_loaded else "Gemini"
    if not lamini_service.is_loaded and lamini_service.fallback_active:
        from app.services.gemini_service import gemini_service
        if not gemini_service.has_key:
            model_used = "Mock Engine"
            
    ai_resp = AIResponse(
        QueryID=query.QueryID,
        ResponseText=explanation,
        ModelUsed=model_used
    )
    db.add(ai_resp)
    db.commit()

    return ExplainResponse(explanation=explanation)
