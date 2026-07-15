import os
import traceback
from app.config.settings import settings
from app.utils.prompts import EXPLAIN_SYSTEM_PROMPT

class LaMiniService:
    def __init__(self):
        self.model_name = settings.LAMINI_MODEL_NAME
        self.pipeline = None
        self.is_loaded = False
        self.fallback_active = False

    def _load_model(self):
        """
        Loads the HuggingFace transformers pipeline lazily.
        If packages are missing or model loading fails, activates Gemini fallback.
        """
        if self.is_loaded or self.fallback_active:
            return
        
        try:
            print(f"Loading local HuggingFace LaMini model: {self.model_name}...")
                                                                               
            import torch
            from transformers import pipeline
            
                                  
            device = 0 if torch.cuda.is_available() else -1
            print(f"LaMini running on device: {'GPU' if device == 0 else 'CPU'}")
            
            self.pipeline = pipeline(
                "text2text-generation",
                model=self.model_name,
                device=device,
                max_length=512
            )
            self.is_loaded = True
            print("Local LaMini model loaded successfully.")
        except ImportError:
            print("WARNING: 'transformers' or 'torch' package not found. Activating Gemini fallback for explanations.")
            self.fallback_active = True
        except Exception as e:
            print(f"WARNING: Failed to load local model {self.model_name}: {e}. Activating Gemini fallback.")
            traceback.print_exc()
            self.fallback_active = True

    def explain_topic(self, topic: str) -> str:
        """
        Explains an educational topic using the local LaMini model,
        or falls back to Gemini if the local model is unavailable.
        """
        self._load_model()
        
        if self.fallback_active or not self.is_loaded:
            print("Using Gemini fallback for explanation...")
            from app.services.gemini_service import gemini_service
            
            if not gemini_service.has_key:
                return (
                    f"DEVELOPER MOCK RESPONSE: Here is an explanation of '{topic}'.\n\n"
                    f"'{topic}' is a fundamental concept in this subject field. It represents a structured "
                    f"method of solving problems by breaking them down into simpler, smaller parts.\n\n"
                    f"For example, when teaching '{topic}', educators use step-by-step models and diagrams to "
                    f"ensure student comprehension.\n\n"
                    f"(Note: This is a mock fallback. To use active models, set GEMINI_API_KEY or install HuggingFace requirements.)"
                )
            
            try:
                                                                                 
                from google.genai import types
                response = gemini_service.client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=f"Explain the topic: {topic}",
                    config=types.GenerateContentConfig(
                        system_instruction=EXPLAIN_SYSTEM_PROMPT
                    )
                )
                return response.text
            except Exception as e:
                print(f"Gemini fallback failed: {e}")
                return (
                    f"**NOTICE: Gemini API rate limit or quota exceeded. Showing fallback sample explanation.**\n\n"
                    f"Here is a general explanation of '{topic}':\n\n"
                    f"'{topic}' is a core topic in this subject. It represents a structured approach "
                    f"used to decompose complex tasks into simpler, step-by-step subproblems that are easier "
                    f"to solve."
                )

        try:
                                                                                
            prompt = f"Explain the educational topic '{topic}' in simple terms for a student."
            res = self.pipeline(prompt)
            return res[0]['generated_text']
        except Exception as e:
            print(f"LaMini generation error: {e}. Falling back to Gemini service.")
            try:
                from app.services.gemini_service import gemini_service
                return gemini_service.ask_question(f"Explain the topic: {topic}. Use simple terms.")
            except Exception:
                return f"Error occurred during generation: {e}"

                       
lamini_service = LaMiniService()
