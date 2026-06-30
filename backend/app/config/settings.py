import os
from dotenv import load_dotenv

# Find the absolute path to the .env file in the backend folder
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ENV_PATH = os.path.join(BASE_DIR, ".env")

# Load environment variables
load_dotenv(dotenv_path=ENV_PATH)

class Settings:
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./edugenie.db")
    LAMINI_MODEL_NAME: str = os.getenv("LAMINI_MODEL_NAME", "MBZUAI/LaMini-Flan-T5-77M")

settings = Settings()
