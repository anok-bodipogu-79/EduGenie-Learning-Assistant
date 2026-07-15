from sqlalchemy.orm import Session
from app.database.models import UserQuery, AIResponse, Summary
from app.services.gemini_service import gemini_service

class SummaryService:
    def summarize_and_save(self, db: Session, user_id: int, text: str) -> str:
        """
        Summarizes input text using Gemini, logs the query and response to the DB,
        saves record to the Summary table, and returns the summary text.
        """
                            
        query = UserQuery(
            UserID=user_id,
            QueryType="summarize",
            QueryText=text
        )
        db.add(query)
        db.commit()
        db.refresh(query)
        
                        
        summary_text = gemini_service.summarize_text(text)
        
                             
        model_used = "Gemini" if gemini_service.has_key else "Mock Engine"
        ai_resp = AIResponse(
            QueryID=query.QueryID,
            ResponseText=summary_text,
            ModelUsed=model_used
        )
        db.add(ai_resp)
        
                                
        summary_record = Summary(
            QueryID=query.QueryID,
            OriginalText=text,
            SummaryText=summary_text,
            ModelUsed=model_used
        )
        db.add(summary_record)
        
        db.commit()
        return summary_text

summary_service = SummaryService()
