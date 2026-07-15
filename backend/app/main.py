import os
from fastapi import FastAPI, Request # type: ignore
from fastapi.staticfiles import StaticFiles # type: ignore
from fastapi.templating import Jinja2Templates # type: ignore
from fastapi.middleware.cors import CORSMiddleware # type: ignore

from app.database.database import engine, Base
from app.routes import auth, qna, explanation, quiz, summary, learning_path, analytics

                                                    
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="EduGenie AI Educational Assistant",
    description="A production-ready AI-powered study companion utilizing Gemini 1.5 Pro and LaMini-Flan-T5.",
    version="1.0.0"
)

                                                                                                           

                       
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(os.path.dirname(BASE_DIR))
TEMPLATES_DIR = os.path.join(PROJECT_ROOT, "Frontend", "templates")
STATIC_DIR = os.path.join(PROJECT_ROOT, "Frontend", "static")

                                                           
os.makedirs(os.path.join(STATIC_DIR, "css"), exist_ok=True)
os.makedirs(os.path.join(STATIC_DIR, "js"), exist_ok=True)
os.makedirs(os.path.join(STATIC_DIR, "images"), exist_ok=True)
os.makedirs(TEMPLATES_DIR, exist_ok=True)

                    
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

                            
templates = Jinja2Templates(directory=TEMPLATES_DIR)

                     
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
