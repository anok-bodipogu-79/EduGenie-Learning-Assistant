from sqlalchemy.orm import Session
from app.database.models import UserQuery, AIResponse, Quiz
from app.services.gemini_service import gemini_service
import json

class QuizService:
    def generate_and_save_quiz(self, db: Session, user_id: int, topic: str) -> list:
        """
        Generates a 3-question MCQ quiz on a topic, logs the query and response to the DB,
        saves each question to the Quiz table, and returns the list of questions.
        """
                            
        query = UserQuery(
            UserID=user_id,
            QueryType="quiz",
            QueryText=topic
        )
        db.add(query)
        db.commit()
        db.refresh(query)
        
                        
        questions = gemini_service.generate_quiz(topic)
        
                             
        model_used = "Gemini" if gemini_service.has_key else "Mock Engine"
        ai_resp = AIResponse(
            QueryID=query.QueryID,
            ResponseText=json.dumps(questions),
            ModelUsed=model_used
        )
        db.add(ai_resp)
        
                              
        for q in questions:
            opts = q.get("options", [])
            while len(opts) < 4:
                opts.append("Placeholder Option")
                
            quiz_record = Quiz(
                QueryID=query.QueryID,
                QuestionText=q.get("question", "No question text"),
                OptionA=opts[0],
                OptionB=opts[1],
                OptionC=opts[2],
                OptionD=opts[3],
                CorrectOption=q.get("correct_answer", opts[0])
            )
            db.add(quiz_record)
            
        db.commit()
        return questions

quiz_service = QuizService()
