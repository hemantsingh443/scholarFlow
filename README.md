# ScholarFlow

**Autonomous AI Research Assistant** — An agentic RAG system that searches, reads, and synthesizes academic papers from ArXiv into comprehensive research reports.

![React](https://img.shields.io/badge/React-19-blue?logo=react)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109-green?logo=fastapi)
![LangGraph](https://img.shields.io/badge/LangGraph-Agentic-purple)
![License](https://img.shields.io/badge/License-MIT-yellow)

> **Note: Deployed Version Limitations**
>
> The live demo runs on **Render's free tier** (512MB RAM, shared CPU), which causes:
>
> - **Slow startup** — Server sleeps after inactivity, first request takes 30-60s to wake
> - **Memory constraints** — Large PDFs (>3MB) and long papers are skipped
> - **Potential crashes** — Heavy queries may exceed memory limits
> - **No vector storage** — Embeddings are disabled to save memory
>
> **For the best experience, run locally.** Local setup has no restrictions, uses full vector search, and processes all PDFs completely.

---

## Features

### Autonomous Research Agents

- **Planner Agent** — Breaks down research queries into focused sub-questions
- **Researcher Agent** — Searches ArXiv, downloads PDFs, extracts key insights
- **Writer Agent** — Synthesizes findings into structured markdown reports

### Real-Time Updates

- **WebSocket streaming** — Live progress updates as agents work
- **Fallback polling** — Automatic recovery if connection drops
- **Activity feed** — See exactly what the AI is doing in real-time

### Session Persistence

- **Auto-save** — Sessions survive page refresh or browser close
- **History** — Access up to 10 previous research sessions
- **Resume** — Pick up where you left off on disconnection

### Export Options

- **Markdown download** — Get the raw report for editing
- **PDF export** — Professional formatted PDF output

### Modern UI

- **Dark/Light mode** — System-aware with manual toggle
- **Editorial design** — Warm cream palette with scholarly typography
- **Responsive** — Works on desktop, tablet, and mobile

### 100% Free Models

- **MiMo-V2-Flash** (Xiaomi) — Planning and synthesis
- **Devstral-2512** (Mistral) — Fast summarization
- **all-MiniLM-L6-v2** — Local embeddings (Sentence Transformers)

---

## Architecture

```
                         Frontend (React)
  +----------------------------------------------------------+
  |  Research Input  |  Activity Feed  |  Report Viewer      |
  +--------+---------+--------+--------+---------------------+
           |                  |
           +--------+---------+
                    | WebSocket / REST
                    v
                         Backend (FastAPI)
  +----------------------------------------------------------+
  |                   LangGraph Workflow                      |
  |  +----------+    +------------+    +---------+           |
  |  | Planner  |--->| Researcher |--->|  Writer |           |
  |  +----------+    +-----+------+    +---------+           |
  |                        |                                  |
  |         +--------------+--------------+                   |
  |         v              v              v                   |
  |    +---------+   +-----------+   +----------+            |
  |    |  ArXiv  |   | PDF Parse |   | ChromaDB |            |
  |    |  Search |   | (PyMuPDF) |   | (Vector) |            |
  |    +---------+   +-----------+   +----------+            |
  +----------------------------------------------------------+
  |  OpenRouter API (LLMs)  |  Session Store  |  PDF Export  |
  +----------------------------------------------------------+
```

---

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- OpenRouter API Key (https://openrouter.ai/ - free tier available)

### 1. Clone the Repository

```bash
git clone https://github.com/hemantsingh443/scholarFlow.git
cd scholarFlow
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv ../env
source ../env/bin/activate  # Windows: ..\env\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp ../.env.example ../.env
# Edit .env and add your OPENROUTER_API_KEY

# Run the server
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

### 4. Open the App

Navigate to `http://localhost:5173` and start researching.

---

## Configuration

### Environment Variables

#### Backend (`.env` in project root)

```env
OPENROUTER_API_KEY=sk-or-v1-your-api-key-here

# Optional
LIGHTWEIGHT_MODE=false          # Set true for free tier deployments
CHROMA_PERSIST_DIR=./chroma_db  # Vector database location
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
```

#### Frontend (`frontend/.env`)

```env
VITE_API_URL=https://your-api-url.com  # Production only
```

---

## Project Structure

```
scholarFlow/
├── backend/
│   ├── app/
│   │   ├── agents/           # LangGraph workflow nodes
│   │   │   ├── graph.py      # Main workflow graph
│   │   │   ├── planner.py    # Research planning
│   │   │   ├── researcher.py # Paper search & analysis
│   │   │   ├── writer.py     # Report synthesis
│   │   │   └── state.py      # State schema
│   │   ├── db/
│   │   │   └── chroma.py     # Vector store (ChromaDB)
│   │   ├── llm/
│   │   │   └── client.py     # OpenRouter LLM client
│   │   ├── routers/
│   │   │   ├── research.py   # REST API endpoints
│   │   │   └── websocket.py  # WebSocket + session APIs
│   │   ├── tools/
│   │   │   ├── arxiv_search.py  # ArXiv paper search
│   │   │   ├── pdf_parser.py    # PDF extraction
│   │   │   └── pdf_report.py    # PDF generation
│   │   ├── config.py         # Settings & env vars
│   │   └── main.py           # FastAPI app entry
│   ├── Dockerfile
│   ├── render.yaml           # Render deployment config
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── research.js   # API client
│   │   ├── components/
│   │   │   ├── AgentActivity.jsx   # Main activity panel
│   │   │   ├── ResearchInput.jsx   # Search input
│   │   │   ├── ResearchReport.jsx  # Report display
│   │   │   └── ThoughtProcess.jsx  # Plan progress
│   │   ├── hooks/
│   │   │   └── useResearch.js      # Research state hook
│   │   ├── App.jsx           # Main app component
│   │   └── index.css         # Global styles
│   ├── vercel.json           # Vercel config
│   └── package.json
│
├── .env.example
├── .gitignore
└── README.md
```

---

## API Reference

### WebSocket Endpoint

```
WS /ws/research
```

**Client to Server:**

```json
{ "action": "start", "query": "Your research question" }
```

**Server to Client (Progress):**

```json
{
  "type": "progress",
  "node": "researcher",
  "status": "researching",
  "current_task_index": 2,
  "plan": ["Question 1", "Question 2", "..."],
  "documents": [{ "title": "...", "arxiv_id": "..." }]
}
```

**Server to Client (Complete):**

```json
{
  "type": "completed",
  "report": "# Research Report\n...",
  "documents": [...]
}
```

### REST Endpoints

| Method | Endpoint                 | Description                  |
| ------ | ------------------------ | ---------------------------- |
| GET    | `/health`                | Health check                 |
| GET    | `/api/session/{id}`      | Get session state            |
| GET    | `/api/session/{id}/pdf`  | Download PDF report          |
| GET    | `/api/sessions`          | List all sessions            |
| POST   | `/api/v1/research/start` | Start research (alternative) |

---

## Development

### Running Tests

```bash
cd backend
pytest tests/
```

### Linting

```bash
cd frontend
npm run lint
```

### Building for Production

```bash
cd frontend
npm run build  # Output in dist/
```

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open a Pull Request

---

## License

MIT License — see LICENSE for details.

---

## Acknowledgments

- OpenRouter — Free LLM API access
- ArXiv — Open access academic papers
- LangGraph — Agentic workflow framework
- ChromaDB — Vector database
- Lucide — Icon library

---

Made by Hemant Singh (https://github.com/hemantsingh443)
