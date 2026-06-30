from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import List, Optional

# --- User Schemas ---
class UserBase(BaseModel):
    UserName: str
    Email: str

class UserCreate(UserBase):
    Password: str

class UserLogin(BaseModel):
    Email: str
    Password: str

class UserResponse(UserBase):
    UserID: int
    CreatedAt: datetime

    class Config:
        from_attributes = True

# --- Query & Response Schemas ---
class QueryCreate(BaseModel):
    QueryType: str
    QueryText: str

class QueryResponse(BaseModel):
    QueryID: int
    UserID: int
    QueryType: str
    QueryText: str
    CreatedAt: datetime

    class Config:
        from_attributes = True

class AIResponseSchema(BaseModel):
    ResponseID: int
    QueryID: int
    ResponseText: str
    ModelUsed: str
    CreatedAt: datetime

    class Config:
        from_attributes = True

# --- Q&A API Schemas ---
class QARequest(BaseModel):
    question: str

class QAResponse(BaseModel):
    answer: str

# --- Explanation API Schemas ---
class ExplainRequest(BaseModel):
    topic: str

class ExplainResponse(BaseModel):
    explanation: str

# --- Quiz API Schemas ---
class QuizRequest(BaseModel):
    topic: str

class QuizQuestionSchema(BaseModel):
    question: str
    options: List[str]
    correct_answer: str

class QuizResponse(BaseModel):
    quiz: List[QuizQuestionSchema]

# --- Summary API Schemas ---
class SummaryRequest(BaseModel):
    text: str

class SummaryResponse(BaseModel):
    summary: str

# --- Learning Path API Schemas ---
class LearningPathRequest(BaseModel):
    topic: str

class LearningPathStep(BaseModel):
    level: str # 'Beginner', 'Intermediate', 'Advanced'
    topics: List[str]

class LearningPathResponse(BaseModel):
    topic: str
    roadmap: List[LearningPathStep]
