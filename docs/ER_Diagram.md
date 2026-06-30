# ER Diagram - EduGenie Learning Assistant

Below is the entity-relationship (ER) diagram representing the SQLite/SQLAlchemy schemas.

```mermaid
erDiagram
    USER {
        int UserID PK
        string UserName
        string Email UK
        string PasswordHash
        datetime CreatedAt
    }
    USER_QUERY {
        int QueryID PK
        int UserID FK
        string QueryType
        string QueryText
        datetime CreatedAt
    }
    AI_RESPONSE {
        int ResponseID PK
        int QueryID FK
        string ResponseText
        string ModelUsed
        datetime CreatedAt
    }
    LEARNING_PATH {
        int PathID PK
        int QueryID FK
        string Topic
        string Level
        string RecommendedTopics
        datetime CreatedAt
    }
    QUIZ {
        int QuizID PK
        int QueryID FK
        string QuestionText
        string OptionA
        string OptionB
        string OptionC
        string OptionD
        string CorrectOption
        datetime CreatedAt
    }
    SUMMARY {
        int SummaryID PK
        int QueryID FK
        string OriginalText
        string SummaryText
        string ModelUsed
        datetime CreatedAt
    }

    USER ||--|| USER_QUERY : "makes"
    USER_QUERY ||--|| AI_RESPONSE : "generates"
    USER_QUERY ||--o{ LEARNING_PATH : "results in"
    USER_QUERY ||--o{ QUIZ : "contains"
    USER_QUERY ||--o{ SUMMARY : "produces"
```

## Relationships

1. **USER (1) to USER_QUERY (1)**: Each user session/interaction traces back to a user query record (1-to-1 or 1-to-many relationship).
2. **USER_QUERY (1) to AI_RESPONSE (1)**: Every logged user query has exactly one corresponding AI response output.
3. **USER_QUERY (1) to LEARNING_PATH (1:m)**: A query of type `learn` produces multiple path levels (Beginner, Intermediate, Advanced) stored in the database.
4. **USER_QUERY (1) to QUIZ (1:m)**: A query of type `quiz` leads to exactly 3 distinct MCQ records saved for query analytics.
5. **USER_QUERY (1) to SUMMARY (1:m)**: A query of type `summarize` records the original paragraph and outputs the condensed summary text.
