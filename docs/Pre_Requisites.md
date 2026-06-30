# Pre-Requisites & Installation

To run the EduGenie Learning Assistant locally, follow the steps below.

## System Prerequisites
- **Python**: Version 3.8 or higher.
- **Node.js** (Optional): Only if compiling or running advanced frontend development features.
- **Hardware**: At least 4GB of RAM is recommended to run local LaMini models. CUDA-compatible GPU is supported automatically if PyTorch and CUDA drivers are configured.

## Configuration Setup

1. **Obtain Gemini API Key**:
   - Go to Google AI Studio.
   - Create a free developer API key.

2. **Set up Environment Variables**:
   - Create or edit the `.env` file in the `backend/` directory:
     ```env
     GEMINI_API_KEY=your_actual_api_key_here
     DATABASE_URL=sqlite:///./edugenie.db
     LAMINI_MODEL_NAME=MBZUAI/LaMini-Flan-T5-77M
     ```

## Package Installation

Open your terminal, navigate to the `backend/` directory, and run:
```bash
pip install -r requirements.txt
```

> [!NOTE]
> Installing `torch` and `transformers` might take several minutes depending on your internet connection.
> If you do not wish to run the local HuggingFace model, you can exclude `torch` and `transformers` from installation. The application will log a warning and fall back to using your Gemini API key for explanation outputs.

## Running the Application

1. **Start FastAPI Uvicorn Server**:
   ```bash
   uvicorn app.main:app --reload
   ```
2. **Access Web Portal**:
   - Open your browser and go to `http://127.0.0.1:8000`.
