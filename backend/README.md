# ScholarFlow Backend

This is the backend service for ScholarFlow - an Agentic RAG system for academic research.

## Setup

```bash
# Activate virtual environment
.\env\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn app.main:app --reload
```

## Environment Variables

Create a `.env` file with:

```
OPENROUTER_API_KEY=your_api_key_here
```
