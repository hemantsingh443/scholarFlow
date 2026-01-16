"""
LangGraph State Machine

Implements the Supervisor-Worker pattern for autonomous research:
- Supervisor/Router: Decides which node to execute next
- Planner: Generates research sub-questions
- Researcher: Searches and processes papers  
- Writer: Synthesizes final report
"""

from langgraph.graph import StateGraph, END
import logging

from app.agents.state import ResearchState
from app.agents.planner import plan_research
from app.agents.researcher import research_topic_sync
from app.agents.writer import write_report

logger = logging.getLogger(__name__)


def route_next_step(state: ResearchState) -> str:
    """
    Supervisor/Router: Decide which node to execute next.
    
    This implements the core routing logic:
    1. If complete or error -> END
    2. If no plan -> go to planner
    3. If more questions to research -> go to researcher
    4. Otherwise -> go to writer
    
    Args:
        state: Current research state
        
    Returns:
        Name of the next node to execute
    """
    # Check for completion or error
    if state.get("is_complete", False):
        logger.info("Research complete, ending workflow")
        return "end"
    
    if state.get("status") == "error":
        logger.warning("Error state detected, ending workflow")
        return "end"
    
    # Check if we need a plan
    if not state.get("plan"):
        logger.info("No plan exists, routing to planner")
        return "planner"
    
    # Check if we have more questions to research
    current_idx = state.get("current_task_index", 0)
    plan_length = len(state.get("plan", []))
    
    if current_idx < plan_length:
        logger.info(f"Research question {current_idx + 1}/{plan_length}, routing to researcher")
        return "researcher"
    
    # All questions answered, time to write
    logger.info("All questions researched, routing to writer")
    return "writer"


def create_research_graph() -> StateGraph:
    """
    Create the LangGraph state machine for research.
    
    The graph structure:
    
        START -> route -> planner -> route -> researcher -> route -> writer -> END
                   |                    ^           |
                   |                    |-----------|
                   v
                  END (on error/complete)
    
    Returns:
        Compiled LangGraph workflow
    """
    logger.info("Creating research workflow graph")
    
    # Initialize the graph with our state schema
    workflow = StateGraph(ResearchState)
    
    # Add nodes
    workflow.add_node("planner", plan_research)
    workflow.add_node("researcher", research_topic_sync)
    workflow.add_node("writer", write_report)
    
    # Set entry point - always start by routing
    workflow.set_entry_point("planner")
    
    # Add conditional edges from planner
    workflow.add_conditional_edges(
        "planner",
        route_next_step,
        {
            "planner": "planner",      # Retry planning if needed
            "researcher": "researcher", # Start researching
            "writer": "writer",         # Skip to writing (edge case)
            "end": END
        }
    )
    
    # Add conditional edges from researcher
    workflow.add_conditional_edges(
        "researcher",
        route_next_step,
        {
            "researcher": "researcher",  # More questions to research
            "writer": "writer",          # All questions done
            "end": END
        }
    )
    
    # Writer always ends
    workflow.add_edge("writer", END)
    
    logger.info("Research workflow graph created")
    
    return workflow.compile()


# Pre-compiled graph instance
research_graph = None


def get_research_graph():
    """Get or create the research graph singleton."""
    global research_graph
    if research_graph is None:
        research_graph = create_research_graph()
    return research_graph
