import os
import sys
from fastapi.testclient import TestClient

                                    
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend"))

from app.main import app

client = TestClient(app)

def test_qna_endpoint():
    """
    Verifies that the POST /qa endpoint functions correctly and returns an answer.
    """
    response = client.post("/qa", json={"question": "What is the largest ocean on Earth?"})
    assert response.status_code == 200
    data = response.json()
    assert "answer" in data
    assert isinstance(data["answer"], str)
    assert len(data["answer"]) > 0
