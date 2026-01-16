"""
Research State Schema

Defines the LangGraph state that is passed between all agent nodes.
This is the single source of truth for the research session.
"""

from typing import TypedDict, List, Annotated, Literal, Optional
import operator


class DocumentInfo(TypedDict):
    """Information about a processed research paper."""
    title: str
    summary: str
    pdf_url: str
    arxiv_id: str
    authors: Optional[List[str]]


class ResearchState(TypedDict):
    """
    The main state schema for the research workflow.
    
    This state is passed between all agent nodes and contains
    all the information needed to track the research session.
    """
    
    # ---- Core Data ----
    
    # The chat history (messages added via operator.add)
    messages: Annotated[List[dict], operator.add]
    
    # The current research plan (list of questions to answer)
    plan: List[str]
    
    # Context retrieved from papers (accumulated via operator.add)
    documents: Annotated[List[DocumentInfo], operator.add]
    
    # ---- Progress Tracking ----
    
    # Current position in the research plan
    current_task_index: int
    
    # Whether the research is complete
    is_complete: bool
    
    # Current status for UI updates
    status: Literal["planning", "researching", "reading", "writing", "completed", "error"]
    
    # Activity logs (accumulated via operator.add)
    logs: Annotated[List[str], operator.add]
    
    # ---- Session Metadata ----
    
    # Unique session identifier
    session_id: str
    
    # The original research query from the user
    original_query: str
    
    # ---- Error Handling ----
    
    # Error message if something went wrong
    error: Optional[str]


def create_initial_state(session_id: str, query: str) -> ResearchState:
    """
    Create a fresh initial state for a new research session.
    
    Args:
        session_id: Unique session identifier
        query: The user's research query
        
    Returns:
        Initial ResearchState
    """
    return {
        "messages": [],
        "plan": [],
        "documents": [],
        "current_task_index": 0,
        "is_complete": False,
        "status": "planning",
        "logs": [f"Starting research session for: {query}"],
        "session_id": session_id,
        "original_query": query,
        "error": None
    }
