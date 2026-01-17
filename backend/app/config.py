import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()


class LLMConfig(BaseSettings):
    """OpenRouter LLM configuration with free open-source models."""
    
    BASE_URL: str = "https://openrouter.ai/api/v1"
    API_KEY: str = os.getenv("OPENROUTER_API_KEY", "")
    
    # Smart model for Planning/Synthesis - Xiaomi MiMo-V2-Flash
    # 309B MoE model, excellent for reasoning and agentic workflows
    SMART_MODEL: str = "xiaomi/mimo-v2-flash:free"
    
    # Fast model for Summarization/Extraction - Mistral Devstral
    # 123B model, optimized for coding and multi-file understanding
    FAST_MODEL: str = "mistralai/devstral-2512:free"
    
    class Config:
        env_prefix = "OPENROUTER_"


class Settings(BaseSettings):
    """Application settings."""
    
    # Frontend URL for CORS (set this in production)
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "")
    
    # ChromaDB persistence directory
    CHROMA_PERSIST_DIR: str = os.getenv("CHROMA_PERSIST_DIR", "./chroma_db")
    
    # Embedding model selection
    # Options:
    # - "sentence-transformers/all-MiniLM-L6-v2" (default, ~90MB, local)
    # - "sentence-transformers/paraphrase-MiniLM-L3-v2" (smaller, ~60MB, local)
    # - "default" (ChromaDB's default, no download required)
    EMBEDDING_MODEL: str = os.getenv(
        "EMBEDDING_MODEL", 
        "sentence-transformers/all-MiniLM-L6-v2"
    )
    
    # Use lightweight mode for resource-constrained environments (like Render free tier)
    # When True, uses ChromaDB's default embeddings (no model download)
    LIGHTWEIGHT_MODE: bool = os.getenv("LIGHTWEIGHT_MODE", "false").lower() == "true"
    
    # Skip vector store entirely (saves ~200MB RAM)
    # Auto-enabled when LIGHTWEIGHT_MODE is True, but can be set explicitly
    # When True: PDFs are still parsed and summarized, but not stored in ChromaDB
    # Report quality is maintained - summaries are passed directly to Writer
    SKIP_VECTOR_STORE: bool = os.getenv(
        "SKIP_VECTOR_STORE",
        os.getenv("LIGHTWEIGHT_MODE", "false")  # Inherit from LIGHTWEIGHT_MODE
    ).lower() == "true"
    
    # ArXiv rate limiting
    ARXIV_RATE_LIMIT_SECONDS: float = 3.0
    ARXIV_MAX_RESULTS: int = 10
    
    # PDF parsing
    PDF_CHUNK_SIZE: int = 1000
    PDF_CHUNK_OVERLAP: int = 200
    
    # Context limits to prevent token overflow
    MAX_CONTEXT_CHARS: int = 8000
    
    class Config:
        env_file = ".env"


settings = Settings()
llm_config = LLMConfig()

