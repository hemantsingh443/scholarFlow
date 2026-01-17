"""
Writer Node

The Writer synthesizes all research findings into a comprehensive
report with citations linking back to source papers.
"""

import logging
from typing import Dict, Any

from app.agents.state import ResearchState
from app.llm.client import completion
from app.config import settings

logger = logging.getLogger(__name__)


WRITER_SYSTEM_PROMPT = """You are an expert academic writer and research synthesizer.

Your role is to create comprehensive, well-structured research reports that:
1. Answer the original research question thoroughly
2. Synthesize findings from multiple papers
3. Include proper citations to source papers
4. Use clear, professional academic language
5. Organize information logically with headers and sections

Always cite sources using markdown links: [Paper Title](pdf_url)"""


WRITER_USER_PROMPT = """Create a comprehensive research report based on the following information:

## Original Research Question
{query}

## Research Plan (Questions Investigated)
{plan}

## Paper Summaries
{summaries}

## Relevant Context (from semantic search)
{context}

---

Write a well-structured research report that:
1. Opens with an executive summary
2. Has clear sections for each major finding
3. Includes inline citations linking to source PDFs
4. Ends with a "References" section listing all cited papers
5. Uses markdown formatting (headers, bullet points, bold for key terms)

Begin the report now:"""


def write_report(state: ResearchState) -> Dict[str, Any]:
    """
    Synthesize the final research report.
    
    This node:
    1. Retrieves relevant context via vector search
    2. Formats all paper summaries
    3. Uses the "smart" model (MiMo-V2-Flash) to write the report
    4. Returns the final report in the messages
    
    Args:
        state: Current research state
        
    Returns:
        State updates with the final report
    """
    query = state["original_query"]
    documents = state["documents"]
    plan = state["plan"]
    
    logger.info(f"Writing report for: {query}")
    logs = [" Synthesizing research report..."]
    
    try:
        # Step 1: Get relevant context via vector search (if enabled)
        if settings.SKIP_VECTOR_STORE:
            # No vector store - use paper summaries as context
            logger.info("Vector store disabled, using document summaries as context")
            context_text = "No vector search available - using paper summaries only."
            logs.append(" Vector store disabled, using paper summaries for context")
        else:
            # Lazy import to avoid loading ChromaDB when not needed
            from app.db.chroma import vector_store
            context_results = vector_store.query(query, n_results=10)
            context_text = "\n\n---\n\n".join([
                f"**Source:** {r['metadata'].get('title', 'Unknown')}\n\n{r['text']}"
                for r in context_results
            ])
            
            # Limit context size
            if len(context_text) > settings.MAX_CONTEXT_CHARS:
                context_text = context_text[:settings.MAX_CONTEXT_CHARS] + "\n\n[Additional context truncated]"
            
            logs.append(f" Retrieved {len(context_results)} relevant chunks from vector store")
        
        # Step 2: Format paper summaries
        if documents:
            summaries = "\n\n".join([
                f"### [{doc['title']}]({doc['pdf_url']})\n"
                f"**Authors:** {', '.join(doc.get('authors', ['Unknown'])[:3])}\n\n"
                f"{doc['summary']}"
                for doc in documents
            ])
        else:
            summaries = "No papers were successfully processed."
        
        # Step 3: Format plan
        plan_text = "\n".join([f"{i+1}. {q}" for i, q in enumerate(plan)])
        
        # Step 4: Generate the report using the smart model
        prompt = WRITER_USER_PROMPT.format(
            query=query,
            plan=plan_text,
            summaries=summaries,
            context=context_text
        )
        
        logs.append("Generating final report with MiMo-V2-Flash...")
        
        report = completion(
            prompt=prompt,
            model_type="smart",  # Use MiMo-V2-Flash for synthesis
            system_prompt=WRITER_SYSTEM_PROMPT
        )
        
        logs.append(" Research report completed!")
        
        # Step 5: Return the report
        return {
            "messages": [{"role": "assistant", "content": report}],
            "is_complete": True,
            "status": "completed",
            "logs": logs
        }
        
    except Exception as e:
        logger.error(f"Writer error: {e}")
        error_message = f"Failed to generate report: {str(e)}"
        
        # Create a fallback report from summaries
        if documents:
            fallback_report = f"""# Research Report: {query}

## Summary

An error occurred while generating the full report. Here are the paper summaries we found:

"""
            for doc in documents:
                fallback_report += f"""### [{doc['title']}]({doc['pdf_url']})

{doc['summary']}

---

"""
            return {
                "messages": [{"role": "assistant", "content": fallback_report}],
                "is_complete": True,
                "status": "completed",
                "error": error_message,
                "logs": logs + [f" Used fallback report due to error: {str(e)}"]
            }
        
        return {
            "is_complete": True,
            "status": "error",
            "error": error_message,
            "logs": logs + [f" Report generation failed: {str(e)}"]
        }
