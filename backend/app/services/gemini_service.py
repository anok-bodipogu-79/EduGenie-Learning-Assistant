from google import genai
from google.genai import types
from app.config.settings import settings
from app.utils.prompts import (
    QNA_SYSTEM_PROMPT,
    QUIZ_SYSTEM_PROMPT,
    SUMMARY_SYSTEM_PROMPT,
    LEARNING_PATH_SYSTEM_PROMPT
)
from app.utils.json_cleaner import clean_json_response

class GeminiService:
    def __init__(self):
        # We use gemini-2.5-flash as default in the new SDK
        self.model_name = "gemini-2.5-flash"
        self.has_key = bool(settings.GEMINI_API_KEY and settings.GEMINI_API_KEY != "YOUR_GEMINI_API_KEY_HERE")
        self.client = None
        if self.has_key:
            self.client = genai.Client(api_key=settings.GEMINI_API_KEY)

    def _generate(self, prompt: str, system_instruction: str, response_mime_type: str = None) -> str:
        """
        Helper method to call the new Gemini API or return mock if API key is not configured.
        """
        if not self.has_key or not self.client:
            raise ValueError("GEMINI_API_KEY is not configured. Please add your key to backend/.env")
        
        try:
            config = types.GenerateContentConfig(
                system_instruction=system_instruction
            )
            if response_mime_type:
                config.response_mime_type = response_mime_type

            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=config
            )
            return response.text
        except Exception as e:
            print(f"Error calling Gemini API: {e}")
            raise e

    def ask_question(self, question: str) -> str:
        """
        Asks a question using Gemini 2.5, falling back to mock response on API failure/quota limit.
        """
        if not self.has_key:
            return f"DEVELOPER MOCK RESPONSE: Gemini API is not configured. Your question was: '{question}'\n\nTo see real answers, please add a valid GEMINI_API_KEY in the backend/.env file."
        
        try:
            return self._generate(question, QNA_SYSTEM_PROMPT)
        except Exception as e:
            print(f"Gemini API rate limit/quota exceeded: {e}. Falling back to mock response.")
            return f"**NOTICE: Gemini API rate limit or quota exceeded. Showing fallback sample answer.**\n\nTo see live answers, wait a few minutes for rate limits to reset or provide a non-limited API key.\n\nHere is a general concept answer:\n* '{question}' is a key topic. Broadly, it represents a core structural concept in this subject field, which students master through practice and structured application."

    def generate_quiz(self, topic: str) -> list:
        """
        Generates exactly 3 MCQs in JSON structure on a topic using Gemini, with mock fallback on API failure.
        """
        mock_quiz = [
            {
                "question": f"What is a primary concept of {topic}?",
                "options": ["A basic building block", "An advanced structural layout", "A system error handler", "None of the above"],
                "correct_answer": "A basic building block"
            },
            {
                "question": f"Which of the following is commonly associated with {topic}?",
                "options": ["Compiler validation", "Data structures and logic", "Cloud computing resources", "All of the above"],
                "correct_answer": "All of the above"
            },
            {
                "question": f"Why do we study {topic} in computer science?",
                "options": ["To build complex systems", "To write cleaner code", "To improve algorithm design", "All of the above"],
                "correct_answer": "All of the above"
            }
        ]

        if not self.has_key:
            return mock_quiz

        try:
            raw_response = self._generate(f"Generate 3 MCQs on the topic: {topic}", QUIZ_SYSTEM_PROMPT, response_mime_type="application/json")
            return clean_json_response(raw_response)
        except Exception as e:
            print(f"Gemini API rate limit/quota exceeded: {e}. Falling back to mock quiz.")
            fallback_quiz = [dict(q) for q in mock_quiz]
            fallback_quiz[0]["question"] = f"⚠️ [Quota Exceeded - Showing Mock Quiz] " + fallback_quiz[0]["question"]
            return fallback_quiz

    def summarize_text(self, text: str) -> str:
        """
        Summarizes long text using Gemini 2.5, falling back to mock response on API failure.
        """
        if not self.has_key:
            return f"DEVELOPER MOCK RESPONSE: Gemini API is not configured.\n\nSummary of your text (truncated to 50 chars): '{text[:50]}...'\n\n* Key educational point 1: Summaries will condense paragraphs into core highlights.\n* Key educational point 2: Bullet points are automatically formatted for readability."

        try:
            return self._generate(text, SUMMARY_SYSTEM_PROMPT)
        except Exception as e:
            print(f"Gemini API rate limit/quota exceeded: {e}. Falling back to mock summary.")
            return f"**NOTICE: Gemini API rate limit or quota exceeded. Showing fallback sample summary.**\n\nSummary of your text:\n* '{text[:100]}...'\n* Bullet points are used to capture the main definitions and findings.\n* Review the original text above for complete details."

    def generate_learning_path(self, topic: str) -> list:
        """
        Generates a 3-stage learning roadmap using Gemini, falling back to mock roadmap on API failure.
        """
        mock_roadmap = [
            {
                "level": "Beginner",
                "topics": [f"Introduction to {topic}", "Core vocabulary and terminology", "First basic scripts/principles"]
            },
            {
                "level": "Intermediate",
                "topics": [f"Building simple {topic} systems", "Standard libraries and utilities", "Common design paradigms"]
            },
            {
                "level": "Advanced",
                "topics": [f"Optimization and advanced {topic} layouts", "Security and safety standards", "Deploying and scaling production systems"]
            }
        ]

        if not self.has_key:
            return mock_roadmap

        try:
            raw_response = self._generate(f"Generate a learning path for the topic: {topic}", LEARNING_PATH_SYSTEM_PROMPT, response_mime_type="application/json")
            return clean_json_response(raw_response)
        except Exception as e:
            print(f"Gemini API rate limit/quota exceeded: {e}. Falling back to mock roadmap.")
            fallback_roadmap = [dict(s) for s in mock_roadmap]
            fallback_roadmap[0]["topics"] = [f"⚠️ [Quota Exceeded - Showing Mock Roadmap]"] + fallback_roadmap[0]["topics"]
            return fallback_roadmap

# Instantiate singleton
gemini_service = GeminiService()
