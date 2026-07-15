import os
from dotenv import load_dotenv

                                                               
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PROJECT_ROOT = os.path.dirname(BASE_DIR)
ENV_PATH = os.path.join(PROJECT_ROOT, ".env")

                            
load_dotenv(dotenv_path=ENV_PATH)

class Settings:
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./data/edugenie.db")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "edugenie_insecure_dev_key_change_in_prod")
    LAMINI_MODEL_NAME: str = os.getenv("LAMINI_MODEL_NAME", "MBZUAI/LaMini-Flan-T5-77M")

settings = Settings()
