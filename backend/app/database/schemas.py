from pydantic import BaseModel, EmailStr, Field, ConfigDict
from datetime import datetime
from typing import List, Optional

                      
class UserBase(BaseModel):
    UserName: str = Field(..., min_length=2, max_length=50)
    Email: EmailStr

class UserCreate(UserBase):
    Password: str = Field(..., min_length=8, max_length=128)

class UserLogin(BaseModel):
    Email: EmailStr
    Password: str = Field(..., min_length=8, max_length=128)

class UserResponse(UserBase):
    UserID: int
    CreatedAt: datetime

    model_config = ConfigDict(from_attributes=True)

                                  
class QueryCreate(BaseModel):
    QueryType: str
    QueryText: str

class QueryResponse(BaseModel):
    QueryID: int
    UserID: int
    QueryType: str
    QueryText: str
    CreatedAt: datetime

    model_config = ConfigDict(from_attributes=True)

class AIResponseSchema(BaseModel):
    ResponseID: int
    QueryID: int
    ResponseText: str
    ModelUsed: str
    CreatedAt: datetime

    model_config = ConfigDict(from_attributes=True)

                         
class QARequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=1000)

class QAResponse(BaseModel):
    answer: str

                                 
class ExplainRequest(BaseModel):
    topic: str = Field(..., min_length=1, max_length=200)

class ExplainResponse(BaseModel):
    explanation: str

                          
class QuizRequest(BaseModel):
    topic: str = Field(..., min_length=1, max_length=200)

class QuizQuestionSchema(BaseModel):
    question: str
    options: List[str]
    correct_answer: str

class QuizResponse(BaseModel):
    quiz: List[QuizQuestionSchema]

                             
class SummaryRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000)

class SummaryResponse(BaseModel):
    summary: str

                                   
class LearningPathRequest(BaseModel):
    topic: str = Field(..., min_length=1, max_length=200)

class LearningPathStep(BaseModel):
    level: str                                         
    topics: List[str]

class LearningPathResponse(BaseModel):
    topic: str
    roadmap: List[LearningPathStep]

                                     
class DashboardStatistics(BaseModel):
    questions: Optional[int] = None
    quizzes: Optional[int] = None
    concepts: Optional[int] = None
    learning_activities: Optional[int] = None

class DashboardRecentActivityItem(BaseModel):
    id: int
    activity_type: str
    title: str
    description: str
    timestamp: datetime

class DashboardStreak(BaseModel):
    current_streak: int
    weekly_activity: List[dict]                                                 

class DashboardContinueLearning(BaseModel):
    title: str
    description: str

class DashboardResponse(BaseModel):
    statistics: DashboardStatistics
    recent_activity: List[DashboardRecentActivityItem]
    learning_streak: DashboardStreak
    calendar_activity: List[str]                       
    continue_learning: Optional[DashboardContinueLearning] = None
    progress: Optional[dict] = None

                                             
class HistoryPagination(BaseModel):
    page: int
    limit: int
    total: int
    total_pages: int
    has_next: bool
    has_previous: bool

class HistoryItem(BaseModel):
    QueryID: int
    QueryType: str
    QueryText: str
    ResponseText: str
    ModelUsed: str
    CreatedAt: str

class HistoryPaginatedResponse(BaseModel):
    items: List[HistoryItem]
    pagination: HistoryPagination

class HistoryDetailResponse(BaseModel):
    QueryID: int
    QueryType: str
    QueryText: str
    ResponseText: str
    ModelUsed: str
    CreatedAt: str
