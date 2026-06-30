from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.database import Base

class User(Base):
    __tablename__ = "users"

    UserID = Column(Integer, primary_key=True, index=True, autoincrement=True)
    UserName = Column(String, nullable=False)
    Email = Column(String, unique=True, index=True, nullable=False)
    PasswordHash = Column(String, nullable=False)
    CreatedAt = Column(DateTime, default=datetime.utcnow)

    # Relationships
    queries = relationship("UserQuery", back_populates="user", cascade="all, delete-orphan")

class UserQuery(Base):
    __tablename__ = "user_queries"

    QueryID = Column(Integer, primary_key=True, index=True, autoincrement=True)
    UserID = Column(Integer, ForeignKey("users.UserID"), nullable=False)
    QueryType = Column(String, nullable=False) # 'qa', 'explain', 'quiz', 'summarize', 'learn'
    QueryText = Column(Text, nullable=False)
    CreatedAt = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="queries")
    ai_response = relationship("AIResponse", back_populates="query", uselist=False, cascade="all, delete-orphan")
    learning_paths = relationship("LearningPath", back_populates="query", cascade="all, delete-orphan")
    quizzes = relationship("Quiz", back_populates="query", cascade="all, delete-orphan")
    summaries = relationship("Summary", back_populates="query", cascade="all, delete-orphan")

class AIResponse(Base):
    __tablename__ = "ai_responses"

    ResponseID = Column(Integer, primary_key=True, index=True, autoincrement=True)
    QueryID = Column(Integer, ForeignKey("user_queries.QueryID"), nullable=False)
    ResponseText = Column(Text, nullable=False)
    ModelUsed = Column(String, nullable=False) # 'Gemini' or 'LaMini-Flan-T5'
    CreatedAt = Column(DateTime, default=datetime.utcnow)

    # Relationships
    query = relationship("UserQuery", back_populates="ai_response")

class LearningPath(Base):
    __tablename__ = "learning_paths"

    PathID = Column(Integer, primary_key=True, index=True, autoincrement=True)
    QueryID = Column(Integer, ForeignKey("user_queries.QueryID"), nullable=False)
    Topic = Column(String, nullable=False)
    Level = Column(String, nullable=False) # 'Beginner', 'Intermediate', 'Advanced'
    RecommendedTopics = Column(Text, nullable=False) # Stored as JSON/text representation of list
    CreatedAt = Column(DateTime, default=datetime.utcnow)

    # Relationships
    query = relationship("UserQuery", back_populates="learning_paths")

class Quiz(Base):
    __tablename__ = "quizzes"

    QuizID = Column(Integer, primary_key=True, index=True, autoincrement=True)
    QueryID = Column(Integer, ForeignKey("user_queries.QueryID"), nullable=False)
    QuestionText = Column(Text, nullable=False)
    OptionA = Column(String, nullable=False)
    OptionB = Column(String, nullable=False)
    OptionC = Column(String, nullable=False)
    OptionD = Column(String, nullable=False)
    CorrectOption = Column(String, nullable=False) # 'A', 'B', 'C', or 'D'
    CreatedAt = Column(DateTime, default=datetime.utcnow)

    # Relationships
    query = relationship("UserQuery", back_populates="quizzes")

class Summary(Base):
    __tablename__ = "summaries"

    SummaryID = Column(Integer, primary_key=True, index=True, autoincrement=True)
    QueryID = Column(Integer, ForeignKey("user_queries.QueryID"), nullable=False)
    OriginalText = Column(Text, nullable=False)
    SummaryText = Column(Text, nullable=False)
    ModelUsed = Column(String, default="Gemini", nullable=False)
    CreatedAt = Column(DateTime, default=datetime.utcnow)

    # Relationships
    query = relationship("UserQuery", back_populates="summaries")
