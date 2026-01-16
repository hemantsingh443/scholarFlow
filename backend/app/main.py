"""
ScholarFlow Backend

FastAPI application entry point for the ScholarFlow Agentic RAG system.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from app.routers import research
from app.routers import websocket
from app.config import llm_config, settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="ScholarFlow API",
    description="""
    Agentic RAG system for autonomous academic research.
    
    ScholarFlow uses a Plan-and-Execute architecture where an AI Planner
    orchestrates a Researcher to find, read, and synthesize ArXiv papers.
    
    ## Features
    
    -  Autonomous ArXiv paper search
    -  PDF parsing and chunking
    -  Vector-based semantic retrieval
    -  LLM-powered research synthesis
    
    ## Open Source Models
    
    - **Smart Model**: Xiaomi MiMo-V2-Flash (planning, synthesis)
    - **Fast Model**: Mistral Devstral-2512 (summarization)
    - **Embeddings**: Sentence Transformers all-MiniLM-L6-v2 (local)
    """,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
origins = [
    "http://localhost:5173",  # Vite dev server
    "http://localhost:3000",  # Alternative dev port
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]

# Add production frontend URL if configured
if settings.FRONTEND_URL:
    origins.append(settings.FRONTEND_URL)
    # Also add the non-https version or handle trailing slashes if needed, 
    # but exact match is standard.

# Fallback to allow all if expressly desired or for easier dev
origins.append("*")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(
    research.router,
    prefix="/api/v1",
    tags=["research"]
)

# WebSocket router (no prefix)
app.include_router(
    websocket.router,
    tags=["websocket"]
)


@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "name": "ScholarFlow API",
        "version": "1.0.0",
        "description": "Agentic RAG for Academic Research",
        "docs": "/docs",
        "models": {
            "smart": llm_config.SMART_MODEL,
            "fast": llm_config.FAST_MODEL
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "api_configured": bool(llm_config.API_KEY)
    }


@app.on_event("startup")
async def startup_event():
    """Run on application startup."""
    logger.info("=" * 50)
    logger.info("ScholarFlow API Starting")
    logger.info("=" * 50)
    logger.info(f"Smart Model: {llm_config.SMART_MODEL}")
    logger.info(f"Fast Model: {llm_config.FAST_MODEL}")
    
    if not llm_config.API_KEY:
        logger.warning("  OPENROUTER_API_KEY not set! API calls will fail.")
    else:
        logger.info(" OpenRouter API key configured")
    
    logger.info("=" * 50)


@app.on_event("shutdown")
async def shutdown_event():
    """Run on application shutdown."""
    logger.info("ScholarFlow API Shutting Down")
