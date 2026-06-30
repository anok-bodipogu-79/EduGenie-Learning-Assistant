import os
import sys
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend"))

from app.main import app

client = TestClient(app)

def test_summary_endpoint():
    """
    Verifies that the POST /summarize endpoint works and outputs a summary string.
    """
    long_text = "FastAPI is a modern, fast (high-performance), web framework for building APIs with Python 3.8+ based on standard Python type hints. The key features are: Fast: Very high performance, on par with NodeJS and Go. Fast to code: Increase the speed to develop features by about 200% to 300%."
    response = client.post("/summarize", json={"text": long_text})
    assert response.status_code == 200
    data = response.json()
    assert "summary" in data
    assert isinstance(data["summary"], str)
    assert len(data["summary"]) > 0
