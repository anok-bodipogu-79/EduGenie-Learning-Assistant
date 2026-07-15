from sqlalchemy.orm import Session
from app.database.models import UserQuery, AIResponse, LearningPath
from app.services.gemini_service import gemini_service
import json

class LearningService:
    def recommend_and_save_learning_path(self, db: Session, user_id: int, topic: str) -> list:
        """
        Generates a 3-level learning path for a topic, logs the query and response to the DB,
        saves records to the LearningPath table, and returns the roadmap list.
        """
                            
        query = UserQuery(
            UserID=user_id,
            QueryType="learn",
            QueryText=topic
        )
        db.add(query)
        db.commit()
        db.refresh(query)
        
                        
        roadmap = gemini_service.generate_learning_path(topic)
        
                             
        model_used = "Gemini" if gemini_service.has_key else "Mock Engine"
        ai_resp = AIResponse(
            QueryID=query.QueryID,
            ResponseText=json.dumps(roadmap),
            ModelUsed=model_used
        )
        db.add(ai_resp)
        
                                      
        for stage in roadmap:
            path_record = LearningPath(
                QueryID=query.QueryID,
                Topic=topic,
                Level=stage.get("level", "General"),
                RecommendedTopics=json.dumps(stage.get("topics", []))
            )
            db.add(path_record)
            
        db.commit()
        return roadmap

learning_service = LearningService()
