import os
import sys
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend"))

from app.main import app

client = TestClient(app)

def test_explanation_endpoint():
    """
    Verifies that the POST /explain endpoint generates a topic explanation string.
    """
    response = client.post("/explain", json={"topic": "Recursion"})
    assert response.status_code == 200
    data = response.json()
    assert "explanation" in data
    assert isinstance(data["explanation"], str)
    assert len(data["explanation"]) > 0
