from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.database.models import User
from app.database.schemas import SummaryRequest, SummaryResponse
from app.routes.auth import get_current_user
from app.services.summary_service import summary_service

router = APIRouter(tags=["Summary"])

@router.post("/summarize", response_model=SummaryResponse)
def summarize_text(
    payload: SummaryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Endpoint for text summarization. Invokes SummaryService and logs records in the database.
    """
    summary_text = summary_service.summarize_and_save(db, current_user.UserID, payload.text)
    return SummaryResponse(summary=summary_text)
