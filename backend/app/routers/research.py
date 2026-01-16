"""
Research API Endpoints

Provides REST API for the ScholarFlow research workflow:
- POST /research/start: Initialize a new research session
- POST /research/next-step: Trigger the next step in the workflow
- GET /session/{id}: Get full session state

Note: For real-time updates, use the WebSocket endpoint at /ws/research
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, List, Any
import uuid
import logging

from app.agents.state import ResearchState, create_initial_state
from app.agents.graph import get_research_graph

logger = logging.getLogger(__name__)

router = APIRouter()

# In-memory session storage
# Note: In production, use Redis or a database
sessions: Dict[str, ResearchState] = {}


class StartResearchRequest(BaseModel):
    """Request body for starting a new research session."""
    query: str
    model_config_override: Optional[str] = None


class NextStepRequest(BaseModel):
    """Request body for triggering the next workflow step."""
    session_id: str


class SessionResponse(BaseModel):
    """Response containing session state."""
    session_id: str
    status: str
    plan: List[str]
    current_task_index: int
    documents: List[Dict[str, Any]]
    logs: List[str]
    report: Optional[str] = None
    error: Optional[str] = None


@router.post("/research/start")
async def start_research(request: StartResearchRequest) -> Dict[str, Any]:
    """
    Initialize a new research session.
    
    Creates a new session, runs the planner to generate the research plan,
    and returns the session ID and initial plan.
    """
    session_id = str(uuid.uuid4())
    logger.info(f"Starting new research session: {session_id}")
    logger.info(f"Query: {request.query}")
    
    # Create initial state
    initial_state = create_initial_state(session_id, request.query)
    
    # Get the research graph
    graph = get_research_graph()
    
    try:
        # Run the planning step
        result = graph.invoke(initial_state)
        
        # Store the result
        sessions[session_id] = result
        
        logger.info(f"Session {session_id} planned with {len(result.get('plan', []))} questions")
        
        return {
            "session_id": session_id,
            "status": result.get("status", "unknown"),
            "initial_plan": result.get("plan", []),
            "logs": result.get("logs", [])
        }
        
    except Exception as e:
        logger.error(f"Failed to start research: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/research/next-step")
async def next_step(request: NextStepRequest) -> Dict[str, Any]:
    """
    Trigger the next tick of the research workflow.
    
    This allows stepped execution so the UI can show progress
    as each research question is processed.
    """
    session_id = request.session_id
    
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    state = sessions[session_id]
    
    # Check if already complete
    if state.get("is_complete", False):
        report = None
        if state.get("messages"):
            report = state["messages"][-1].get("content")
        
        return {
            "session_id": session_id,
            "status": "completed",
            "logs": state.get("logs", []),
            "report": report,
            "documents": [
                {"title": d["title"], "arxiv_id": d["arxiv_id"], "pdf_url": d["pdf_url"]}
                for d in state.get("documents", [])
            ]
        }
    
    # Get the graph and run the next step
    graph = get_research_graph()
    
    try:
        result = graph.invoke(state)
        sessions[session_id] = result
        
        # Prepare response
        response = {
            "session_id": session_id,
            "status": result.get("status", "unknown"),
            "logs": result.get("logs", []),
            "current_data": {
                "plan": result.get("plan", []),
                "current_task_index": result.get("current_task_index", 0),
                "documents": [
                    {"title": d["title"], "arxiv_id": d["arxiv_id"]}
                    for d in result.get("documents", [])
                ]
            }
        }
        
        # Include report if complete
        if result.get("is_complete") and result.get("messages"):
            response["report"] = result["messages"][-1].get("content")
        
        return response
        
    except Exception as e:
        logger.error(f"Failed to run next step: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/session/{session_id}")
async def get_session(session_id: str) -> SessionResponse:
    """
    Retrieve full session history and state.
    
    Returns all session data including the plan, documents,
    logs, and final report (if complete).
    """
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    state = sessions[session_id]
    
    # Get report if available
    report = None
    if state.get("is_complete") and state.get("messages"):
        report = state["messages"][-1].get("content")
    
    return SessionResponse(
        session_id=session_id,
        status=state.get("status", "unknown"),
        plan=state.get("plan", []),
        current_task_index=state.get("current_task_index", 0),
        documents=state.get("documents", []),
        logs=state.get("logs", []),
        report=report,
        error=state.get("error")
    )


@router.delete("/session/{session_id}")
async def delete_session(session_id: str) -> Dict[str, str]:
    """Delete a research session."""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    del sessions[session_id]
    logger.info(f"Deleted session: {session_id}")
    
    return {"message": "Session deleted", "session_id": session_id}


@router.get("/sessions")
async def list_sessions() -> Dict[str, Any]:
    """List all active sessions (for debugging)."""
    return {
        "count": len(sessions),
        "sessions": [
            {
                "session_id": sid,
                "status": state.get("status"),
                "query": state.get("original_query", "")[:50]
            }
            for sid, state in sessions.items()
        ]
    }
