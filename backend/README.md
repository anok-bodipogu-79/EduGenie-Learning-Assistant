# EduGenie Backend

This contains the FastAPI backend code for EduGenie.

## Requirements
To install requirements:
```bash
pip install -r requirements.txt
```

## Running the Application
From the `backend` directory, run:
```bash
uvicorn app.main:app --reload
```
And access it at http://127.0.0.1:8000.
Ensure you set your `GEMINI_API_KEY` in the `.env` file first.
