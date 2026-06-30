# EduGenie - AI Educational Learning Assistant

EduGenie is a web-based educational assistant powered by AI. It provides:
1. **Question Answering (Q&A)** using Gemini 1.5 Pro.
2. **Topic Explanation** using LaMini-Flan-T5 (local small LLM, with Gemini fallback).
3. **Interactive Quiz Generation** using Gemini 1.5 Pro.
4. **Text Summarization** using Gemini 1.5 Pro.
5. **Personalized Learning Path Recommendation** using Gemini 1.5 Pro.

It stores user request history and AI responses in an SQLite database using SQLAlchemy ORM.

## Directory Layout
- `backend/`: FastAPI backend, settings, database layer, routers, and templates/static assets.
- `docs/`: Design documents, pre-requisites, ER diagram information, and workflow details.
- `tests/`: Integration tests for endpoints.

## Quick Start
To set up and run EduGenie locally, please refer to [Pre_Requisites.md](file:///c:/Users/91934/Documents/Skill%20Wallet%20Project/docs/Pre_Requisites.md) and the root README.
