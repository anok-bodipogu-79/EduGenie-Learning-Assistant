# Project Workflow - EduGenie

Below is the workflow process mapping user requests from the frontend to the backend models and database.

```mermaid
graph TD
    User([User]) -->|Inputs Query| Frontend[Frontend HTML / CSS / JS]
    Frontend -->|POST Request| Backend[FastAPI Backend]
    
    subgraph Backend Core
        Backend -->|Request Validation| Validation{Pydantic Schema}
        Validation -->|If Valid| Routing{Route Selection}
    end
    
    subgraph Route Handlers
        Routing -->|/qa| RouteQA[Q&A Router]
        Routing -->|/explain| RouteExplain[Explanation Router]
        Routing -->|/quiz| RouteQuiz[Quiz Router]
        Routing -->|/summarize| RouteSummarize[Summary Router]
        Routing -->|/learn/recommendations| RouteLearn[Learning Path Router]
    end
    
    subgraph AI Model Services
        RouteQA -->|Calls| GeminiService[Gemini 1.5 Service]
        RouteExplain -->|Calls| LaMiniService[LaMini-Flan-T5 Service]
        LaMiniService -->|Fallback if fail| GeminiService
        RouteQuiz -->|Calls| GeminiService
        RouteSummarize -->|Calls| GeminiService
        RouteLearn -->|Calls| GeminiService
    end
    
    subgraph DB Storage
        RouteQA -->|Logs Transaction| DB[(SQLite Database)]
        RouteExplain -->|Logs Transaction| DB
        RouteQuiz -->|Logs & Saves MCQs| DB
        RouteSummarize -->|Logs & Saves Summary| DB
        RouteLearn -->|Logs & Saves Roadmap| DB
    end

    GeminiService -.->|Returns JSON / Text| Output[Format Response]
    LaMiniService -.->|Returns Text| Output
    
    Output -->|JSON Payload| Frontend
    Frontend -->|Updates DOM| User
```

## Detailed Processing Steps

1. **User Request**: The user enters an input query into the single-page application dashboard text area and hits "Submit".
2. **FastAPI Routing**: The requests are routed to specific routes: `/qa`, `/explain`, `/quiz`, `/summarize`, or `/learn/recommendations`.
3. **Execution & Orchestration**:
   - For **Topic Explanation**, the backend attempts to load Hugging Face's local model `LaMini-Flan-T5` on the CPU or GPU. If local packages or resources are missing, it falls back to Gemini 1.5 Flash.
   - For **Q&A, Quiz, Summary, and Learning Path**, the requests invoke the Gemini 1.5 Flash service via the Google Generative AI SDK.
4. **Database Logging**: The transaction input, raw model responses, and customized structures (individual questions or roadmaps) are stored in the SQLite tables using SQLAlchemy ORM.
5. **DOM Render**: The frontend parses the output. For quizzes, it renders click-to-validate buttons; for roadmaps, it displays checkbox checklists; for standard text, it formats clean markdown styling.
