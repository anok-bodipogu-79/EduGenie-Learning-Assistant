import os
from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware

from app.database.database import engine, Base
from app.routers import auth, qna, explanation, quiz, summary, learning_path, analytics

# Create SQLite database tables if they do not exist
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="EduGenie AI Educational Assistant",
    description="A production-ready AI-powered study companion utilizing Gemini 1.5 Pro and LaMini-Flan-T5.",
    version="1.0.0"
)

# Removed CORS Middleware: Application is a monolith, so CORS is unnecessary and insecure if misconfigured.

# Directories resolving
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEMPLATES_DIR = os.path.join(BASE_DIR, "templates")
STATIC_DIR = os.path.join(os.path.dirname(BASE_DIR), "static")

# Create static directories recursively if they don't exist
os.makedirs(os.path.join(STATIC_DIR, "css"), exist_ok=True)
os.makedirs(os.path.join(STATIC_DIR, "js"), exist_ok=True)
os.makedirs(os.path.join(STATIC_DIR, "images"), exist_ok=True)
os.makedirs(TEMPLATES_DIR, exist_ok=True)

# Mount Static Files
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# Configure Jinja2 templates
templates = Jinja2Templates(directory=TEMPLATES_DIR)

# Include API Routers
app.include_router(auth.router)
app.include_router(qna.router)
app.include_router(explanation.router)
app.include_router(quiz.router)
app.include_router(summary.router)
app.include_router(learning_path.router)
app.include_router(analytics.router)

@app.get("/")
def get_home_page(request: Request):
    """
    Renders the Single Page Application index.html template.
    """
    return templates.TemplateResponse(
        request=request,
        name="index.html",
        context={}
    )
