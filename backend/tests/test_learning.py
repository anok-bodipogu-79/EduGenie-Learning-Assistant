import os
import sys
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend"))

from app.main import app

client = TestClient(app)

def test_learning_endpoint():
    """
    Verifies that the POST /learn/recommendations endpoint returns a structured learning path roadmap.
    """
    response = client.post("/learn/recommendations", json={"topic": "Machine Learning"})
    assert response.status_code == 200
    data = response.json()
    assert "topic" in data
    assert "roadmap" in data
    assert data["topic"] == "Machine Learning"
    assert isinstance(data["roadmap"], list)
    assert len(data["roadmap"]) == 3
    for step in data["roadmap"]:
        assert "level" in step
        assert "topics" in step
        assert step["level"] in ["Beginner", "Intermediate", "Advanced", "General"]
        assert isinstance(step["topics"], list)
        assert len(step["topics"]) > 0
