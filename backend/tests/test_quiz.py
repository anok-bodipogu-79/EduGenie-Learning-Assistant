import os
import sys
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend"))

from app.main import app

client = TestClient(app)

def test_quiz_endpoint():
    """
    Verifies that the POST /quiz endpoint successfully generates 3 MCQ questions.
    """
    response = client.post("/quiz", json={"topic": "Python Programming"})
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 3
    for question in data:
        assert "question" in question
        assert "options" in question
        assert "correct_answer" in question
        assert len(question["options"]) == 4
        assert question["correct_answer"] in question["options"]
