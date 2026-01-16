"""
WebSocket endpoint for real-time research updates.

Provides bidirectional communication for streaming research progress.
Also includes REST endpoints for session retrieval and PDF download.
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.responses import Response
from typing import Dict, Set
import asyncio
import json
import logging
import uuid

from app.agents.state import create_initial_state
from app.agents.graph import get_research_graph
from app.tools.pdf_report import markdown_to_pdf

logger = logging.getLogger(__name__)

router = APIRouter()

# Active WebSocket connections per session
active_connections: Dict[str, Set[WebSocket]] = {}

# Session state storage (in-memory, persists as long as server is running)
ws_sessions: Dict[str, dict] = {}

# Track if client is still connected
client_connected: Dict[str, bool] = {}


class ConnectionManager:
    """Manages WebSocket connections for research sessions."""
    
    def __init__(self):
        self.connections: Dict[str, WebSocket] = {}
    
    async def connect(self, websocket: WebSocket, session_id: str):
        await websocket.accept()
        self.connections[session_id] = websocket
        logger.info(f"WebSocket connected for session: {session_id}")
    
    def disconnect(self, session_id: str):
        if session_id in self.connections:
            del self.connections[session_id]
            logger.info(f"WebSocket disconnected for session: {session_id}")
    
    async def send(self, session_id: str, message: dict):
        if session_id in self.connections:
            try:
                await self.connections[session_id].send_json(message)
            except Exception as e:
                logger.error(f"Failed to send WebSocket message: {e}")
                self.disconnect(session_id)


manager = ConnectionManager()


async def safe_send(websocket: WebSocket, session_id: str, message: dict) -> bool:
    """
    Safely send a message via WebSocket.
    Returns True if sent successfully, False if client disconnected.
    Does NOT raise exceptions - allows caller to continue processing.
    """
    if not client_connected.get(session_id, True):
        return False
    
    try:
        await websocket.send_json(message)
        return True
    except Exception as e:
        logger.info(f"Client disconnected from session {session_id}")
        client_connected[session_id] = False
        return False


# ============================================
# REST Endpoints for Session Persistence
# ============================================

@router.get("/api/session/{session_id}")
async def get_session(session_id: str):
    """
    Retrieve a session by ID.
    
    Used by frontend to restore session state after page refresh.
    """
    if session_id not in ws_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = ws_sessions[session_id]
    
    # Prepare response (same format as WebSocket progress messages)
    return {
        "session_id": session_id,
        "status": session.get("status", "unknown"),
        "plan": session.get("plan", []),
        "current_task_index": session.get("current_task_index", 0),
        "documents": [
            {
                "title": d.get("title", ""),
                "arxiv_id": d.get("arxiv_id", ""),
                "pdf_url": d.get("pdf_url", ""),
                "summary": d.get("summary", "")[:200] if d.get("summary") else ""
            }
            for d in session.get("documents", [])
        ],
        "report": session.get("report"),
        "original_query": session.get("original_query", "")
    }


@router.get("/api/session/{session_id}/pdf")
async def download_session_pdf(session_id: str):
    """
    Download the session report as PDF.
    """
    if session_id not in ws_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = ws_sessions[session_id]
    report = session.get("report")
    
    if not report:
        raise HTTPException(status_code=400, detail="No report available for this session")
    
    # Generate PDF
    try:
        query = session.get("original_query", "Research Report")
        pdf_bytes = markdown_to_pdf(report, title=f"ScholarFlow: {query[:50]}")
        
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="scholarflow_report_{session_id[:8]}.pdf"'
            }
        )
    except Exception as e:
        logger.error(f"PDF generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")


@router.get("/api/sessions")
async def list_sessions():
    """
    List all active sessions (for debugging).
    """
    return {
        "count": len(ws_sessions),
        "sessions": [
            {
                "session_id": sid,
                "status": session.get("status"),
                "query": session.get("original_query", "")[:50]
            }
            for sid, session in ws_sessions.items()
        ]
    }


# ============================================
# WebSocket Research Endpoint
# ============================================

async def run_research_step_by_step(websocket: WebSocket, session_id: str, query: str):
    """
    Run research workflow and stream progress via WebSocket.
    
    Uses graph.stream() for step-by-step execution instead of invoke().
    Stores session state after each node for persistence.
    
    IMPORTANT: Continues processing even if WebSocket disconnects,
    so polling can retrieve the final result.
    """
    # Mark client as connected
    client_connected[session_id] = True
    
    try:
        # Send initial message (non-fatal if fails)
        await safe_send(websocket, session_id, {
            "type": "started",
            "session_id": session_id,
            "message": "Research session started"
        })
        
        # Create initial state
        initial_state = create_initial_state(session_id, query)
        
        # Store initial state immediately for persistence
        ws_sessions[session_id] = {
            **initial_state,
            "original_query": query,
            "status": "planning"
        }
        
        # Get the research graph
        graph = get_research_graph()
        
        # Stream the graph execution - this yields after each node
        step_count = 0
        current_state = initial_state
        
        # Use stream() instead of invoke() for step-by-step updates
        async for event in graph.astream(initial_state, stream_mode="updates"):
            step_count += 1
            
            # Extract node name and state update
            for node_name, state_update in event.items():
                logger.info(f"Step {step_count}: {node_name}")
                
                # Merge state updates
                if isinstance(state_update, dict):
                    for key, value in state_update.items():
                        if key == "documents" and isinstance(value, list):
                            # Append documents
                            current_docs = current_state.get("documents", [])
                            current_state["documents"] = current_docs + value
                        elif key == "logs" and isinstance(value, list):
                            # Append logs
                            current_logs = current_state.get("logs", [])
                            current_state["logs"] = current_logs + value
                        else:
                            current_state[key] = value
                
                # *** PERSISTENCE: Store state after EACH node ***
                ws_sessions[session_id] = {
                    **current_state,
                    "original_query": query,
                    "status": current_state.get("status", "unknown")
                }
                
                # Try to send update to client (continues even if fails)
                await safe_send(websocket, session_id, {
                    "type": "progress",
                    "node": node_name,
                    "step": step_count,
                    "status": current_state.get("status", "unknown"),
                    "plan": current_state.get("plan", []),
                    "current_task_index": current_state.get("current_task_index", 0),
                    "documents": [
                        {"title": d.get("title", ""), "arxiv_id": d.get("arxiv_id", "")}
                        for d in current_state.get("documents", [])
                    ],
                    "logs": current_state.get("logs", [])[-5:]  # Last 5 logs
                })
                
                # Small delay
                await asyncio.sleep(0.05)
        
        # Get final report
        report = None
        if current_state.get("messages"):
            messages = current_state["messages"]
            if messages and len(messages) > 0:
                last_msg = messages[-1]
                if isinstance(last_msg, dict):
                    report = last_msg.get("content", "")
                elif hasattr(last_msg, "content"):
                    report = last_msg.content
        
        # *** PERSISTENCE: Store final state with report ***
        ws_sessions[session_id] = {
            **current_state,
            "original_query": query,
            "status": "completed",
            "report": report
        }
        
        logger.info(f"Research completed for session {session_id}")
        
        # Try to send completion (continues even if fails)
        await safe_send(websocket, session_id, {
            "type": "completed",
            "session_id": session_id,
            "report": report,
            "documents": [
                {
                    "title": d.get("title", ""),
                    "arxiv_id": d.get("arxiv_id", ""),
                    "pdf_url": d.get("pdf_url", ""),
                    "summary": d.get("summary", "")[:200] if d.get("summary") else ""
                }
                for d in current_state.get("documents", [])
            ]
        })
        
    except Exception as e:
        logger.error(f"Research error: {e}")
        # Store error state
        ws_sessions[session_id] = {
            **ws_sessions.get(session_id, {}),
            "status": "error",
            "error": str(e)
        }
        # Try to send error (non-fatal if fails)
        await safe_send(websocket, session_id, {
            "type": "error",
            "message": str(e)
        })
    finally:
        # Cleanup
        client_connected.pop(session_id, None)


@router.websocket("/ws/research")
async def websocket_research(websocket: WebSocket):
    """
    WebSocket endpoint for research sessions.
    
    Protocol:
    1. Client sends: {"action": "start", "query": "..."}
    2. Server streams progress updates
    3. Server sends completion with report
    """
    await websocket.accept()
    session_id = str(uuid.uuid4())
    
    try:
        # Wait for initial message with query
        data = await websocket.receive_json()
        
        if data.get("action") != "start" or not data.get("query"):
            await websocket.send_json({
                "type": "error",
                "message": "Expected {action: 'start', query: '...'}"
            })
            await websocket.close()
            return
        
        query = data["query"]
        logger.info(f"Starting WebSocket research: {session_id} - {query}")
        
        # Run research with streaming updates
        # This will continue even if the WebSocket disconnects
        await run_research_step_by_step(websocket, session_id, query)
        
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected: {session_id}")
        # Mark as disconnected so safe_send stops trying
        client_connected[session_id] = False
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        try:
            await websocket.send_json({
                "type": "error",
                "message": str(e)
            })
        except:
            pass
    finally:
        manager.disconnect(session_id)
