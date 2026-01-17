import logging
from typing import Dict, Any, List
import asyncio
import gc

from app.agents.state import ResearchState
from app.tools.arxiv_search import arxiv_searcher
from app.tools.pdf_parser import pdf_parser
from app.config import settings
from app.llm.client import completion

logger = logging.getLogger(__name__)


async def emit_event(session_id: str, event_type: str, data: Dict[str, Any]):
    """Emit an event via the WebSocket manager."""
    try:
        from app.routers.websocket import manager
        await manager.send(session_id, {"type": event_type, **data})
    except Exception as e:
        logger.error(f"Failed to emit event {event_type}: {e}")


async def research_topic(state: ResearchState) -> Dict[str, Any]:
    """
    Execute research for the current plan item.
    
    This node:
    1. Gets the current question from the plan
    2. Searches ArXiv for relevant papers
    3. Downloads and parses the top papers
    4. Generates summaries using the "fast" model (Devstral)
    5. Stores chunks in ChromaDB for later retrieval
    
    Args:
        state: Current research state
        
    Returns:
        State updates with new documents and progress
    """
    current_idx = state.get("current_task_index", 0)
    session_id = state.get("session_id", "unknown")
    plan = state.get("plan", [])
    
    # Safety check
    if current_idx >= len(plan):
        logger.warning("No more questions to research")
        await emit_event(session_id, "status", {
            "phase": "writing",
            "message": "All research questions completed, preparing final report"
        })
        return {
            "status": "writing",
            "logs": ["All research questions completed, preparing final report"]
        }
    
    current_question = plan[current_idx]
    logger.info(f"Researching question {current_idx + 1}: {current_question}")
    
    # Emit starting event
    await emit_event(session_id, "researching", {
        "question_index": current_idx,
        "question": current_question,
        "total_questions": len(plan),
        "phase": "searching"
    })
    
    logs = []
    logs.append(f"🔍 Researching: {current_question}")
    
    new_documents = []
    
    try:
        # Step 1: Search ArXiv
        await emit_event(session_id, "activity", {
            "action": "searching",
            "message": f"Searching ArXiv for papers...",
            "detail": current_question[:60]
        })
        
        # Note: arxiv_searcher.search returns a list of dicts (or tuple if cached)
        papers = list(arxiv_searcher.search(current_question, max_results=3))
        logs.append(f" Found {len(papers)} papers on ArXiv")
        
        await emit_event(session_id, "activity", {
            "action": "found_papers",
            "message": f"Found {len(papers)} papers",
            "papers": [{"title": p["title"][:80], "id": p["arxiv_id"]} for p in papers]
        })
        
        if not papers:
            logs.append(" No papers found, moving to next question")
            await emit_event(session_id, "activity", {
                "action": "no_papers",
                "message": "No papers found, moving to next question"
            })
            return {
                "current_task_index": current_idx + 1,
                "status": "researching" if current_idx + 1 < len(plan) else "writing",
                "logs": logs
            }
        
        # Step 2: Process papers (limit to 1 in lightweight mode to save resources)
        papers_to_process = 1 if settings.LIGHTWEIGHT_MODE else 2
        for paper_idx, paper in enumerate(papers[:papers_to_process]):
            try:
                paper_title = paper["title"]
                paper_url = paper["pdf_url"]
                arxiv_id = paper["arxiv_id"]
                
                logs.append(f" Processing: {paper_title[:50]}...")
                
                # Emit downloading event
                await emit_event(session_id, "activity", {
                    "action": "downloading",
                    "message": f"Downloading PDF ({paper_idx + 1}/{papers_to_process})",
                    "paper": paper_title[:60],
                    "arxiv_id": arxiv_id
                })
                
                # Download and parse PDF (skip chunking if vector store is disabled)
                parsed = await pdf_parser.download_and_parse(
                    paper_url, 
                    skip_chunks=settings.SKIP_VECTOR_STORE
                )
                
                # Emit reading event
                await emit_event(session_id, "activity", {
                    "action": "reading",
                    "message": f"Reading {parsed['num_characters']} characters",
                    "paper": paper_title[:60],
                    "chars": parsed['num_characters']
                })
                
                # Emit summarizing event
                await emit_event(session_id, "activity", {
                    "action": "summarizing",
                    "message": "Generating AI summary...",
                    "paper": paper_title[:60]
                })
                
                # Generate summary using fast model (Devstral)
                summary_prompt = pdf_parser.get_summary_prompt(parsed["text_for_summary"])
                summary = completion(
                    prompt=summary_prompt,
                    model_type="fast"  # Use Devstral for summarization
                )
                
                # Store chunks in vector database (skip if SKIP_VECTOR_STORE is enabled)
                if not settings.SKIP_VECTOR_STORE:
                    await emit_event(session_id, "activity", {
                        "action": "storing",
                        "message": "Storing in vector database",
                        "paper": paper_title[:60]
                    })
                    
                    # Lazy import to avoid loading ChromaDB when not needed
                    from app.db.chroma import vector_store
                    vector_store.add_documents(
                        chunks=parsed["chunks"],
                        metadata={
                            "source_url": paper_url,
                            "title": paper_title,
                            "arxiv_id": arxiv_id
                        },
                        doc_id=arxiv_id
                    )
                else:
                    logger.info(f"Skipping vector storage (SKIP_VECTOR_STORE=true)")
                
                # Free memory from parsed content
                del parsed
                gc.collect()
                
                # Add to documents list (includes full reference info)
                new_documents.append({
                    "title": paper_title,
                    "summary": summary,
                    "pdf_url": paper_url,
                    "arxiv_id": arxiv_id,
                    "authors": paper.get("authors", [])
                })
                
                logs.append(f"Processed: {paper_title[:40]}...")
                
                await emit_event(session_id, "paper_complete", {
                    "title": paper_title,
                    "arxiv_id": arxiv_id,
                    "summary": summary[:200] + "..." if len(summary) > 200 else summary
                })
                
            except Exception as e:
                logger.error(f"Failed to process paper {paper.get('title', 'unknown')}: {e}")
                logs.append(f" Failed to process paper: {str(e)[:50]}")
                await emit_event(session_id, "activity", {
                    "action": "error",
                    "message": f"Failed to process: {str(e)[:50]}"
                })
                continue
        
        # Move to next question or writing phase
        next_idx = current_idx + 1
        is_last_question = next_idx >= len(plan)
        
        await emit_event(session_id, "question_complete", {
            "question_index": current_idx,
            "next_index": next_idx,
            "is_complete": is_last_question,
            "documents_found": len(new_documents)
        })
        
        return {
            "documents": new_documents,
            "current_task_index": next_idx,
            "status": "writing" if is_last_question else "researching",
            "logs": logs
        }
        
    except Exception as e:
        logger.error(f"Research error: {e}")
        await emit_event(session_id, "error", {
            "message": str(e),
            "question_index": current_idx
        })
        
        # Fail gracefully: log error and skip to next question
        next_idx = current_idx + 1
        is_last_question = next_idx >= len(plan)
        
        return {
            "current_task_index": next_idx,
            "status": "writing" if is_last_question else "researching",
            "logs": logs + [f"Error researching question {current_idx + 1}: {e}. Skipping to next."]
        }


# Alias for compatibility with graph.py which expects research_topic_sync
research_topic_sync = research_topic
