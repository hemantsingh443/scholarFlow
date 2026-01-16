"""
WebSocket endpoint for real-time research updates.

Provides bidirectional communication for streaming research progress.
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, Set
import asyncio
import json
import logging
import uuid

from app.agents.state import create_initial_state
from app.agents.graph import get_research_graph

logger = logging.getLogger(__name__)

router = APIRouter()

# Active WebSocket connections per session
active_connections: Dict[str, Set[WebSocket]] = {}

# Session state storage
ws_sessions: Dict[str, dict] = {}


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


async def run_research_step_by_step(websocket: WebSocket, session_id: str, query: str):
    """
    Run research workflow and stream progress via WebSocket.
    
    Uses graph.stream() for step-by-step execution instead of invoke().
    """
    try:
        # Send initial message
        await websocket.send_json({
            "type": "started",
            "session_id": session_id,
            "message": "Research session started"
        })
        
        # Create initial state
        initial_state = create_initial_state(session_id, query)
        
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
                
                # Send update to client
                await websocket.send_json({
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
                
                # Small delay to ensure message is sent
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
        
        # Store final state
        ws_sessions[session_id] = current_state
        
        # Send completion
        await websocket.send_json({
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
        
    except WebSocketDisconnect:
        logger.info(f"Client disconnected from session {session_id}")
    except Exception as e:
        logger.error(f"Research error: {e}")
        try:
            await websocket.send_json({
                "type": "error",
                "message": str(e)
            })
        except:
            pass


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
        await run_research_step_by_step(websocket, session_id, query)
        
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected: {session_id}")
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
